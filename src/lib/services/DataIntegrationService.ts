import { FirestoreService, FirestoreDocument } from './firebase/FirestoreService';
import { cacheService, CacheCollection } from './CacheService';
import { syncService, NetworkStatus } from './SyncService';
import { validationService, ValidationResult } from './ValidationService';
import { backupService, BackupScope, BackupFrequency } from './BackupService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Data integration options interface
 */
export interface DataIntegrationOptions {
  enableValidation: boolean;
  enableCaching: boolean;
  enableSync: boolean;
  cacheTTL?: number; // Time-to-live in milliseconds
  enableOffline: boolean;
  validateBeforeSave: boolean;
  debugMode: boolean;
}

/**
 * Extended document interface with tenant ID
 */
export interface TenantDocument extends FirestoreDocument {
  tenantId?: string;
}

/**
 * Default options for data integration
 */
const DEFAULT_OPTIONS: DataIntegrationOptions = {
  enableValidation: true,
  enableCaching: true,
  enableSync: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enableOffline: true,
  validateBeforeSave: true,
  debugMode: false
};

/**
 * Data integration service
 * 
 * This service integrates all data services (Firestore, cache, sync, validation, backup)
 * and provides a unified API for working with data.
 */
export class DataIntegrationService<T extends TenantDocument> {
  private firestoreService: FirestoreService<T>;
  private cacheCollection: CacheCollection<T>;
  private options: DataIntegrationOptions;
  private collectionName: string;
  private isInitialized = false;
  
  /**
   * Create a new data integration service
   * @param collectionName Collection name
   * @param options Integration options
   */
  constructor(collectionName: string, options: Partial<DataIntegrationOptions> = {}) {
    this.collectionName = collectionName;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.firestoreService = new FirestoreService<T>(collectionName);
    this.cacheCollection = new CacheCollection<T>(cacheService, collectionName, this.options.cacheTTL);
    
    if (this.options.debugMode) {
      this.log(`Created integration service for collection: ${collectionName}`);
    }
  }
  
  /**
   * Initialize the data integration service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Initialize cache service
    if (!cacheService['initialized']) {
      await cacheService.initialize();
    }
    
    // Initialize sync service and register collection
    if (this.options.enableSync && this.options.enableOffline) {
      if (!syncService['initialized']) {
        await syncService.initialize();
      }
      syncService.registerCollection(this.collectionName, this.options.cacheTTL);
    }
    
    this.isInitialized = true;
    
    if (this.options.debugMode) {
      this.log(`Initialized for collection: ${this.collectionName}`);
    }
  }
  
  /**
   * Get a document by ID
   * @param id Document ID
   * @param tenantId Optional tenant ID
   * @returns Promise with document or null
   */
  async getById(id: string, tenantId?: string): Promise<T | null> {
    this.ensureInitialized();
    
    try {
      let doc: T | null = null;
      
      // Try to get from sync service first if enabled
      if (this.options.enableSync && this.options.enableOffline) {
        doc = await syncService.getById<T>(this.collectionName, id);
        
        if (doc) {
          this.log(`Document ${id} fetched from sync service`);
          return doc;
        }
      }
      
      // Try to get from cache if enabled
      if (this.options.enableCaching) {
        doc = this.cacheCollection.getById(id);
        
        if (doc) {
          this.log(`Document ${id} fetched from cache`);
          return doc;
        }
      }
      
      // Get from Firestore as a last resort
      doc = await this.firestoreService.getById(id);
      
      if (doc && this.options.enableCaching) {
        this.cacheCollection.set(doc);
      }
      
      return doc;
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Get documents by tenant ID
   * @param tenantId Tenant ID
   * @returns Promise with array of documents
   */
  async getByTenantId(tenantId: string): Promise<T[]> {
    this.ensureInitialized();
    
    try {
      // For now, we'll just directly query Firestore
      // In a more complete implementation, we could use the sync service for offline support
      const docs = await this.firestoreService.query({ tenantId });
      
      // Cache the documents if caching is enabled
      if (this.options.enableCaching) {
        docs.forEach((doc: T) => {
          this.cacheCollection.set(doc);
        });
      }
      
      return docs;
    } catch (error) {
      console.error(`Error fetching documents for tenant ${tenantId}:`, error);
      return [];
    }
  }
  
  /**
   * Create a new document
   * @param data Document data
   * @param tenantId Optional tenant ID
   * @param userId Optional user ID
   * @returns Promise with created document
   */
  async create(data: Partial<T>, tenantId?: string, userId?: string): Promise<T> {
    this.ensureInitialized();
    
    try {
      // Generate an ID if none provided
      const docData = { ...data } as T;
      if (!docData.id) {
        docData.id = uuidv4();
      }
      
      // Add tenant ID if provided
      if (tenantId) {
        docData.tenantId = tenantId;
      }
      
      // Validate if enabled
      if (this.options.enableValidation && this.options.validateBeforeSave) {
        const validationResult = await this.validate(docData);
        
        if (!validationResult.isValid) {
          throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      // If sync is enabled and offline mode is enabled, use sync service
      if (this.options.enableSync && this.options.enableOffline) {
        return await syncService.create(this.collectionName, docData, tenantId, userId) as T;
      }
      
      // Otherwise use Firestore service directly
      const createdDoc = await this.firestoreService.create(docData);
      
      // Cache the created document if caching is enabled
      if (this.options.enableCaching) {
        this.cacheCollection.set(createdDoc);
      }
      
      return createdDoc;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }
  
  /**
   * Update a document
   * @param id Document ID
   * @param data Update data
   * @param tenantId Optional tenant ID
   * @param userId Optional user ID
   * @returns Promise with updated document
   */
  async update(id: string, data: Partial<T>, tenantId?: string, userId?: string): Promise<T> {
    this.ensureInitialized();
    
    try {
      // Get the current document
      const currentDoc = await this.getById(id);
      
      if (!currentDoc) {
        throw new Error(`Document with ID ${id} not found`);
      }
      
      // Merge the update with the current document
      const updateData = { ...data } as Partial<T>;
      
      // Don't allow changing the ID or tenant ID
      delete updateData.id;
      if ('tenantId' in updateData) {
        delete updateData.tenantId;
      }
      
      // Validate if enabled
      if (this.options.enableValidation && this.options.validateBeforeSave) {
        const mergedData = { ...currentDoc, ...updateData } as T;
        const validationResult = await this.validate(mergedData);
        
        if (!validationResult.isValid) {
          throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
        }
      }
      
      // If sync is enabled and offline mode is enabled, use sync service
      if (this.options.enableSync && this.options.enableOffline) {
        return await syncService.update(this.collectionName, id, updateData, tenantId, userId) as T;
      }
      
      // Otherwise use Firestore service directly
      const updatedDoc = await this.firestoreService.update(id, updateData);
      
      // Cache the updated document if caching is enabled
      if (this.options.enableCaching) {
        this.cacheCollection.set(updatedDoc);
      }
      
      return updatedDoc;
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a document
   * @param id Document ID
   * @param tenantId Optional tenant ID
   * @param userId Optional user ID
   * @returns Promise that resolves when the document is deleted
   */
  async delete(id: string, tenantId?: string, userId?: string): Promise<void> {
    this.ensureInitialized();
    
    try {
      // If sync is enabled and offline mode is enabled, use sync service
      if (this.options.enableSync && this.options.enableOffline) {
        await syncService.delete(this.collectionName, id, tenantId, userId);
        return;
      }
      
      // Otherwise use Firestore service directly
      await this.firestoreService.delete(id);
      
      // Remove from cache if caching is enabled
      if (this.options.enableCaching) {
        this.cacheCollection.delete(id);
      }
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Query documents
   * @param queryParams Query parameters
   * @returns Promise with array of documents
   */
  async query(queryParams: Record<string, any>): Promise<T[]> {
    this.ensureInitialized();
    
    try {
      // Convert query params to sync service format
      if (this.options.enableSync && this.options.enableOffline) {
        const conditions = Object.entries(queryParams).map(([field, value]) => ({
          field,
          operator: '==' as const,
          value
        }));
        
        return await syncService.query<T>(this.collectionName, conditions);
      }
      
      // Otherwise use Firestore service directly
      const results = await this.firestoreService.query(queryParams);
      
      // Cache results if caching is enabled
      if (this.options.enableCaching) {
        results.forEach(doc => {
          this.cacheCollection.set(doc);
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error querying documents:', error);
      return [];
    }
  }
  
  /**
   * Subscribe to document changes
   * @param id Document ID
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  subscribeToDocument(id: string, callback: (doc: T | null) => void): () => void {
    this.ensureInitialized();
    
    // If sync is enabled, use sync service
    if (this.options.enableSync) {
      return syncService.subscribeToDocument<T>(this.collectionName, id, callback);
    }
    
    // Otherwise use Firestore service directly
    return this.firestoreService.subscribeToDocument(id, (doc) => {
      // Cache the document if it exists and caching is enabled
      if (doc && this.options.enableCaching) {
        this.cacheCollection.set(doc);
      }
      
      callback(doc);
    });
  }
  
  /**
   * Validate a document
   * @param data Document data
   * @returns Promise with validation result
   */
  async validate(data: T): Promise<ValidationResult> {
    if (!this.options.enableValidation) {
      return { isValid: true, errors: [] };
    }
    
    return validationService.validateForCollection(this.collectionName, data);
  }
  
  /**
   * Create a backup of this collection
   * @param tenantId Tenant ID
   * @param name Backup name
   * @param userId User ID
   * @returns Promise with backup result
   */
  async createBackup(tenantId: string, name: string, userId: string): Promise<any> {
    this.ensureInitialized();
    
    return backupService.createBackup(
      tenantId,
      {
        name,
        description: `Backup of ${this.collectionName} collection`,
        collections: [this.collectionName],
        scope: BackupScope.PARTIAL
      },
      userId
    );
  }
  
  /**
   * Create a scheduled backup for this collection
   * @param tenantId Tenant ID
   * @param name Schedule name
   * @param frequency Backup frequency
   * @param retentionPeriodDays Number of days to keep backups
   * @param userId User ID
   * @returns Promise with schedule result
   */
  async scheduleBackup(
    tenantId: string,
    name: string,
    frequency: BackupFrequency,
    retentionPeriodDays: number,
    userId: string
  ): Promise<any> {
    this.ensureInitialized();
    
    return backupService.createBackupSchedule(
      tenantId,
      {
        name,
        description: `Scheduled backup of ${this.collectionName} collection`,
        frequency,
        collections: [this.collectionName],
        scope: BackupScope.PARTIAL,
        retentionPeriodDays
      },
      userId
    );
  }
  
  /**
   * Get the network status
   * @returns Current network status
   */
  getNetworkStatus(): NetworkStatus {
    if (!this.options.enableSync) {
      return NetworkStatus.ONLINE; // Default to online if sync is disabled
    }
    
    // Access private property (not ideal, but works for this implementation)
    return syncService['networkStatus'];
  }
  
  /**
   * Clear cache for this collection
   */
  clearCache(): void {
    if (!this.options.enableCaching) {
      return;
    }
    
    this.cacheCollection.clear();
  }
  
  /**
   * Synchronize pending operations
   * @returns Promise with sync results
   */
  async syncNow(): Promise<any> {
    if (!this.options.enableSync || !this.options.enableOffline) {
      return { synced: 0 };
    }
    
    return syncService.syncNow();
  }
  
  /**
   * Get sync queue status
   * @returns Sync queue status
   */
  getSyncStatus(): any {
    if (!this.options.enableSync || !this.options.enableOffline) {
      return { pending: 0, total: 0 };
    }
    
    return syncService.getSyncQueueStatus();
  }
  
  /**
   * Log debug message
   * @param message Debug message
   */
  private log(message: string): void {
    if (this.options.debugMode) {
      console.log(`[DataIntegration:${this.collectionName}] ${message}`);
    }
  }
  
  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Data integration service is not initialized. Call initialize() first.');
    }
  }
}

/**
 * Create a factory for creating data integration services
 * @param defaultOptions Default options for all services
 * @returns Factory function
 */
export function createDataIntegrationFactory(
  defaultOptions: Partial<DataIntegrationOptions> = {}
): <T extends TenantDocument>(collectionName: string, options?: Partial<DataIntegrationOptions>) => DataIntegrationService<T> {
  const mergedDefaults = { ...DEFAULT_OPTIONS, ...defaultOptions };
  
  return <T extends TenantDocument>(
    collectionName: string,
    options: Partial<DataIntegrationOptions> = {}
  ): DataIntegrationService<T> => {
    const mergedOptions = { ...mergedDefaults, ...options };
    return new DataIntegrationService<T>(collectionName, mergedOptions);
  };
}

// Export a default factory
export const createDataIntegration = createDataIntegrationFactory(); 