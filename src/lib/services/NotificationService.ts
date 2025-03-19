import { db } from '@/lib/firebase';
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
  arrayUnion,
  arrayRemove,
  updateDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { FirestoreDocument, FirestoreService } from './firebase/FirestoreService';

/**
 * Enum representing different notification types 
 */
export enum NotificationType {
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  CUSTOMER_ASSIGNED = 'customer_assigned',
  TASK_ASSIGNED = 'task_assigned',
  TASK_DUE_SOON = 'task_due_soon',
  TASK_OVERDUE = 'task_overdue',
  MENTION = 'mention',
  COMMENT = 'comment',
  SYSTEM = 'system',
  TEAM_INVITE = 'team_invite',
  CAMPAIGN_COMPLETED = 'campaign_completed',
  REPORT_AVAILABLE = 'report_available',
  MESSAGE = 'message',
  CUSTOM = 'custom'
}

/**
 * Enum representing notification priority levels 
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Interface defining the structure of a notification
 */
export interface Notification extends FirestoreDocument {
  type: NotificationType;
  title: string;
  message: string;
  recipientIds: string[];
  readBy: string[];
  dismissedBy: string[];
  priority: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * Service for managing user notifications with multi-tenant isolation
 */
export class NotificationService extends FirestoreService<Notification> {
  private currentTenantId: string | null = null;

  /**
   * Creates a new instance of NotificationService
   * @param tenantId Optional initial tenant ID
   */
  constructor(tenantId?: string) {
    super('notifications');
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
   * Gets the Firestore collection reference for notifications of the current tenant
   * @param tenantId Optional tenant ID to override current context
   * @returns Firestore collection reference
   */
  getNotificationsCollection(tenantId?: string) {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(db, 'tenants', effectiveTenantId, 'notifications');
  }
  
  /**
   * Create a new notification
   * @param type Notification type
   * @param title Notification title
   * @param message Notification message
   * @param recipientIds Array of recipient user IDs
   * @param options Additional notification options
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with the created notification
   */
  async createNotification(
    type: NotificationType,
    title: string,
    message: string,
    recipientIds: string[],
    options?: {
      priority?: NotificationPriority;
      link?: string;
      metadata?: Record<string, any>;
      expiresAt?: Date;
      createdBy?: string;
    },
    tenantId?: string
  ): Promise<Notification | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Default expiration is 30 days from now
      const defaultExpiration = new Date();
      defaultExpiration.setDate(defaultExpiration.getDate() + 30);
      
      const notificationData: Omit<Notification, 'id'> = {
        type,
        title,
        message,
        recipientIds,
        readBy: [],
        dismissedBy: [],
        priority: options?.priority || NotificationPriority.MEDIUM,
        link: options?.link,
        metadata: options?.metadata,
        expiresAt: options?.expiresAt || defaultExpiration,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: options?.createdBy,
        updatedBy: options?.createdBy
      };
      
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const docRef = doc(notificationsCollection);
      const id = docRef.id;
      
      await updateDoc(docRef, {
        ...notificationData,
        id
      });
      
      return {
        id,
        ...notificationData
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
  
  /**
   * Get a notification by ID
   * @param notificationId Notification ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with the notification or null if not found
   */
  async getNotification(notificationId: string, tenantId?: string): Promise<Notification | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const docRef = doc(notificationsCollection, notificationId);
      
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Notification;
    } catch (error) {
      console.error('Error getting notification:', error);
      return null;
    }
  }
  
  /**
   * Get all unread notifications for a user
   * @param userId User ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with array of unread notifications
   */
  async getUnreadNotifications(userId: string, tenantId?: string): Promise<Notification[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const now = new Date();
      
      const q = query(
        notificationsCollection,
        where('recipientIds', 'array-contains', userId),
        where('readBy', 'not-in', [userId]),
        where('dismissedBy', 'not-in', [userId]),
        where('expiresAt', '>', now),
        orderBy('expiresAt'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      
      // Alternative query if the previous one fails due to complex query restrictions
      try {
        const effectiveTenantId = tenantId || this.getCurrentTenantId();
        const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
        
        const q = query(
          notificationsCollection,
          where('recipientIds', 'array-contains', userId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const now = new Date();
        
        return querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Notification))
          .filter(notification => 
            !notification.readBy.includes(userId) &&
            !notification.dismissedBy.includes(userId) &&
            notification.expiresAt !== undefined &&
            notification.expiresAt > now
          );
      } catch (fallbackError) {
        console.error('Error in fallback query for unread notifications:', fallbackError);
        return [];
      }
    }
  }
  
  /**
   * Get all notifications for a user
   * @param userId User ID
   * @param maxResults Maximum number of results to return
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise with array of notifications
   */
  async getUserNotifications(
    userId: string, 
    maxResults: number = 100,
    tenantId?: string
  ): Promise<Notification[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      
      const q = query(
        notificationsCollection,
        where('recipientIds', 'array-contains', userId),
        where('dismissedBy', 'not-in', [userId]),
        orderBy('createdAt', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification))
        .filter(notification => !notification.dismissedBy.includes(userId));
    } catch (error) {
      console.error('Error getting user notifications:', error);
      
      // Alternative query if the previous one fails
      try {
        const effectiveTenantId = tenantId || this.getCurrentTenantId();
        const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
        
        const q = query(
          notificationsCollection,
          where('recipientIds', 'array-contains', userId),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Notification))
          .filter(notification => !notification.dismissedBy.includes(userId));
      } catch (fallbackError) {
        console.error('Error in fallback query for user notifications:', fallbackError);
        return [];
      }
    }
  }
  
  /**
   * Mark a notification as read for a user
   * @param notificationId Notification ID
   * @param userId User ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async markAsRead(notificationId: string, userId: string, tenantId?: string): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const docRef = doc(notificationsCollection, notificationId);
      
      await updateDoc(docRef, {
        readBy: arrayUnion(userId),
        updatedAt: new Date(),
        updatedBy: userId
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Mark multiple notifications as read for a user
   * @param notificationIds Array of notification IDs
   * @param userId User ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async markMultipleAsRead(notificationIds: string[], userId: string, tenantId?: string): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const batch = writeBatch(db);
      
      for (const notificationId of notificationIds) {
        const docRef = doc(notificationsCollection, notificationId);
        batch.update(docRef, {
          readBy: arrayUnion(userId),
          updatedAt: new Date(),
          updatedBy: userId
        });
      }
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
      return false;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async markAllAsRead(userId: string, tenantId?: string): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const unreadNotifications = await this.getUnreadNotifications(userId, effectiveTenantId);
      const notificationIds = unreadNotifications
        .map(notification => notification.id)
        .filter((id): id is string => id !== undefined);
      
      if (notificationIds.length === 0) {
        return true;
      }
      
      return await this.markMultipleAsRead(notificationIds, userId, effectiveTenantId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  /**
   * Dismiss a notification for a user
   * @param notificationId Notification ID
   * @param userId User ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async dismissNotification(notificationId: string, userId: string, tenantId?: string): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const docRef = doc(notificationsCollection, notificationId);
      
      await updateDoc(docRef, {
        dismissedBy: arrayUnion(userId),
        updatedAt: new Date(),
        updatedBy: userId
      });
      return true;
    } catch (error) {
      console.error('Error dismissing notification:', error);
      return false;
    }
  }
  
  /**
   * Dismiss multiple notifications for a user
   * @param notificationIds Array of notification IDs
   * @param userId User ID
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async dismissMultiple(notificationIds: string[], userId: string, tenantId?: string): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const batch = writeBatch(db);
      
      for (const notificationId of notificationIds) {
        const docRef = doc(notificationsCollection, notificationId);
        batch.update(docRef, {
          dismissedBy: arrayUnion(userId),
          updatedAt: new Date(),
          updatedBy: userId
        });
      }
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error dismissing multiple notifications:', error);
      return false;
    }
  }
  
  /**
   * Add recipients to a notification
   * @param notificationId Notification ID
   * @param userIds Array of user IDs to add as recipients
   * @param updatedBy ID of the user making the update
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async addRecipients(
    notificationId: string, 
    userIds: string[], 
    updatedBy: string,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const docRef = doc(notificationsCollection, notificationId);
      
      const notification = await this.getNotification(notificationId, effectiveTenantId);
      if (!notification) {
        return false;
      }
      
      // Filter out users who are already recipients
      const newUserIds = userIds.filter(userId => !notification.recipientIds.includes(userId));
      if (newUserIds.length === 0) {
        return true; // Nothing to do
      }
      
      const batch = writeBatch(db);
      
      // Add each user individually to ensure they are all added
      for (const userId of newUserIds) {
        batch.update(docRef, {
          recipientIds: arrayUnion(userId),
          updatedAt: new Date(),
          updatedBy
        });
      }
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error adding recipients to notification:', error);
      return false;
    }
  }
  
  /**
   * Remove recipients from a notification
   * @param notificationId Notification ID
   * @param userIds Array of user IDs to remove from recipients
   * @param updatedBy ID of the user making the update
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async removeRecipients(
    notificationId: string, 
    userIds: string[], 
    updatedBy: string,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const docRef = doc(notificationsCollection, notificationId);
      
      const batch = writeBatch(db);
      
      // Remove each user individually
      for (const userId of userIds) {
        batch.update(docRef, {
          recipientIds: arrayRemove(userId),
          updatedAt: new Date(),
          updatedBy
        });
      }
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error removing recipients from notification:', error);
      return false;
    }
  }
  
  /**
   * Delete expired notifications
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to number of deleted notifications
   */
  async deleteExpiredNotifications(tenantId?: string): Promise<number> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const now = new Date();
      
      const q = query(
        notificationsCollection,
        where('expiresAt', '<', now)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return 0;
      }
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
      return 0;
    }
  }
  
  /**
   * Subscribe to real-time updates for a user's notifications
   * @param userId User ID
   * @param callback Function to call with updated notifications array
   * @param tenantId Optional tenant ID to override current context
   * @returns Unsubscribe function
   */
  subscribeToUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
    tenantId?: string
  ): Unsubscribe {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
    
    const q = query(
      notificationsCollection,
      where('recipientIds', 'array-contains', userId),
      where('dismissedBy', 'not-in', [userId]),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification))
        .filter(notification => !notification.dismissedBy.includes(userId));
      
      callback(notifications);
    });
  }

  /**
   * Tests notification isolation between tenants
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Object indicating success or failure with message
   */
  async testNotificationIsolation(tenantId1: string, tenantId2: string): Promise<{ success: boolean; message: string }> {
    try {
      // Create a test notification in tenant 1
      const testTitle = `Test Notification ${Date.now()}`;
      const testMessage = 'This is a test notification for tenant isolation';
      const testUserId = 'test-user-id';
      
      // Create in tenant 1
      const createdNotification = await this.createNotification(
        NotificationType.SYSTEM,
        testTitle,
        testMessage,
        [testUserId],
        {
          metadata: { isTest: true },
          createdBy: 'system'
        },
        tenantId1
      );
      
      if (!createdNotification || !createdNotification.id) {
        return { 
          success: false, 
          message: 'Failed to create test notification with valid ID' 
        };
      }
      
      // Try to access from tenant 2
      const notificationFromTenant2 = await this.getNotification(createdNotification.id, tenantId2);
      
      // Clean up - delete from tenant 1
      await this.deleteNotification(createdNotification.id, tenantId1);
      
      if (notificationFromTenant2) {
        return {
          success: false,
          message: `Tenant isolation failed: Tenant ${tenantId2} was able to access notification from tenant ${tenantId1}`
        };
      }
      
      return {
        success: true,
        message: 'Tenant isolation successful: Notifications are properly isolated between tenants'
      };
    } catch (error) {
      console.error('Error in notification isolation test:', error);
      return {
        success: false,
        message: `Error testing notification isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Deletes a notification
   * @param notificationId Notification ID to delete
   * @param tenantId Optional tenant ID to override current context
   * @returns Promise resolving to boolean success indicator
   */
  async deleteNotification(notificationId: string, tenantId?: string): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const notificationsCollection = this.getNotificationsCollection(effectiveTenantId);
      const docRef = doc(notificationsCollection, notificationId);
      
      await updateDoc(docRef, { deletedAt: new Date() });
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
} 