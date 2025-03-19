import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Enum representing different activity types 
 */
export enum ActivityType {
  // Lead related activities
  LEAD_CREATED = 'lead_created',
  LEAD_UPDATED = 'lead_updated',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_DELETED = 'lead_deleted',
  LEAD_CONVERTED = 'lead_converted',
  
  // Customer related activities
  CUSTOMER_CREATED = 'customer_created',
  CUSTOMER_UPDATED = 'customer_updated',
  CUSTOMER_STATUS_CHANGED = 'customer_status_changed',
  CUSTOMER_ASSIGNED = 'customer_assigned',
  CUSTOMER_DELETED = 'customer_deleted',
  
  // User related activities
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PASSWORD_CHANGED = 'user_password_changed',
  USER_EMAIL_CHANGED = 'user_email_changed',
  
  // System activities
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_INFO = 'system_info',
  
  // Task related activities
  TASK_CREATED = 'task_created',
  TASK_COMPLETED = 'task_completed',
  TASK_UPDATED = 'task_updated',
  TASK_DELETED = 'task_deleted',
  
  // Email related activities
  EMAIL_SENT = 'email_sent',
  EMAIL_OPENED = 'email_opened',
  EMAIL_CLICKED = 'email_clicked',
  
  // Note activities
  NOTE_ADDED = 'note_added',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  
  // Custom activities
  CUSTOM = 'custom'
}

/**
 * Activity interface defining the structure of activity records
 */
export interface Activity {
  id?: string;
  type: ActivityType;
  userId?: string;
  targetId?: string;  // ID of the affected resource (lead, customer, etc.)
  targetType?: string; // Type of the target (lead, customer, user, etc.)
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  isSystem: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Service for tracking and querying user and system activities with multi-tenant isolation
 */
export class ActivityService {
  private currentTenantId: string | null;
  
  constructor(tenantId: string | null = null) {
    this.currentTenantId = tenantId;
  }
  
  /**
   * Set the current tenant context for operations
   * @param tenantId The tenant ID to use for subsequent operations
   */
  setTenantContext(tenantId: string | null): void {
    this.currentTenantId = tenantId;
  }
  
  /**
   * Get the current tenant ID being used
   * @returns The current tenant ID
   * @throws Error if no tenant ID is set
   */
  getCurrentTenantId(): string {
    if (!this.currentTenantId) {
      throw new Error('No tenant context set. Call setTenantContext or provide tenantId in constructor.');
    }
    return this.currentTenantId;
  }
  
  /**
   * Get the Firestore collection reference for activities in the current tenant
   * @param tenantId Optional override for the tenant ID
   * @returns Collection reference
   */
  private getActivitiesCollection(tenantId?: string) {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(db, 'tenants', effectiveTenantId, 'activities');
  }
  
  /**
   * Log a new activity
   * @param type Activity type
   * @param description Description of the activity
   * @param options Additional options for the activity
   * @param tenantId Optional tenant ID override
   * @returns Promise with the created activity
   */
  async logActivity(
    type: ActivityType,
    description: string,
    options?: {
      userId?: string;
      targetId?: string;
      targetType?: string;
      metadata?: Record<string, any>;
      isSystem?: boolean;
      ipAddress?: string;
      userAgent?: string;
    },
    tenantId?: string
  ): Promise<Activity> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const activitiesCollection = this.getActivitiesCollection(effectiveTenantId);
      
      const now = new Date();
      const activityData = {
        type,
        description,
        timestamp: now,
        isSystem: options?.isSystem || false,
        createdAt: now,
        updatedAt: now,
        createdBy: options?.userId || 'system',
        updatedBy: options?.userId || 'system',
        ...options
      };
      
      const docRef = await addDoc(activitiesCollection, activityData);
      
      return {
        id: docRef.id,
        ...activityData
      };
    } catch (error) {
      console.error('Error logging activity:', error);
      // Return a minimal activity object if creation fails
      return {
        type,
        description,
        timestamp: new Date(),
        isSystem: options?.isSystem || false,
      } as Activity;
    }
  }
  
  /**
   * Log a system activity
   * @param type Activity type
   * @param description Description of the activity
   * @param metadata Optional metadata about the activity
   * @param tenantId Optional tenant ID override
   * @returns Promise with the created activity
   */
  async logSystemActivity(
    type: ActivityType,
    description: string,
    metadata?: Record<string, any>,
    tenantId?: string
  ): Promise<Activity> {
    return this.logActivity(
      type,
      description,
      {
        isSystem: true,
        metadata
      },
      tenantId
    );
  }
  
  /**
   * Log a user activity
   * @param userId User ID
   * @param type Activity type
   * @param description Description of the activity
   * @param options Additional options
   * @param tenantId Optional tenant ID override
   * @returns Promise with the created activity
   */
  async logUserActivity(
    userId: string,
    type: ActivityType,
    description: string,
    options?: {
      targetId?: string;
      targetType?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    },
    tenantId?: string
  ): Promise<Activity> {
    return this.logActivity(
      type,
      description,
      {
        userId,
        ...options,
        isSystem: false
      },
      tenantId
    );
  }
  
  /**
   * Get all activities for the current tenant
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of activities
   */
  async getActivities(tenantId?: string): Promise<Activity[]> {
    try {
      const activitiesCollection = this.getActivitiesCollection(tenantId);
      const querySnapshot = await getDocs(query(
        activitiesCollection,
        orderBy('timestamp', 'desc')
      ));
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
    } catch (error) {
      console.error('Error getting activities:', error);
      return [];
    }
  }
  
  /**
   * Get a single activity by ID
   * @param activityId Activity ID
   * @param tenantId Optional tenant ID override
   * @returns Promise with activity or null if not found
   */
  async getActivity(activityId: string, tenantId?: string): Promise<Activity | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const activityRef = doc(db, 'tenants', effectiveTenantId, 'activities', activityId);
      const activitySnap = await getDoc(activityRef);
      
      if (!activitySnap.exists()) {
        return null;
      }
      
      return {
        id: activitySnap.id,
        ...activitySnap.data()
      } as Activity;
    } catch (error) {
      console.error('Error getting activity:', error);
      return null;
    }
  }
  
  /**
   * Delete an activity (normally only used for testing or admin cleanup)
   * @param activityId Activity ID
   * @param tenantId Optional tenant ID override
   * @returns Promise<void>
   */
  async deleteActivity(activityId: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const activityRef = doc(db, 'tenants', effectiveTenantId, 'activities', activityId);
      
      await deleteDoc(activityRef);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }
  
  /**
   * Get recent activities for the current tenant
   * @param days Number of days to look back
   * @param maxResults Maximum number of results to return
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of activities
   */
  async getRecentActivities(
    days: number = 7,
    maxResults: number = 50,
    tenantId?: string
  ): Promise<Activity[]> {
    try {
      const activitiesCollection = this.getActivitiesCollection(tenantId);
      
      // Calculate the date threshold
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      
      const q = query(
        activitiesCollection,
        where('timestamp', '>=', threshold),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }
  
  /**
   * Get activities for a specific user
   * @param userId User ID
   * @param days Number of days to look back
   * @param maxResults Maximum number of results to return
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of activities
   */
  async getUserActivities(
    userId: string,
    days: number = 30,
    maxResults: number = 100,
    tenantId?: string
  ): Promise<Activity[]> {
    try {
      const activitiesCollection = this.getActivitiesCollection(tenantId);
      
      // Calculate the date threshold
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      
      const q = query(
        activitiesCollection,
        where('userId', '==', userId),
        where('timestamp', '>=', threshold),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }
  
  /**
   * Get activities for a specific target
   * @param targetType Target type (e.g., 'lead', 'customer')
   * @param targetId Target ID
   * @param maxResults Maximum number of results to return
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of activities
   */
  async getTargetActivities(
    targetType: string,
    targetId: string,
    maxResults: number = 100,
    tenantId?: string
  ): Promise<Activity[]> {
    try {
      const activitiesCollection = this.getActivitiesCollection(tenantId);
      
      const q = query(
        activitiesCollection,
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
    } catch (error) {
      console.error('Error getting target activities:', error);
      return [];
    }
  }
  
  /**
   * Get activities by type
   * @param type Activity type
   * @param days Number of days to look back
   * @param maxResults Maximum number of results to return
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of activities
   */
  async getActivitiesByType(
    type: ActivityType,
    days: number = 30,
    maxResults: number = 100,
    tenantId?: string
  ): Promise<Activity[]> {
    try {
      const activitiesCollection = this.getActivitiesCollection(tenantId);
      
      // Calculate the date threshold
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      
      const q = query(
        activitiesCollection,
        where('type', '==', type),
        where('timestamp', '>=', threshold),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
    } catch (error) {
      console.error('Error getting activities by type:', error);
      return [];
    }
  }
  
  /**
   * Subscribe to tenant activities with real-time updates
   * @param callback Function to call with updated activities array
   * @param maxResults Maximum number of results to return
   * @param tenantId Optional tenant ID override
   * @returns Unsubscribe function
   */
  subscribeToActivities(
    callback: (activities: Activity[]) => void,
    maxResults: number = 50,
    tenantId?: string
  ): Unsubscribe {
    try {
      const activitiesCollection = this.getActivitiesCollection(tenantId);
      
      const q = query(
        activitiesCollection,
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      return onSnapshot(q, (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];
        
        callback(activities);
      });
    } catch (error) {
      console.error('Error subscribing to activities:', error);
      throw error;
    }
  }
  
  /**
   * Test multi-tenant isolation by creating a test activity and verifying it can't be accessed from a different tenant
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Test result
   */
  async testActivityIsolation(tenantId1: string, tenantId2: string): Promise<{success: boolean, message: string}> {
    try {
      // Create a test activity in tenant 1
      const testActivity = {
        type: ActivityType.SYSTEM_INFO,
        description: `Isolation test activity ${Date.now()}`,
        isSystem: true,
        timestamp: new Date(),
        metadata: {
          test: true,
          timestamp: Date.now()
        }
      };
      
      const createdActivity = await this.logActivity(
        testActivity.type,
        testActivity.description,
        {
          isSystem: true,
          metadata: testActivity.metadata
        },
        tenantId1
      );
      
      if (!createdActivity.id) {
        throw new Error('Failed to create test activity with valid ID');
      }
      
      // Try to retrieve the activity from tenant 2
      const activityFromTenant2 = await this.getActivity(createdActivity.id, tenantId2);
      
      // Clean up the test activity
      await this.deleteActivity(createdActivity.id, tenantId1);
      
      // Check if isolation is working
      if (!activityFromTenant2) {
        return {
          success: true,
          message: 'Activity isolation is functioning correctly'
        };
      } else {
        return {
          success: false,
          message: 'Activity isolation failed: data from tenant 1 is accessible in tenant 2'
        };
      }
    } catch (error) {
      console.error('Error testing activity isolation:', error);
      return {
        success: false,
        message: `Activity isolation test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 