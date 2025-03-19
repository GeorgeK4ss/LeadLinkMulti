import { db } from '@/lib/firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp, 
  getDoc,
  getDocs,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  QueryConstraint
} from 'firebase/firestore';
import { FirestoreDocument, FirestoreService } from './firebase/FirestoreService';

/**
 * Types of entities that can be collaborated on
 */
export enum CollaborationEntityType {
  LEAD = 'lead',
  CUSTOMER = 'customer',
  TASK = 'task',
  DOCUMENT = 'document',
  DEAL = 'deal',
  PROJECT = 'project'
}

/**
 * User presence status
 */
export enum UserPresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

/**
 * Interface for user presence data
 */
export interface UserPresence extends FirestoreDocument {
  userId: string;
  status: UserPresenceStatus;
  lastActive: Date;
  currentEntity?: {
    type: CollaborationEntityType;
    id: string;
    name?: string;
    startedViewingAt: Date;
  };
  tenantId: string;
  metadata?: {
    deviceInfo?: string;
    location?: string;
    ipAddress?: string;
  };
}

/**
 * Interface for entity viewers
 */
export interface EntityViewers extends FirestoreDocument {
  entityId: string;
  entityType: CollaborationEntityType;
  tenantId: string;
  viewers: {
    userId: string;
    startedViewingAt: Date;
    lastActiveAt: Date;
  }[];
}

/**
 * Interface for document collaboration
 */
export interface CollaborativeDocument extends FirestoreDocument {
  tenantId: string;
  title: string;
  content: string;
  relatedTo?: {
    type: CollaborationEntityType;
    id: string;
    name?: string;
  };
  lastEditedBy: string;
  editors: string[];
  viewers: string[];
  version: number;
  editHistory: {
    userId: string;
    timestamp: Date;
    changes: string; // Could store a diff or description of changes
  }[];
  comments?: {
    id: string;
    userId: string;
    content: string;
    timestamp: Date;
    resolved?: boolean;
    replies?: {
      id: string;
      userId: string;
      content: string;
      timestamp: Date;
    }[];
  }[];
}

/**
 * Service for real-time collaboration features
 */
export class CollaborationService {
  private presenceService: PresenceService;
  private documentService: CollaborativeDocumentService;

  constructor() {
    this.presenceService = new PresenceService();
    this.documentService = new CollaborativeDocumentService();
  }

  /**
   * Get the presence service
   * @returns Presence service instance
   */
  getPresenceService(): PresenceService {
    return this.presenceService;
  }

  /**
   * Get the collaborative document service
   * @returns Collaborative document service instance
   */
  getDocumentService(): CollaborativeDocumentService {
    return this.documentService;
  }

  /**
   * Track viewing of an entity
   * @param tenantId Tenant ID
   * @param userId Current user ID
   * @param entityType Type of entity being viewed
   * @param entityId ID of entity being viewed
   * @param entityName Optional name of entity being viewed
   * @returns Cleanup function to call when user stops viewing
   */
  trackEntityViewing(
    tenantId: string,
    userId: string,
    entityType: CollaborationEntityType,
    entityId: string,
    entityName?: string
  ): () => void {
    // Update user presence to indicate which entity they're viewing
    this.presenceService.updateUserPresence(tenantId, userId, {
      status: UserPresenceStatus.ONLINE,
      currentEntity: {
        type: entityType,
        id: entityId,
        name: entityName,
        startedViewingAt: new Date()
      }
    });

    // Update entity viewers collection
    this.addEntityViewer(tenantId, entityType, entityId, userId);

    // Return cleanup function
    return () => {
      this.presenceService.updateUserPresence(tenantId, userId, {
        currentEntity: undefined
      });
      this.removeEntityViewer(tenantId, entityType, entityId, userId);
    };
  }

  /**
   * Add a user as a viewer of an entity
   * @param tenantId Tenant ID
   * @param entityType Type of entity
   * @param entityId ID of entity
   * @param userId ID of user viewing
   */
  private async addEntityViewer(
    tenantId: string,
    entityType: CollaborationEntityType,
    entityId: string,
    userId: string
  ): Promise<void> {
    try {
      const entityViewersRef = doc(db, 'entityViewers', `${entityType}_${entityId}`);
      const entityViewersDoc = await getDoc(entityViewersRef);

      const now = new Date();
      const viewerData = {
        userId,
        startedViewingAt: now,
        lastActiveAt: now
      };

      if (!entityViewersDoc.exists()) {
        // Create new document if it doesn't exist
        await setDoc(entityViewersRef, {
          entityId,
          entityType,
          tenantId,
          viewers: [viewerData],
          createdAt: now,
          updatedAt: now
        });
      } else {
        // Update existing document
        const data = entityViewersDoc.data() as EntityViewers;
        const existingViewerIndex = data.viewers.findIndex(v => v.userId === userId);

        if (existingViewerIndex >= 0) {
          // Update existing viewer's timestamp
          data.viewers[existingViewerIndex].lastActiveAt = now;
          await updateDoc(entityViewersRef, {
            viewers: data.viewers,
            updatedAt: now
          });
        } else {
          // Add new viewer
          await updateDoc(entityViewersRef, {
            viewers: arrayUnion(viewerData),
            updatedAt: now
          });
        }
      }
    } catch (error) {
      console.error('Error adding entity viewer:', error);
    }
  }

  /**
   * Remove a user as a viewer of an entity
   * @param tenantId Tenant ID
   * @param entityType Type of entity
   * @param entityId ID of entity
   * @param userId ID of user to remove
   */
  private async removeEntityViewer(
    tenantId: string,
    entityType: CollaborationEntityType,
    entityId: string,
    userId: string
  ): Promise<void> {
    try {
      const entityViewersRef = doc(db, 'entityViewers', `${entityType}_${entityId}`);
      const entityViewersDoc = await getDoc(entityViewersRef);

      if (entityViewersDoc.exists()) {
        const data = entityViewersDoc.data() as EntityViewers;
        const updatedViewers = data.viewers.filter(v => v.userId !== userId);

        // If no viewers left, delete the document, otherwise update it
        if (updatedViewers.length === 0) {
          await deleteDoc(entityViewersRef);
        } else {
          await updateDoc(entityViewersRef, {
            viewers: updatedViewers,
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error removing entity viewer:', error);
    }
  }

  /**
   * Get current viewers of an entity
   * @param entityType Type of entity
   * @param entityId ID of entity
   * @returns Promise with array of viewer data
   */
  async getEntityViewers(
    entityType: CollaborationEntityType,
    entityId: string
  ): Promise<EntityViewers['viewers']> {
    try {
      const entityViewersRef = doc(db, 'entityViewers', `${entityType}_${entityId}`);
      const entityViewersDoc = await getDoc(entityViewersRef);

      if (entityViewersDoc.exists()) {
        const data = entityViewersDoc.data() as EntityViewers;
        
        // Filter out viewers who haven't been active in the last 5 minutes
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        return data.viewers.filter(
          viewer => viewer.lastActiveAt >= fiveMinutesAgo
        );
      }

      return [];
    } catch (error) {
      console.error('Error getting entity viewers:', error);
      return [];
    }
  }

  /**
   * Subscribe to entity viewers
   * @param entityType Type of entity
   * @param entityId ID of entity
   * @param callback Function to call when viewers change
   * @returns Unsubscribe function
   */
  subscribeToEntityViewers(
    entityType: CollaborationEntityType,
    entityId: string,
    callback: (viewers: EntityViewers['viewers']) => void
  ): () => void {
    const entityViewersRef = doc(db, 'entityViewers', `${entityType}_${entityId}`);
    
    return onSnapshot(entityViewersRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as EntityViewers;
        
        // Filter out viewers who haven't been active in the last 5 minutes
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        
        const activeViewers = data.viewers.filter(
          viewer => viewer.lastActiveAt >= fiveMinutesAgo
        );
        
        callback(activeViewers);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Error subscribing to entity viewers:', error);
      callback([]);
    });
  }
}

/**
 * Service for managing user presence
 */
export class PresenceService extends FirestoreService<UserPresence> {
  constructor() {
    super('userPresence');
  }

  /**
   * Update user presence
   * @param tenantId Tenant ID
   * @param userId User ID
   * @param presenceData Partial presence data to update
   * @returns Promise with updated presence data
   */
  async updateUserPresence(
    tenantId: string,
    userId: string,
    presenceData: Partial<Omit<UserPresence, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'userId' | 'tenantId'>>
  ): Promise<UserPresence> {
    try {
      const userPresenceId = `${tenantId}_${userId}`;
      const userPresenceDoc = await this.getById(userPresenceId);

      if (userPresenceDoc) {
        // Update existing presence
        return await this.update(userPresenceId, {
          ...presenceData,
          lastActive: new Date()
        }, userId);
      } else {
        // Create new presence
        const newPresenceData: Omit<UserPresence, 'id'> = {
          userId,
          tenantId,
          status: presenceData.status || UserPresenceStatus.ONLINE,
          lastActive: new Date(),
          currentEntity: presenceData.currentEntity,
          metadata: presenceData.metadata,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId
        };

        return await this.createWithId(userPresenceId, newPresenceData, userId);
      }
    } catch (error) {
      console.error('Error updating user presence:', error);
      throw error;
    }
  }

  /**
   * Get active users in a tenant
   * @param tenantId Tenant ID
   * @returns Promise with array of active user presence
   */
  async getActiveUsers(tenantId: string): Promise<UserPresence[]> {
    try {
      // Consider users active if they've been active in the last 5 minutes
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        where('lastActive', '>=', fiveMinutesAgo),
        orderBy('lastActive', 'desc')
      ];

      return await this.query(constraints);
    } catch (error) {
      console.error('Error getting active users:', error);
      throw error;
    }
  }

  /**
   * Subscribe to active users in a tenant
   * @param tenantId Tenant ID
   * @param callback Function to call when active users change
   * @returns Unsubscribe function
   */
  subscribeToActiveUsers(
    tenantId: string,
    callback: (users: UserPresence[]) => void
  ): () => void {
    // Consider users active if they've been active in the last 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const constraints: QueryConstraint[] = [
      where('tenantId', '==', tenantId),
      where('lastActive', '>=', fiveMinutesAgo),
      orderBy('lastActive', 'desc')
    ];

    return this.subscribeToQuery(constraints, (users) => {
      callback(users);
    });
  }

  /**
   * Setup heartbeat to keep user presence active
   * @param tenantId Tenant ID
   * @param userId User ID
   * @param status Initial user status
   * @returns Cleanup function to call on logout
   */
  setupPresenceHeartbeat(
    tenantId: string,
    userId: string,
    status: UserPresenceStatus = UserPresenceStatus.ONLINE
  ): () => void {
    // Initial presence update
    this.updateUserPresence(tenantId, userId, { status });

    // Set up interval to update presence
    const interval = setInterval(() => {
      this.updateUserPresence(tenantId, userId, {
        lastActive: new Date()
      });
    }, 60000); // Update every minute

    // Set up offline status on page unload
    const handleUnload = () => {
      // Use navigator.sendBeacon for reliable delivery during page unload
      const userPresenceRef = doc(db, 'userPresence', `${tenantId}_${userId}`);
      navigator.sendBeacon(
        `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/updateUserPresenceOffline`,
        JSON.stringify({ userId, tenantId })
      );
    };

    window.addEventListener('beforeunload', handleUnload);

    // Return cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      
      this.updateUserPresence(tenantId, userId, {
        status: UserPresenceStatus.OFFLINE
      });
    };
  }
}

/**
 * Service for collaborative document editing
 */
export class CollaborativeDocumentService extends FirestoreService<CollaborativeDocument> {
  constructor() {
    super('collaborativeDocuments');
  }

  /**
   * Create a new collaborative document
   * @param tenantId Tenant ID
   * @param title Document title
   * @param creatorId ID of the user creating the document
   * @param options Additional document options
   * @returns Promise with the created document
   */
  async createDocument(
    tenantId: string,
    title: string,
    creatorId: string,
    options?: {
      content?: string;
      relatedTo?: CollaborativeDocument['relatedTo'];
      editors?: string[];
      viewers?: string[];
    }
  ): Promise<CollaborativeDocument> {
    try {
      const documentData: Omit<CollaborativeDocument, 'id'> = {
        tenantId,
        title,
        content: options?.content || '',
        relatedTo: options?.relatedTo,
        lastEditedBy: creatorId,
        editors: options?.editors || [creatorId],
        viewers: options?.viewers || [],
        version: 1,
        editHistory: [{
          userId: creatorId,
          timestamp: new Date(),
          changes: 'Document created'
        }],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: creatorId,
        updatedBy: creatorId
      };

      return await this.create(documentData, creatorId);
    } catch (error) {
      console.error('Error creating collaborative document:', error);
      throw error;
    }
  }

  /**
   * Get documents by tenant
   * @param tenantId Tenant ID
   * @param limit Maximum number of documents to return
   * @returns Promise with array of documents
   */
  async getDocumentsByTenant(
    tenantId: string,
    limit?: number
  ): Promise<CollaborativeDocument[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        orderBy('updatedAt', 'desc')
      ];

      if (limit) {
        constraints.push(limit(limit));
      }

      return await this.query(constraints);
    } catch (error) {
      console.error('Error getting documents by tenant:', error);
      throw error;
    }
  }

  /**
   * Get documents related to a specific entity
   * @param tenantId Tenant ID
   * @param entityType Type of related entity
   * @param entityId ID of related entity
   * @returns Promise with array of related documents
   */
  async getRelatedDocuments(
    tenantId: string,
    entityType: CollaborationEntityType,
    entityId: string
  ): Promise<CollaborativeDocument[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('tenantId', '==', tenantId),
        where('relatedTo.type', '==', entityType),
        where('relatedTo.id', '==', entityId),
        orderBy('updatedAt', 'desc')
      ];

      return await this.query(constraints);
    } catch (error) {
      console.error('Error getting related documents:', error);
      throw error;
    }
  }

  /**
   * Update a document's content
   * @param id Document ID
   * @param content Updated content
   * @param userId ID of the user making the update
   * @param changeDescription Description of changes made
   * @returns Promise with the updated document
   */
  async updateDocumentContent(
    id: string,
    content: string,
    userId: string,
    changeDescription: string
  ): Promise<CollaborativeDocument> {
    try {
      const document = await this.getById(id);
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }

      // Ensure user has edit permission
      if (!document.editors.includes(userId)) {
        throw new Error(`User ${userId} does not have edit permission for this document`);
      }

      // Increment version
      const newVersion = document.version + 1;

      // Create history entry
      const historyEntry = {
        userId,
        timestamp: new Date(),
        changes: changeDescription
      };

      return await this.update(id, {
        content,
        version: newVersion,
        lastEditedBy: userId,
        editHistory: [...document.editHistory, historyEntry]
      }, userId);
    } catch (error) {
      console.error('Error updating document content:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a document
   * @param id Document ID
   * @param content Comment content
   * @param userId ID of the user adding the comment
   * @returns Promise with the updated document
   */
  async addComment(
    id: string,
    content: string,
    userId: string
  ): Promise<CollaborativeDocument> {
    try {
      const document = await this.getById(id);
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }

      // Ensure user has at least view permission
      if (!document.editors.includes(userId) && !document.viewers.includes(userId)) {
        throw new Error(`User ${userId} does not have permission to comment on this document`);
      }

      const commentId = `comment_${Date.now()}`;
      const comment = {
        id: commentId,
        userId,
        content,
        timestamp: new Date(),
        resolved: false,
        replies: []
      };

      const comments = [...(document.comments || []), comment];

      return await this.update(id, { comments }, userId);
    } catch (error) {
      console.error('Error adding comment to document:', error);
      throw error;
    }
  }

  /**
   * Add a reply to a comment
   * @param id Document ID
   * @param commentId Comment ID
   * @param content Reply content
   * @param userId ID of the user adding the reply
   * @returns Promise with the updated document
   */
  async addCommentReply(
    id: string,
    commentId: string,
    content: string,
    userId: string
  ): Promise<CollaborativeDocument> {
    try {
      const document = await this.getById(id);
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }

      if (!document.comments) {
        throw new Error(`Document has no comments`);
      }

      // Ensure user has at least view permission
      if (!document.editors.includes(userId) && !document.viewers.includes(userId)) {
        throw new Error(`User ${userId} does not have permission to comment on this document`);
      }

      const commentIndex = document.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error(`Comment with ID ${commentId} not found`);
      }

      const replyId = `reply_${Date.now()}`;
      const reply = {
        id: replyId,
        userId,
        content,
        timestamp: new Date()
      };

      const updatedComments = [...document.comments];
      updatedComments[commentIndex].replies = [
        ...(updatedComments[commentIndex].replies || []),
        reply
      ];

      return await this.update(id, { comments: updatedComments }, userId);
    } catch (error) {
      console.error('Error adding reply to comment:', error);
      throw error;
    }
  }

  /**
   * Mark a comment as resolved or unresolved
   * @param id Document ID
   * @param commentId Comment ID
   * @param resolved Whether the comment is resolved
   * @param userId ID of the user updating the comment
   * @returns Promise with the updated document
   */
  async updateCommentResolved(
    id: string,
    commentId: string,
    resolved: boolean,
    userId: string
  ): Promise<CollaborativeDocument> {
    try {
      const document = await this.getById(id);
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }

      if (!document.comments) {
        throw new Error(`Document has no comments`);
      }

      // Ensure user has edit permission
      if (!document.editors.includes(userId)) {
        throw new Error(`User ${userId} does not have edit permission for this document`);
      }

      const commentIndex = document.comments.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        throw new Error(`Comment with ID ${commentId} not found`);
      }

      const updatedComments = [...document.comments];
      updatedComments[commentIndex].resolved = resolved;

      return await this.update(id, { comments: updatedComments }, userId);
    } catch (error) {
      console.error('Error updating comment resolved status:', error);
      throw error;
    }
  }

  /**
   * Update document permissions
   * @param id Document ID
   * @param editors Array of editor user IDs
   * @param viewers Array of viewer user IDs
   * @param userId ID of the user updating permissions
   * @returns Promise with the updated document
   */
  async updateDocumentPermissions(
    id: string,
    editors: string[],
    viewers: string[],
    userId: string
  ): Promise<CollaborativeDocument> {
    try {
      const document = await this.getById(id);
      if (!document) {
        throw new Error(`Document with ID ${id} not found`);
      }

      // Ensure user has edit permission
      if (!document.editors.includes(userId)) {
        throw new Error(`User ${userId} does not have edit permission for this document`);
      }

      // Ensure the current user remains an editor
      if (!editors.includes(userId)) {
        editors.push(userId);
      }

      return await this.update(id, { editors, viewers }, userId);
    } catch (error) {
      console.error('Error updating document permissions:', error);
      throw error;
    }
  }

  /**
   * Subscribe to document changes
   * @param id Document ID
   * @param callback Function to call when document changes
   * @returns Unsubscribe function
   */
  subscribeToDocument(
    id: string,
    callback: (document: CollaborativeDocument | null) => void
  ): () => void {
    const docRef = doc(db, 'collaborativeDocuments', id);
    
    return onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as Omit<CollaborativeDocument, 'id'>;
        callback({
          id: docSnapshot.id,
          ...data
        });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error subscribing to document:', error);
      callback(null);
    });
  }
}