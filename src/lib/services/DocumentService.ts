import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentReference,
  QueryConstraint,
  setDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Document, DocumentVersion, DocumentSearchFilters, DocumentStatus, DocumentCategory } from '@/types/document';
import { v4 as uuidv4 } from 'uuid';

export class DocumentService {
  private currentTenantId: string | null = null;

  /**
   * Creates a new instance of DocumentService
   * @param tenantId Optional initial tenant ID
   */
  constructor(tenantId?: string) {
    if (tenantId) {
      this.currentTenantId = tenantId;
    }
  }

  /**
   * Sets the current tenant context for operations
   * @param tenantId The tenant ID to set as current context
   */
  setTenantContext(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  /**
   * Gets the current tenant ID from context
   * @returns The current tenant ID
   * @throws Error if no tenant context is set
   */
  getCurrentTenantId(): string {
    if (!this.currentTenantId) {
      throw new Error('No tenant context set. Call setTenantContext first or provide tenantId to method.');
    }
    return this.currentTenantId;
  }

  /**
   * Get a reference to the documents collection for a tenant
   * @param tenantId Optional tenant ID to override current context
   * @returns Firestore collection reference
   */
  getDocumentsRef(tenantId?: string) {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(db, 'tenants', effectiveTenantId, 'documents');
  }

  /**
   * Get a document by ID
   * @param documentId Document ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with the document or null if not found
   */
  async getDocument(documentId: string, tenantId?: string): Promise<Document | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getDocumentsRef(effectiveTenantId), documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Document;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a tenant
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with array of documents
   */
  async getDocuments(tenantId?: string): Promise<Document[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const q = query(
        this.getDocumentsRef(effectiveTenantId),
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Get documents for a specific entity (customer, lead, etc.)
   * @param entityId Entity ID (like customer or lead ID)
   * @param entityType Entity type (like 'customer' or 'lead')
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with array of documents
   */
  async getEntityDocuments(entityId: string, entityType: string, tenantId?: string): Promise<Document[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const q = query(
        this.getDocumentsRef(effectiveTenantId),
        where('entityId', '==', entityId),
        where('entityType', '==', entityType),
        where('status', '!=', 'deleted'),
        orderBy('status'),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
    } catch (error) {
      console.error('Error getting entity documents:', error);
      throw error;
    }
  }

  /**
   * Search for documents with filters
   * @param filters Document search filters
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with array of filtered documents
   */
  async searchDocuments(filters: DocumentSearchFilters, tenantId?: string): Promise<Document[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const constraints: QueryConstraint[] = [
        where('status', '!=', 'deleted')
      ];
      
      // Apply entity filters
      if (filters.entityId && filters.entityType) {
        constraints.push(where('entityId', '==', filters.entityId));
        constraints.push(where('entityType', '==', filters.entityType));
      }
      
      // Apply permission filter if provided
      if (filters.permission && filters.permission.length > 0) {
        constraints.push(where('permission', 'in', filters.permission));
      }
      
      // Apply category filter if provided
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      // Apply status filter if provided
      if (filters.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
      }
      
      // Apply creator filter if provided
      if (filters.createdBy && filters.createdBy.length > 0) {
        constraints.push(where('createdBy', 'in', filters.createdBy));
      }
      
      // We can only apply one array-contains-any filter per query
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
      
      // Order by updated date
      constraints.push(orderBy('updatedAt', 'desc'));
      
      const q = query(this.getDocumentsRef(effectiveTenantId), ...constraints);
      const querySnapshot = await getDocs(q);
      
      let results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Document);
      
      // Apply date range filter if provided (needs client-side filtering)
      if (filters.dateFrom && filters.dateTo) {
        const startDate = new Date(filters.dateFrom).getTime();
        const endDate = new Date(filters.dateTo).getTime();
        
        results = results.filter(doc => {
          let createdAt: Date;
          
          if (doc.createdAt instanceof Timestamp) {
            createdAt = doc.createdAt.toDate();
          } else {
            createdAt = new Date(doc.createdAt);
          }
          
          const createdTime = createdAt.getTime();
          return createdTime >= startDate && createdTime <= endDate;
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Upload a new document
   * @param file File to upload
   * @param documentData Document metadata
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with the created document
   */
  async uploadDocument(
    file: File,
    documentData: Omit<Document, 'id' | 'versions' | 'currentVersion' | 'createdAt' | 'updatedAt'>,
    tenantId?: string
  ): Promise<Document> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const documentId = uuidv4();
      const versionId = uuidv4();
      const timestamp = Timestamp.now();
      
      // Upload file to storage
      const storagePath = `tenants/${effectiveTenantId}/documents/${documentId}/${versionId}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Create document version
      const version: DocumentVersion = {
        id: versionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: storagePath,
        downloadUrl,
        uploadedAt: timestamp.toDate(),
        uploadedBy: typeof documentData.createdBy === 'string' 
          ? { id: documentData.createdBy, name: 'User', email: 'user@example.com' }
          : documentData.createdBy
      };
      
      // Create document
      const document: Omit<Document, 'id'> = {
        ...documentData,
        createdAt: timestamp,
        updatedAt: timestamp,
        versions: [version],
        currentVersion: '1',
        status: documentData.status || 'active',
        tags: documentData.tags || [],
      };
      
      // Save to Firestore
      const docRef = doc(this.getDocumentsRef(effectiveTenantId), documentId);
      await setDoc(docRef, document);
      
      return {
        id: documentId,
        ...document
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Upload a new version of an existing document
   * @param documentId Document ID
   * @param file File to upload as a new version
   * @param userId User ID uploading the new version
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with the updated document
   */
  async uploadNewVersion(
    documentId: string,
    file: File,
    userId: string,
    tenantId?: string
  ): Promise<Document> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      // Get the current document
      const document = await this.getDocument(documentId, effectiveTenantId);
      
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }
      
      const versionId = uuidv4();
      const timestamp = Timestamp.now();
      
      // Upload file to storage
      const storagePath = `tenants/${effectiveTenantId}/documents/${documentId}/${versionId}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Create document version
      const version: DocumentVersion = {
        id: versionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: storagePath,
        downloadUrl,
        uploadedAt: timestamp.toDate(),
        uploadedBy: { id: userId, name: 'User', email: 'user@example.com' }
      };
      
      // Update document with new version
      const docRef = doc(this.getDocumentsRef(effectiveTenantId), documentId);
      const currentVersionNum = parseInt(document.currentVersion || '1', 10);
      const newVersionNum = (currentVersionNum + 1).toString();
      
      const versions = [...(document.versions || []), version];
      
      const updateData = {
        versions,
        currentVersion: newVersionNum,
        updatedAt: timestamp
      };
      
      // Only add updatedBy if it exists on the document type
      if ('updatedBy' in document) {
        Object.assign(updateData, { updatedBy: userId });
      }
      
      await updateDoc(docRef, updateData);
      
      return {
        ...document,
        versions,
        currentVersion: newVersionNum,
        updatedAt: timestamp
      };
    } catch (error) {
      console.error('Error uploading new version:', error);
      throw error;
    }
  }

  /**
   * Update document metadata
   * @param documentId Document ID
   * @param metadata Metadata fields to update
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with the updated document
   */
  async updateDocumentMetadata(
    documentId: string,
    metadata: Partial<Document>,
    tenantId?: string
  ): Promise<Document> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getDocumentsRef(effectiveTenantId), documentId);
      
      const timestamp = Timestamp.now();
      
      const updateData = {
        ...metadata,
        updatedAt: timestamp
      };
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await this.getDocument(documentId, effectiveTenantId);
      if (!updatedDoc) {
        throw new Error(`Document with ID ${documentId} not found after update`);
      }
      
      return updatedDoc;
    } catch (error) {
      console.error('Error updating document metadata:', error);
      throw error;
    }
  }

  /**
   * Update a document's status
   * @param documentId Document ID
   * @param status New document status
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with the updated document
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    tenantId?: string
  ): Promise<Document> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getDocumentsRef(effectiveTenantId), documentId);
      
      const timestamp = Timestamp.now();
      
      await updateDoc(docRef, {
        status,
        updatedAt: timestamp
      });
      
      const updatedDoc = await this.getDocument(documentId, effectiveTenantId);
      if (!updatedDoc) {
        throw new Error(`Document with ID ${documentId} not found after status update`);
      }
      
      return updatedDoc;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  }

  /**
   * Soft delete a document (mark as deleted)
   * @param documentId Document ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise<void>
   */
  async deleteDocument(documentId: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getDocumentsRef(effectiveTenantId), documentId);
      
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Permanently delete a document from Firestore and its file from Storage
   * @param documentId Document ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise<void>
   */
  async permanentlyDeleteDocument(documentId: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const document = await this.getDocument(documentId, effectiveTenantId);
      
      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }
      
      // Delete all versions from storage
      if (document.versions && document.versions.length > 0) {
        for (const version of document.versions) {
          if (version.filePath) {
            try {
              const fileRef = ref(storage, version.filePath);
              await deleteObject(fileRef);
            } catch (storageError) {
              console.warn(`Could not delete file at ${version.filePath}:`, storageError);
            }
          }
        }
      }
      
      // Delete the document from Firestore
      const docRef = doc(this.getDocumentsRef(effectiveTenantId), documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error permanently deleting document:', error);
      throw error;
    }
  }

  /**
   * Get document statistics for a tenant
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with document statistics
   */
  async getDocumentStats(tenantId?: string): Promise<{
    total: number;
    active: number;
    archived: number;
    byCategory: Record<DocumentCategory, number>;
  }> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const documents = await this.getDocuments(effectiveTenantId);
      
      const stats = {
        total: documents.length,
        active: documents.filter(doc => doc.status === 'active').length,
        archived: documents.filter(doc => doc.status === 'archived').length,
        byCategory: {} as Record<DocumentCategory, number>
      };
      
      // Calculate by category
      documents.forEach(doc => {
        if (doc.category) {
          if (!stats.byCategory[doc.category]) {
            stats.byCategory[doc.category] = 0;
          }
          stats.byCategory[doc.category]++;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to document updates for a specific entity
   * @param entityId Entity ID (like customer or lead ID)
   * @param entityType Entity type (like 'customer' or 'lead')
   * @param callback Function to call with updated documents array
   * @param tenantId Optional tenant ID to override current context
   * @returns Unsubscribe function
   */
  subscribeToEntityDocuments(
    entityId: string,
    entityType: string,
    callback: (documents: Document[]) => void,
    tenantId?: string
  ): Unsubscribe {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    const q = query(
      this.getDocumentsRef(effectiveTenantId),
      where('entityId', '==', entityId),
      where('entityType', '==', entityType),
      where('status', '!=', 'deleted'),
      orderBy('status'),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Document));
      
      callback(documents);
    });
  }
  
  /**
   * Tests document isolation between tenants
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Object indicating success or failure with message
   */
  async testDocumentIsolation(tenantId1: string, tenantId2: string): Promise<{ success: boolean; message: string }> {
    try {
      // Create a test document in tenant 1
      const testFileName = `test_${Date.now()}.txt`;
      const testFile = new File(['This is a test file for isolation testing'], testFileName, { type: 'text/plain' });
      
      const testDocData = {
        name: `Test Document ${Date.now()}`,
        description: 'This is a test document for tenant isolation testing',
        entityId: 'test-entity',
        entityType: 'test',
        category: 'test' as DocumentCategory,
        status: 'active' as DocumentStatus,
        createdBy: 'system',
        permission: 'private'
      };
      
      // Create in tenant 1
      const createdDocument = await this.uploadDocument(testFile, testDocData, tenantId1);
      
      if (!createdDocument || !createdDocument.id) {
        return { 
          success: false, 
          message: 'Failed to create test document with valid ID' 
        };
      }
      
      // Try to access from tenant 2
      const documentFromTenant2 = await this.getDocument(createdDocument.id, tenantId2);
      
      // Clean up - delete from tenant 1
      await this.permanentlyDeleteDocument(createdDocument.id, tenantId1);
      
      if (documentFromTenant2) {
        return {
          success: false,
          message: `Tenant isolation failed: Tenant ${tenantId2} was able to access document from tenant ${tenantId1}`
        };
      }
      
      return {
        success: true,
        message: 'Tenant isolation successful: Documents are properly isolated between tenants'
      };
    } catch (error) {
      console.error('Error in document isolation test:', error);
      return {
        success: false,
        message: `Error testing document isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
} 