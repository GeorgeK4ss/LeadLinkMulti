import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  documentId,
  WriteBatch,
  writeBatch,
  serverTimestamp,
  DocumentReference,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';
import { cacheService, CacheCollection } from './CacheService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sync operation type enum
 */
export enum SyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

/**
 * Sync operation status enum
 */
export enum SyncOperationStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict'
}

/**
 * Sync conflict resolution strategy enum
 */
export enum ConflictResolutionStrategy {
  CLIENT_WINS = 'client_wins',
  SERVER_WINS = 'server_wins',
  MANUAL = 'manual'
}

/**
 * Network status enum
 */
export enum NetworkStatus {
  ONLINE = 'online',
  OFFLINE = 'offline'
}

/**
 * Sync operation interface
 */
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  collectionName: string;
  documentId: string;
  data?: any;
  status: SyncOperationStatus;
  timestamp: number;
  retryCount: number;
  error?: string;
  conflictData?: any;
  tenantId?: string;
  userId?: string;
}

/**
 * Sync config interface
 */
export interface SyncConfig {
  maxRetries: number;
  syncInterval: number;
  conflictResolution: ConflictResolutionStrategy;
  batchSize: number;
  debug: boolean;
}

/**
 * Sync data service for handling offline operations and synchronization
 */
export class SyncService {
  private db: Firestore;
  private config: SyncConfig;
  private syncOperations: Map<string, SyncOperation> = new Map();
  private syncIntervalId: NodeJS.Timeout | null = null;
  private collections: Set<string> = new Set();
  private cacheCollections: Map<string, CacheCollection<any>> = new Map();
  private networkStatus: NetworkStatus = NetworkStatus.ONLINE;
  private initialized = false;
  private syncing = false;
  private syncQueueKey = 'leadlink_sync_queue';
  
  // Event callbacks
  private onSyncCompletedCallbacks: Array<(operations: SyncOperation[]) => void> = [];
  private onSyncFailedCallbacks: Array<(operations: SyncOperation[], error: Error) => void> = [];
  private onConflictCallbacks: Array<(operation: SyncOperation) => void> = [];
  private onNetworkStatusChangeCallbacks: Array<(status: NetworkStatus) => void> = [];
  
  constructor(config?: Partial<SyncConfig>) {
    this.db = db;
    this.config = {
      maxRetries: 5,
      syncInterval: 30000, // 30 seconds
      conflictResolution: ConflictResolutionStrategy.SERVER_WINS,
      batchSize: 50,
      debug: false,
      ...config
    };
    
    // Initialize network status listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }
  
  /**
   * Initialize the sync service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    // Initialize cache service
    await cacheService.initialize();
    
    // Load pending sync operations from storage
    await this.loadSyncQueue();
    
    // Set initial network status
    this.networkStatus = typeof navigator !== 'undefined' && navigator.onLine
      ? NetworkStatus.ONLINE
      : NetworkStatus.OFFLINE;
    
    // Start sync interval
    this.startSyncInterval();
    
    this.initialized = true;
    
    // Attempt an initial sync
    if (this.networkStatus === NetworkStatus.ONLINE) {
      this.syncNow().catch(error => {
        console.error('Initial sync failed:', error);
      });
    }
  }
  
  /**
   * Register a collection for synchronization
   * @param collectionName Collection name
   * @param ttl Optional cache TTL for this collection
   */
  registerCollection(collectionName: string, ttl?: number): void {
    this.ensureInitialized();
    
    if (!this.collections.has(collectionName)) {
      this.collections.add(collectionName);
      
      // Create a cache collection for this collection
      const cacheCollection = new CacheCollection(cacheService, collectionName, ttl);
      this.cacheCollections.set(collectionName, cacheCollection);
      
      this.log(`Registered collection for sync: ${collectionName}`);
    }
  }
  
  /**
   * Perform a create operation
   * @param collectionName Collection name
   * @param data Document data
   * @param tenantId Optional tenant ID
   * @param userId Optional user ID
   * @returns Promise with operation result
   */
  async create(
    collectionName: string,
    data: any,
    tenantId?: string,
    userId?: string
  ): Promise<any> {
    this.ensureInitialized();
    this.ensureCollectionRegistered(collectionName);
    
    // Generate a client-side ID for the document
    const docId = data.id || uuidv4();
    const docWithId = { ...data, id: docId };
    
    // Add metadata
    if (tenantId) {
      docWithId.tenantId = tenantId;
    }
    
    const now = new Date();
    docWithId.createdAt = now;
    docWithId.updatedAt = now;
    
    if (userId) {
      docWithId.createdBy = userId;
      docWithId.updatedBy = userId;
    }
    
    // If online, try to create the document directly
    if (this.networkStatus === NetworkStatus.ONLINE) {
      try {
        const docRef = doc(this.db, collectionName, docId);
        const dataToSave = { ...docWithId };
        delete dataToSave.id; // Remove id as it's in the reference
        
        await setDoc(docRef, dataToSave);
        
        // Cache the created document
        this.cacheCollections.get(collectionName)?.set(docWithId);
        
        this.log(`Document created online: ${collectionName}/${docId}`);
        
        return docWithId;
      } catch (error) {
        console.error(`Error creating document ${collectionName}/${docId}:`, error);
        
        // Fall back to offline operation if creation failed
        this.log(`Falling back to offline creation for: ${collectionName}/${docId}`);
      }
    }
    
    // Add to sync queue
    const operation: SyncOperation = {
      id: uuidv4(),
      type: SyncOperationType.CREATE,
      collectionName,
      documentId: docId,
      data: docWithId,
      status: SyncOperationStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      tenantId,
      userId
    };
    
    this.addOperation(operation);
    
    // Cache the document
    this.cacheCollections.get(collectionName)?.set(docWithId);
    
    this.log(`Document creation queued: ${collectionName}/${docId}`);
    
    return docWithId;
  }
  
  /**
   * Perform an update operation
   * @param collectionName Collection name
   * @param docId Document ID
   * @param data Update data
   * @param tenantId Optional tenant ID
   * @param userId Optional user ID
   * @returns Promise with operation result
   */
  async update(
    collectionName: string,
    docId: string,
    data: any,
    tenantId?: string,
    userId?: string
  ): Promise<any> {
    this.ensureInitialized();
    this.ensureCollectionRegistered(collectionName);
    
    // Add metadata
    const updateData = { ...data };
    updateData.updatedAt = new Date();
    
    if (userId) {
      updateData.updatedBy = userId;
    }
    
    // If online, try to update the document directly
    if (this.networkStatus === NetworkStatus.ONLINE) {
      try {
        const docRef = doc(this.db, collectionName, docId);
        await updateDoc(docRef, updateData);
        
        // Get the updated document
        const docSnap = await getDoc(docRef);
        const updatedDoc = { id: docId, ...docSnap.data() };
        
        // Cache the updated document
        this.cacheCollections.get(collectionName)?.set(updatedDoc);
        
        this.log(`Document updated online: ${collectionName}/${docId}`);
        
        return updatedDoc;
      } catch (error) {
        console.error(`Error updating document ${collectionName}/${docId}:`, error);
        
        // Fall back to offline operation if update failed
        this.log(`Falling back to offline update for: ${collectionName}/${docId}`);
      }
    }
    
    // Get the current document from cache
    const cachedDoc = this.cacheCollections.get(collectionName)?.getById(docId);
    
    if (!cachedDoc) {
      throw new Error(`Cannot update document ${docId} in collection ${collectionName} - not found in cache.`);
    }
    
    // Merge the update with the cached document
    const updatedDoc = {
      ...cachedDoc,
      ...updateData
    };
    
    // Add to sync queue
    const operation: SyncOperation = {
      id: uuidv4(),
      type: SyncOperationType.UPDATE,
      collectionName,
      documentId: docId,
      data: updatedDoc,
      status: SyncOperationStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      tenantId,
      userId
    };
    
    this.addOperation(operation);
    
    // Update the cache
    this.cacheCollections.get(collectionName)?.set(updatedDoc);
    
    this.log(`Document update queued: ${collectionName}/${docId}`);
    
    return updatedDoc;
  }
  
  /**
   * Perform a delete operation
   * @param collectionName Collection name
   * @param docId Document ID
   * @param tenantId Optional tenant ID
   * @param userId Optional user ID
   * @returns Promise with operation result
   */
  async delete(
    collectionName: string,
    docId: string,
    tenantId?: string,
    userId?: string
  ): Promise<void> {
    this.ensureInitialized();
    this.ensureCollectionRegistered(collectionName);
    
    // If online, try to delete the document directly
    if (this.networkStatus === NetworkStatus.ONLINE) {
      try {
        const docRef = doc(this.db, collectionName, docId);
        await deleteDoc(docRef);
        
        // Remove from cache
        this.cacheCollections.get(collectionName)?.delete(docId);
        
        this.log(`Document deleted online: ${collectionName}/${docId}`);
        
        return;
      } catch (error) {
        console.error(`Error deleting document ${collectionName}/${docId}:`, error);
        
        // Fall back to offline operation if deletion failed
        this.log(`Falling back to offline deletion for: ${collectionName}/${docId}`);
      }
    }
    
    // Add to sync queue
    const operation: SyncOperation = {
      id: uuidv4(),
      type: SyncOperationType.DELETE,
      collectionName,
      documentId: docId,
      status: SyncOperationStatus.PENDING,
      timestamp: Date.now(),
      retryCount: 0,
      tenantId,
      userId
    };
    
    this.addOperation(operation);
    
    // Remove from cache
    this.cacheCollections.get(collectionName)?.delete(docId);
    
    this.log(`Document deletion queued: ${collectionName}/${docId}`);
  }
  
  /**
   * Get a document by ID
   * @param collectionName Collection name
   * @param docId Document ID
   * @returns Promise with document or null
   */
  async getById<T extends FirestoreDocument>(
    collectionName: string,
    docId: string
  ): Promise<T | null> {
    this.ensureInitialized();
    this.ensureCollectionRegistered(collectionName);
    
    // First check the cache
    const cachedDoc = this.cacheCollections.get(collectionName)?.getById(docId) as T;
    
    if (cachedDoc) {
      this.log(`Cache hit for document: ${collectionName}/${docId}`);
      return cachedDoc;
    }
    
    // If online, try to get from Firestore
    if (this.networkStatus === NetworkStatus.ONLINE) {
      try {
        const docRef = doc(this.db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          return null;
        }
        
        const docData = { id: docId, ...docSnap.data() } as T;
        
        // Cache the document
        this.cacheCollections.get(collectionName)?.set(docData);
        
        this.log(`Document fetched online: ${collectionName}/${docId}`);
        
        return docData;
      } catch (error) {
        console.error(`Error getting document ${collectionName}/${docId}:`, error);
        return null;
      }
    }
    
    // If offline and not in cache, return null
    this.log(`Document not available offline: ${collectionName}/${docId}`);
    return null;
  }
  
  /**
   * Query documents
   * @param collectionName Collection name
   * @param conditions Query conditions
   * @returns Promise with array of documents
   */
  async query<T extends FirestoreDocument>(
    collectionName: string,
    conditions: Array<{
      field: string;
      operator: '==' | '!=' | '>' | '>=' | '<' | '<=';
      value: any;
    }>,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    limitCount?: number
  ): Promise<T[]> {
    this.ensureInitialized();
    this.ensureCollectionRegistered(collectionName);
    
    // If online, query Firestore
    if (this.networkStatus === NetworkStatus.ONLINE) {
      try {
        const collectionRef = collection(this.db, collectionName);
        
        // Build where conditions
        const whereConstraints = conditions.map(condition => {
          return where(condition.field, condition.operator, condition.value);
        });
        
        // Create initial query with where conditions
        let q = query(collectionRef, ...whereConstraints);
        
        // Add sorting if specified
        if (sortField) {
          q = query(q, orderBy(sortField, sortDirection || 'asc'));
        }
        
        // Add document ID ordering if limit is specified
        if (limitCount && limitCount > 0) {
          q = query(q, orderBy(documentId()));
        }
        
        const querySnapshot = await getDocs(q);
        
        const results: T[] = [];
        
        querySnapshot.forEach(doc => {
          const data = { id: doc.id, ...doc.data() } as T;
          results.push(data);
          
          // Cache each document
          this.cacheCollections.get(collectionName)?.set(data);
        });
        
        this.log(`Query executed online for: ${collectionName}`);
        
        return results;
      } catch (error) {
        console.error(`Error querying collection ${collectionName}:`, error);
        
        // Fall back to cached data
        this.log(`Falling back to cached data for query on: ${collectionName}`);
      }
    }
    
    // If offline or online query failed, filter cached documents
    // This is a simple implementation that won't work for complex queries
    // A production implementation would need a more sophisticated local query engine
    const results: T[] = [];
    
    // We'd need to implement a way to get all cached documents for a collection
    // This is just a placeholder for the concept
    this.log(`Offline query for ${collectionName} not implemented`);
    
    return results;
  }
  
  /**
   * Subscribe to document changes
   * @param collectionName Collection name
   * @param docId Document ID
   * @param callback Callback function for document changes
   * @returns Unsubscribe function
   */
  subscribeToDocument<T extends FirestoreDocument>(
    collectionName: string,
    docId: string,
    callback: (doc: T | null) => void
  ): () => void {
    this.ensureInitialized();
    this.ensureCollectionRegistered(collectionName);
    
    // If online, subscribe to Firestore
    if (this.networkStatus === NetworkStatus.ONLINE) {
      const docRef = doc(this.db, collectionName, docId);
      
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docId, ...docSnap.data() } as T;
          
          // Update cache
          this.cacheCollections.get(collectionName)?.set(data);
          
          callback(data);
        } else {
          // Document doesn't exist or was deleted
          this.cacheCollections.get(collectionName)?.delete(docId);
          callback(null);
        }
      }, (error) => {
        console.error(`Error in document subscription (${collectionName}/${docId}):`, error);
        callback(null);
      });
    }
    
    // If offline, get from cache once
    const cachedDoc = this.cacheCollections.get(collectionName)?.getById(docId) as T;
    callback(cachedDoc || null);
    
    // Return a no-op unsubscribe function
    return () => {};
  }
  
  /**
   * Synchronize data now
   * @returns Promise with sync results
   */
  async syncNow(): Promise<SyncOperation[]> {
    this.ensureInitialized();
    
    if (this.syncing || this.networkStatus === NetworkStatus.OFFLINE) {
      return [];
    }
    
    // Filter pending operations
    const pendingOperations = Array.from(this.syncOperations.values())
      .filter(op => op.status === SyncOperationStatus.PENDING)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (pendingOperations.length === 0) {
      return [];
    }
    
    this.syncing = true;
    let processedOperations: SyncOperation[] = [];
    
    try {
      this.log(`Starting sync of ${pendingOperations.length} operations`);
      
      // Process in batches to avoid large transactions
      for (let i = 0; i < pendingOperations.length; i += this.config.batchSize) {
        const batch = pendingOperations.slice(i, i + this.config.batchSize);
        const batchResults = await this.processBatch(batch);
        processedOperations = [...processedOperations, ...batchResults];
      }
      
      // Save updated sync queue
      await this.saveSyncQueue();
      
      const completed = processedOperations.filter(op => op.status === SyncOperationStatus.COMPLETED);
      const failed = processedOperations.filter(op => op.status === SyncOperationStatus.FAILED);
      const conflicts = processedOperations.filter(op => op.status === SyncOperationStatus.CONFLICT);
      
      this.log(`Sync completed. Completed: ${completed.length}, Failed: ${failed.length}, Conflicts: ${conflicts.length}`);
      
      // Notify sync completed
      if (completed.length > 0) {
        this.notifySyncCompleted(completed);
      }
      
      // Notify conflicts
      conflicts.forEach(conflict => {
        this.notifyConflict(conflict);
      });
      
      // Clean up completed operations
      this.cleanupCompletedOperations();
      
      return processedOperations;
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Notify sync failed
      this.notifySyncFailed(processedOperations, error as Error);
      
      throw error;
    } finally {
      this.syncing = false;
    }
  }
  
  /**
   * Process a batch of sync operations
   * @param operations Operations to process
   * @returns Processed operations
   */
  private async processBatch(operations: SyncOperation[]): Promise<SyncOperation[]> {
    const results: SyncOperation[] = [];
    const batch = writeBatch(this.db);
    const processedDocRefs: Map<string, DocumentReference> = new Map();
    
    // First pass: check for conflicts
    for (const operation of operations) {
      // Skip operations that are already being processed
      if (operation.status === SyncOperationStatus.SYNCING) {
        continue;
      }
      
      // Update operation status
      operation.status = SyncOperationStatus.SYNCING;
      this.syncOperations.set(operation.id, operation);
      
      try {
        // Check for conflict
        if (operation.type !== SyncOperationType.CREATE) {
          const hasConflict = await this.checkForConflict(operation);
          
          if (hasConflict) {
            operation.status = SyncOperationStatus.CONFLICT;
            results.push({ ...operation });
            continue;
          }
        }
        
        // Get document reference
        const docRef = doc(this.db, operation.collectionName, operation.documentId);
        
        // Make sure we're not trying to process the same document multiple times in one batch
        const docKey = `${operation.collectionName}/${operation.documentId}`;
        if (processedDocRefs.has(docKey)) {
          // Skip this operation and retry later
          operation.status = SyncOperationStatus.PENDING;
          results.push({ ...operation });
          continue;
        }
        
        // Process based on operation type
        switch (operation.type) {
          case SyncOperationType.CREATE:
            {
              const dataToSave = { ...operation.data };
              delete dataToSave.id; // Remove id as it's in the reference
              
              // Update timestamps
              dataToSave.createdAt = serverTimestamp();
              dataToSave.updatedAt = serverTimestamp();
              
              batch.set(docRef, dataToSave);
              processedDocRefs.set(docKey, docRef);
            }
            break;
            
          case SyncOperationType.UPDATE:
            {
              const dataToSave = { ...operation.data };
              delete dataToSave.id; // Remove id as it's in the reference
              
              // Update timestamp
              dataToSave.updatedAt = serverTimestamp();
              
              batch.update(docRef, dataToSave);
              processedDocRefs.set(docKey, docRef);
            }
            break;
            
          case SyncOperationType.DELETE:
            batch.delete(docRef);
            processedDocRefs.set(docKey, docRef);
            break;
        }
        
        // Mark operation as will be completed
        operation.status = SyncOperationStatus.COMPLETED;
      } catch (error) {
        console.error(`Error processing operation ${operation.id}:`, error);
        
        // Update operation status
        operation.retryCount++;
        operation.error = error instanceof Error ? error.message : 'Unknown error';
        
        if (operation.retryCount > this.config.maxRetries) {
          operation.status = SyncOperationStatus.FAILED;
        } else {
          operation.status = SyncOperationStatus.PENDING;
        }
      }
      
      // Add to results
      results.push({ ...operation });
    }
    
    // Execute the batch for non-conflict operations
    if (processedDocRefs.size > 0) {
      try {
        await batch.commit();
        
        // Update operations status in the map
        results.forEach(operation => {
          if (operation.status === SyncOperationStatus.COMPLETED) {
            this.syncOperations.set(operation.id, operation);
          }
        });
      } catch (error) {
        console.error('Error committing batch:', error);
        
        // Mark all operations in the batch as failed
        results.forEach(operation => {
          if (operation.status === SyncOperationStatus.COMPLETED) {
            operation.status = SyncOperationStatus.FAILED;
            operation.error = error instanceof Error ? error.message : 'Batch commit failed';
            this.syncOperations.set(operation.id, operation);
          }
        });
      }
    }
    
    return results;
  }
  
  /**
   * Check for conflicts between local and remote data
   * @param operation Sync operation
   * @returns True if conflict exists
   */
  private async checkForConflict(operation: SyncOperation): Promise<boolean> {
    // In a production implementation, this would include comparing timestamps,
    // checking if other users have modified the document, etc.
    // For simplicity, we'll just check if the document exists for updates
    // and doesn't exist for deletes
    
    try {
      const docRef = doc(this.db, operation.collectionName, operation.documentId);
      const docSnap = await getDoc(docRef);
      
      if (operation.type === SyncOperationType.UPDATE && !docSnap.exists()) {
        // Document doesn't exist, can't update
        operation.error = 'Cannot update document that does not exist on server';
        return true;
      }
      
      if (operation.type === SyncOperationType.DELETE && !docSnap.exists()) {
        // Document doesn't exist, nothing to delete
        // This is not a conflict, mark as completed
        operation.status = SyncOperationStatus.COMPLETED;
        return false;
      }
      
      // For updates, we could implement more sophisticated conflict detection here
      // such as comparing server version/timestamp with the local version
      
      return false;
    } catch (error) {
      console.error(`Error checking for conflict for operation ${operation.id}:`, error);
      return false; // Assume no conflict if we can't check
    }
  }
  
  /**
   * Resolve a sync conflict
   * @param operationId Operation ID
   * @param resolution Conflict resolution strategy
   * @returns Updated operation
   */
  async resolveConflict(
    operationId: string,
    resolution: ConflictResolutionStrategy
  ): Promise<SyncOperation> {
    this.ensureInitialized();
    
    const operation = this.syncOperations.get(operationId);
    
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }
    
    if (operation.status !== SyncOperationStatus.CONFLICT) {
      throw new Error(`Operation ${operationId} is not in conflict status`);
    }
    
    // Handle conflict based on resolution strategy
    switch (resolution) {
      case ConflictResolutionStrategy.CLIENT_WINS:
        // Set back to pending to retry with force flag
        operation.status = SyncOperationStatus.PENDING;
        break;
        
      case ConflictResolutionStrategy.SERVER_WINS:
        // Mark as completed (effectively discarding the local change)
        operation.status = SyncOperationStatus.COMPLETED;
        break;
        
      case ConflictResolutionStrategy.MANUAL:
        // This would typically involve showing a UI to the user
        // For now, we'll just mark it as failed
        operation.status = SyncOperationStatus.FAILED;
        operation.error = 'Manual conflict resolution not implemented';
        break;
    }
    
    // Update operation in the map
    this.syncOperations.set(operationId, operation);
    
    // Save sync queue
    await this.saveSyncQueue();
    
    return operation;
  }
  
  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueJson = localStorage.getItem(this.syncQueueKey);
      
      if (queueJson) {
        const operations = JSON.parse(queueJson) as SyncOperation[];
        
        operations.forEach(operation => {
          this.syncOperations.set(operation.id, operation);
        });
        
        this.log(`Loaded ${operations.length} operations from sync queue`);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }
  
  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      const operations = Array.from(this.syncOperations.values());
      localStorage.setItem(this.syncQueueKey, JSON.stringify(operations));
      
      this.log(`Saved ${operations.length} operations to sync queue`);
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }
  
  /**
   * Add operation to sync queue
   * @param operation Sync operation
   */
  private addOperation(operation: SyncOperation): void {
    this.syncOperations.set(operation.id, operation);
    this.saveSyncQueue();
  }
  
  /**
   * Clean up completed operations
   */
  private cleanupCompletedOperations(): void {
    const operationIds = Array.from(this.syncOperations.keys());
    let removed = 0;
    
    for (const id of operationIds) {
      const operation = this.syncOperations.get(id);
      
      if (operation?.status === SyncOperationStatus.COMPLETED) {
        this.syncOperations.delete(id);
        removed++;
      }
    }
    
    if (removed > 0) {
      this.log(`Cleaned up ${removed} completed operations`);
      this.saveSyncQueue();
    }
  }
  
  /**
   * Start sync interval
   */
  private startSyncInterval(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }
    
    this.syncIntervalId = setInterval(() => {
      if (this.networkStatus === NetworkStatus.ONLINE && !this.syncing) {
        this.syncNow().catch(error => {
          console.error('Scheduled sync failed:', error);
        });
      }
    }, this.config.syncInterval);
    
    this.log(`Started sync interval (${this.config.syncInterval}ms)`);
  }
  
  /**
   * Handle online status
   */
  private handleOnline = (): void => {
    if (this.networkStatus === NetworkStatus.OFFLINE) {
      this.networkStatus = NetworkStatus.ONLINE;
      this.log('Network status changed to ONLINE');
      
      // Notify status change
      this.notifyNetworkStatusChange(NetworkStatus.ONLINE);
      
      // Sync now
      this.syncNow().catch(error => {
        console.error('Sync after online failed:', error);
      });
    }
  };
  
  /**
   * Handle offline status
   */
  private handleOffline = (): void => {
    if (this.networkStatus === NetworkStatus.ONLINE) {
      this.networkStatus = NetworkStatus.OFFLINE;
      this.log('Network status changed to OFFLINE');
      
      // Notify status change
      this.notifyNetworkStatusChange(NetworkStatus.OFFLINE);
    }
  };
  
  /**
   * Register a callback for sync completed event
   * @param callback Callback function
   */
  onSyncCompleted(callback: (operations: SyncOperation[]) => void): void {
    this.onSyncCompletedCallbacks.push(callback);
  }
  
  /**
   * Register a callback for sync failed event
   * @param callback Callback function
   */
  onSyncFailed(callback: (operations: SyncOperation[], error: Error) => void): void {
    this.onSyncFailedCallbacks.push(callback);
  }
  
  /**
   * Register a callback for conflict event
   * @param callback Callback function
   */
  onConflict(callback: (operation: SyncOperation) => void): void {
    this.onConflictCallbacks.push(callback);
  }
  
  /**
   * Register a callback for network status change event
   * @param callback Callback function
   */
  onNetworkStatusChange(callback: (status: NetworkStatus) => void): void {
    this.onNetworkStatusChangeCallbacks.push(callback);
  }
  
  /**
   * Notify sync completed event
   * @param operations Completed operations
   */
  private notifySyncCompleted(operations: SyncOperation[]): void {
    this.onSyncCompletedCallbacks.forEach(callback => {
      try {
        callback(operations);
      } catch (error) {
        console.error('Error in sync completed callback:', error);
      }
    });
  }
  
  /**
   * Notify sync failed event
   * @param operations Failed operations
   * @param error Error
   */
  private notifySyncFailed(operations: SyncOperation[], error: Error): void {
    this.onSyncFailedCallbacks.forEach(callback => {
      try {
        callback(operations, error);
      } catch (callbackError) {
        console.error('Error in sync failed callback:', callbackError);
      }
    });
  }
  
  /**
   * Notify conflict event
   * @param operation Conflict operation
   */
  private notifyConflict(operation: SyncOperation): void {
    this.onConflictCallbacks.forEach(callback => {
      try {
        callback(operation);
      } catch (error) {
        console.error('Error in conflict callback:', error);
      }
    });
  }
  
  /**
   * Notify network status change event
   * @param status Network status
   */
  private notifyNetworkStatusChange(status: NetworkStatus): void {
    this.onNetworkStatusChangeCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in network status change callback:', error);
      }
    });
  }
  
  /**
   * Log debug message
   * @param message Debug message
   */
  private log(message: string): void {
    if (this.config.debug) {
      console.log(`[SyncService] ${message}`);
    }
  }
  
  /**
   * Ensure the sync service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Sync service has not been initialized. Call initialize() first.');
    }
  }
  
  /**
   * Ensure collection is registered
   * @param collectionName Collection name
   */
  private ensureCollectionRegistered(collectionName: string): void {
    if (!this.collections.has(collectionName)) {
      throw new Error(`Collection ${collectionName} is not registered for sync. Call registerCollection() first.`);
    }
  }
  
  /**
   * Get sync queue status
   * @returns Sync queue status
   */
  getSyncQueueStatus(): {
    pending: number;
    syncing: number;
    completed: number;
    failed: number;
    conflict: number;
    total: number;
  } {
    const operations = Array.from(this.syncOperations.values());
    
    return {
      pending: operations.filter(op => op.status === SyncOperationStatus.PENDING).length,
      syncing: operations.filter(op => op.status === SyncOperationStatus.SYNCING).length,
      completed: operations.filter(op => op.status === SyncOperationStatus.COMPLETED).length,
      failed: operations.filter(op => op.status === SyncOperationStatus.FAILED).length,
      conflict: operations.filter(op => op.status === SyncOperationStatus.CONFLICT).length,
      total: operations.length
    };
  }
  
  /**
   * Dispose of the sync service
   */
  dispose(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    this.initialized = false;
  }
}

// Export a singleton instance
export const syncService = new SyncService({
  debug: true,
  syncInterval: 60000 // 1 minute
}); 