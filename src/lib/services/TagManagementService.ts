import { 
  Firestore, 
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
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';

/**
 * Tag color options
 */
export enum TagColor {
  DEFAULT = 'default',
  RED = 'red',
  ORANGE = 'orange',
  YELLOW = 'yellow',
  GREEN = 'green',
  BLUE = 'blue',
  PURPLE = 'purple',
  PINK = 'pink',
  GRAY = 'gray',
  BLACK = 'black'
}

/**
 * Tag entity type that the tag can be associated with
 */
export enum TagEntityType {
  LEAD = 'lead',
  CUSTOMER = 'customer',
  TASK = 'task',
  DOCUMENT = 'document',
  EMAIL = 'email',
  EMAIL_TEMPLATE = 'email_template',
  SMS = 'sms',
  ACTIVITY = 'activity',
  FILE = 'file',
  NOTE = 'note',
  ALL = 'all'
}

/**
 * Tag interface
 */
export interface Tag extends FirestoreDocument {
  name: string;
  color: TagColor;
  description?: string;
  entityTypes: TagEntityType[];
  isSystem?: boolean;
  usage: {
    [key in TagEntityType]?: number;
  };
}

/**
 * Tag application to entity
 */
export interface TagApplication extends FirestoreDocument {
  tagId: string;
  entityType: TagEntityType;
  entityId: string;
}

/**
 * Tag Management Service for multi-tenant tag operations
 */
export class TagManagementService {
  private currentTenantId: string | null = null;
  private db: Firestore;
  
  /**
   * Creates a new TagManagementService instance
   * @param tenantId Optional initial tenant ID
   */
  constructor(tenantId?: string) {
    this.db = db;
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
   * Get tags collection reference
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Firestore collection reference for tags
   */
  getTagsCollection(tenantId?: string): any {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(this.db, 'tenants', effectiveTenantId, 'tags');
  }
  
  /**
   * Get tag applications collection reference
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Firestore collection reference for tag applications
   */
  getTagApplicationsCollection(tenantId?: string): any {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(this.db, 'tenants', effectiveTenantId, 'tagApplications');
  }
  
  /**
   * Create a new tag
   * @param tagData Tag data
   * @param userId User ID creating the tag
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with created tag
   */
  async createTag(
    tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'usage'>, 
    userId: string,
    tenantId?: string
  ): Promise<Tag> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const tagsCollection = this.getTagsCollection(effectiveTenantId);
      
      // Check if tag with this name already exists
      const existingTag = await this.getTagByName(tagData.name, effectiveTenantId);
      if (existingTag) {
        throw new Error(`Tag with name ${tagData.name} already exists`);
      }
      
      // Prepare usage counter
      const usage: Record<string, number> = {};
      tagData.entityTypes.forEach(type => {
        usage[type] = 0;
      });
      
      // If ALL is included, add counters for all types
      if (tagData.entityTypes.includes(TagEntityType.ALL)) {
        Object.values(TagEntityType).forEach(type => {
          if (type !== TagEntityType.ALL) {
            usage[type] = 0;
          }
        });
      }
      
      const tag = {
        ...tagData,
        usage,
        isSystem: tagData.isSystem || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };
      
      const docRef = await addDoc(tagsCollection, tag);
      
      return {
        id: docRef.id,
        ...tag
      } as unknown as Tag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }
  
  /**
   * Get a tag by ID
   * @param id Tag ID
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with tag or null if not found
   */
  async getTag(id: string, tenantId?: string): Promise<Tag | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getTagsCollection(effectiveTenantId), id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(data as object)
      } as Tag;
    } catch (error) {
      console.error(`Error getting tag with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a tag by name
   * @param name Tag name
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with tag or null if not found
   */
  async getTagByName(name: string, tenantId?: string): Promise<Tag | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const tagsCollection = this.getTagsCollection(effectiveTenantId);
      
      const q = query(tagsCollection, where('name', '==', name), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...(data as object)
      } as Tag;
    } catch (error) {
      console.error(`Error getting tag with name ${name}:`, error);
      throw error;
    }
  }
  
  /**
   * Update a tag
   * @param id Tag ID
   * @param updates Updates to apply
   * @param userId User ID making the update
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with updated tag
   */
  async updateTag(
    id: string,
    updates: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'usage'>>,
    userId: string,
    tenantId?: string
  ): Promise<Tag> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the current tag
      const tag = await this.getTag(id, effectiveTenantId);
      if (!tag) {
        throw new Error(`Tag with ID ${id} not found`);
      }
      
      // System tags have restrictions
      if (tag.isSystem) {
        // Can't change name of system tags
        if (updates.name && updates.name !== tag.name) {
          throw new Error("Cannot change the name of a system tag");
        }
        
        // Can't change entity types of system tags
        if (updates.entityTypes) {
          throw new Error("Cannot change entity types of a system tag");
        }
      }
      
      // Check for name uniqueness if name is being updated
      if (updates.name && updates.name !== tag.name) {
        const existingTag = await this.getTagByName(updates.name, effectiveTenantId);
        if (existingTag) {
          throw new Error(`Tag with name ${updates.name} already exists`);
        }
      }
      
      const tagRef = doc(this.getTagsCollection(effectiveTenantId), id);
      
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      };
      
      await updateDoc(tagRef, updateData);
      
      return {
        ...tag,
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      } as unknown as Tag;
    } catch (error) {
      console.error(`Error updating tag with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a tag
   * @param id Tag ID
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise resolving when delete is complete
   */
  async deleteTag(id: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the tag to verify it exists and is not a system tag
      const tag = await this.getTag(id, effectiveTenantId);
      if (!tag) {
        throw new Error(`Tag with ID ${id} not found`);
      }
      
      if (tag.isSystem) {
        throw new Error("Cannot delete a system tag");
      }
      
      // Check if tag is in use
      let inUse = false;
      for (const type in tag.usage) {
        if (tag.usage[type as TagEntityType] > 0) {
          inUse = true;
          break;
        }
      }
      
      if (inUse) {
        throw new Error("Cannot delete a tag that is in use. Remove it from all entities first.");
      }
      
      // Delete the tag
      const tagRef = doc(this.getTagsCollection(effectiveTenantId), id);
      await deleteDoc(tagRef);
    } catch (error) {
      console.error(`Error deleting tag with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all tags
   * @param options Query options
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with array of tags
   */
  async getTags(
    options?: {
      entityType?: TagEntityType;
      includeSystem?: boolean;
      query?: string;
      sortBy?: 'name' | 'createdAt' | 'usage';
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    },
    tenantId?: string
  ): Promise<Tag[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const tagsCollection = this.getTagsCollection(effectiveTenantId);
      
      const constraints: QueryConstraint[] = [];
      
      if (options?.entityType) {
        // Match tags that support this entity type or ALL
        constraints.push(
          where('entityTypes', 'array-contains-any', [options.entityType, TagEntityType.ALL])
        );
      }
      
      if (options?.includeSystem === false) {
        constraints.push(where('isSystem', '==', false));
      }
      
      // Add sorting
      const sortField = options?.sortBy || 'name';
      const sortDir = options?.sortDirection || 'asc';
      
      if (sortField === 'usage') {
        // Special case for sorting by usage
        if (options?.entityType) {
          constraints.push(orderBy(`usage.${options.entityType}`, sortDir));
        } else {
          // Just use name as default if no entity type specified for usage sort
          constraints.push(orderBy('name', sortDir));
        }
      } else {
        constraints.push(orderBy(sortField, sortDir));
      }
      
      // Add limit if specified
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(tagsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      let tags = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tag));
      
      // Filter by query if provided (client-side filtering for name search)
      if (options?.query) {
        const searchQuery = options.query.toLowerCase();
        tags = tags.filter(tag => 
          tag.name.toLowerCase().includes(searchQuery) || 
          (tag.description && tag.description.toLowerCase().includes(searchQuery))
        );
      }
      
      return tags;
    } catch (error) {
      console.error('Error getting tags:', error);
      throw error;
    }
  }
  
  /**
   * Apply a tag to an entity
   * @param tagId Tag ID
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param userId User ID applying the tag
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with tag application record
   */
  async applyTag(
    tagId: string,
    entityType: TagEntityType,
    entityId: string,
    userId: string,
    tenantId?: string
  ): Promise<TagApplication> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Verify tag exists and supports this entity type
      const tag = await this.getTag(tagId, effectiveTenantId);
      if (!tag) {
        throw new Error(`Tag with ID ${tagId} not found`);
      }
      
      // Check if tag supports this entity type
      if (!tag.entityTypes.includes(entityType) && !tag.entityTypes.includes(TagEntityType.ALL)) {
        throw new Error(`Tag ${tag.name} cannot be applied to entity type ${entityType}`);
      }
      
      // Check if tag is already applied
      const applicationsCollection = this.getTagApplicationsCollection(effectiveTenantId);
      const q = query(
        applicationsCollection,
        where('tagId', '==', tagId),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Tag is already applied, return the existing application
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as object)
        } as TagApplication;
      }
      
      // Create a batch to update both the tag application and tag usage
      const batch = writeBatch(this.db);
      
      // Create the tag application
      const applicationData: Omit<TagApplication, 'id'> = {
        tagId,
        entityType,
        entityId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };
      
      const applicationRef = doc(applicationsCollection);
      batch.set(applicationRef, applicationData);
      
      // Update tag usage counter
      const tagRef = doc(this.getTagsCollection(effectiveTenantId), tagId);
      batch.update(tagRef, {
        [`usage.${entityType}`]: increment(1),
        updatedAt: new Date(),
        updatedBy: userId
      });
      
      await batch.commit();
      
      return {
        id: applicationRef.id,
        ...applicationData
      } as TagApplication;
    } catch (error) {
      console.error('Error applying tag:', error);
      throw error;
    }
  }
  
  /**
   * Remove a tag from an entity
   * @param tagId Tag ID
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param userId User ID removing the tag
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise resolving when removal is complete
   */
  async removeTag(
    tagId: string,
    entityType: TagEntityType,
    entityId: string,
    userId: string,
    tenantId?: string
  ): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Find the tag application
      const applicationsCollection = this.getTagApplicationsCollection(effectiveTenantId);
      const q = query(
        applicationsCollection,
        where('tagId', '==', tagId),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        // Tag is not applied, nothing to do
        return;
      }
      
      // Get the tag to ensure it exists
      const tag = await this.getTag(tagId, effectiveTenantId);
      if (!tag) {
        throw new Error(`Tag with ID ${tagId} not found`);
      }
      
      // Create a batch to update both the tag application and tag usage
      const batch = writeBatch(this.db);
      
      // Delete the tag application
      const applicationDoc = querySnapshot.docs[0];
      batch.delete(doc(applicationsCollection, applicationDoc.id));
      
      // Update tag usage counter
      const tagRef = doc(this.getTagsCollection(effectiveTenantId), tagId);
      batch.update(tagRef, {
        [`usage.${entityType}`]: increment(-1),
        updatedAt: new Date(),
        updatedBy: userId
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error removing tag:', error);
      throw error;
    }
  }
  
  /**
   * Get tags for an entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with array of tags
   */
  async getTagsForEntity(
    entityType: TagEntityType,
    entityId: string,
    tenantId?: string
  ): Promise<Tag[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the tag applications for this entity
      const applicationsCollection = this.getTagApplicationsCollection(effectiveTenantId);
      const q = query(
        applicationsCollection,
        where('entityType', '==', entityType),
        where('entityId', '==', entityId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return [];
      }
      
      // Get the tag IDs
      const tagIds = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return data.tagId as string;
      });
      
      // Get the tags
      const tagsCollection = this.getTagsCollection(effectiveTenantId);
      const tags: Tag[] = [];
      
      for (const tagId of tagIds) {
        const tagDoc = await getDoc(doc(tagsCollection, tagId));
        if (tagDoc.exists()) {
          const data = tagDoc.data();
          tags.push({
            id: tagDoc.id,
            ...(data as object)
          } as Tag);
        }
      }
      
      // Sort by name
      return tags.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting tags for entity:', error);
      throw error;
    }
  }
  
  /**
   * Get entities by tag
   * @param tagId Tag ID
   * @param entityType Optional entity type to filter by
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with array of entity IDs grouped by entity type
   */
  async getEntitiesByTag(
    tagId: string,
    entityType?: TagEntityType,
    tenantId?: string
  ): Promise<Record<TagEntityType, string[]>> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Verify tag exists
      const tag = await this.getTag(tagId, effectiveTenantId);
      if (!tag) {
        throw new Error(`Tag with ID ${tagId} not found`);
      }
      
      // Get the tag applications for this tag
      const applicationsCollection = this.getTagApplicationsCollection(effectiveTenantId);
      
      let q;
      if (entityType) {
        q = query(
          applicationsCollection,
          where('tagId', '==', tagId),
          where('entityType', '==', entityType)
        );
      } else {
        q = query(
          applicationsCollection,
          where('tagId', '==', tagId)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      // Group entity IDs by entity type
      const result: Record<TagEntityType, string[]> = {} as Record<TagEntityType, string[]>;
      
      querySnapshot.docs.forEach(doc => {
        const application = doc.data() as TagApplication;
        if (!result[application.entityType]) {
          result[application.entityType] = [];
        }
        result[application.entityType].push(application.entityId);
      });
      
      return result;
    } catch (error) {
      console.error('Error getting entities by tag:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to tags
   * @param callback Function to call when tags change
   * @param options Query options
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Unsubscribe function
   */
  subscribeToTags(
    callback: (tags: Tag[]) => void,
    options?: {
      entityType?: TagEntityType;
      includeSystem?: boolean;
      sortBy?: 'name' | 'createdAt';
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    },
    tenantId?: string
  ): Unsubscribe {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    const tagsCollection = this.getTagsCollection(effectiveTenantId);
    
    const constraints: QueryConstraint[] = [];
    
    if (options?.entityType) {
      constraints.push(
        where('entityTypes', 'array-contains-any', [options.entityType, TagEntityType.ALL])
      );
    }
    
    if (options?.includeSystem === false) {
      constraints.push(where('isSystem', '==', false));
    }
    
    // Add sorting
    const sortField = options?.sortBy || 'name';
    const sortDir = options?.sortDirection || 'asc';
    constraints.push(orderBy(sortField, sortDir));
    
    // Add limit if specified
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }
    
    const q = query(tagsCollection, ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const tags = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tag));
      
      callback(tags);
    });
  }
  
  /**
   * Create default system tags for a tenant
   * @param userId User ID creating the tags
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with array of created tags
   */
  async createDefaultSystemTags(userId: string, tenantId?: string): Promise<Tag[]> {
    try {
      const effectiveTenantId = tenantId ?? this.getCurrentTenantId();
      const createdTags: Tag[] = [];
      
      // Define default system tags
      const defaultTags = [
        {
          name: 'Important',
          color: TagColor.RED,
          description: 'High priority items that need immediate attention',
          entityTypes: [TagEntityType.ALL],
          isSystem: true
        },
        {
          name: 'Pending',
          color: TagColor.ORANGE,
          description: 'Items waiting for further action',
          entityTypes: [TagEntityType.ALL],
          isSystem: true
        },
        {
          name: 'Approved',
          color: TagColor.GREEN,
          description: 'Items that have been reviewed and approved',
          entityTypes: [TagEntityType.ALL],
          isSystem: true
        },
        {
          name: 'Completed',
          color: TagColor.BLUE,
          description: 'Finished items',
          entityTypes: [TagEntityType.ALL],
          isSystem: true
        },
        {
          name: 'Archived',
          color: TagColor.GRAY,
          description: 'Items no longer in active use',
          entityTypes: [TagEntityType.ALL],
          isSystem: true
        },
        {
          name: 'Hot Lead',
          color: TagColor.RED,
          description: 'Leads with high conversion potential',
          entityTypes: [TagEntityType.LEAD],
          isSystem: true
        },
        {
          name: 'VIP Customer',
          color: TagColor.PURPLE,
          description: 'High-value customers requiring special attention',
          entityTypes: [TagEntityType.CUSTOMER],
          isSystem: true
        },
        {
          name: 'Urgent',
          color: TagColor.RED,
          description: 'Tasks requiring immediate attention',
          entityTypes: [TagEntityType.TASK],
          isSystem: true
        }
      ];
      
      // Create tags if they don't already exist
      for (const tagData of defaultTags) {
        try {
          const existingTag = await this.getTagByName(tagData.name, effectiveTenantId);
          if (!existingTag) {
            const tag = await this.createTag(tagData, userId, effectiveTenantId);
            createdTags.push(tag);
          }
        } catch (error) {
          console.warn(`Error creating default tag ${tagData.name}:`, error);
          // Continue with next tag even if one fails
        }
      }
      
      return createdTags;
    } catch (error) {
      console.error('Error creating default system tags:', error);
      throw error;
    }
  }
  
  /**
   * Test tag isolation between tenants
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Promise with isolation test results
   */
  async testTagIsolation(
    tenantId1: string,
    tenantId2: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Create a unique test tag in tenant 1
      const testTagName = `Test Tag ${Date.now()}`;
      const userId = 'system';
      
      const tag1 = await this.createTag({
        name: testTagName,
        color: TagColor.BLUE,
        description: 'Test tag for isolation testing',
        entityTypes: [TagEntityType.ALL]
      }, userId, tenantId1);
      
      // Try to access the tag from tenant 2
      this.setTenantContext(tenantId2);
      const tag2 = await this.getTagByName(testTagName, tenantId2);
      
      // Clean up
      await this.deleteTag(tag1.id, tenantId1);
      
      if (tag2) {
        return {
          success: false,
          message: `Isolation failed: Tag created in tenant ${tenantId1} was accessible from tenant ${tenantId2}`
        };
      }
      
      return {
        success: true,
        message: `Tag isolation successful: Tags are properly isolated between tenants ${tenantId1} and ${tenantId2}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing tag isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Create a singleton instance
export const tagManagementService = new TagManagementService(); 