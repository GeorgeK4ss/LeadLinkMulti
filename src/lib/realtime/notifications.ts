import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  DocumentData,
  getDocs,
  Timestamp,
  WriteBatch,
  writeBatch,
  FieldValue
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  linkUrl?: string;
  linkText?: string;
  entityId?: string;
  entityType?: string;
  createdAt: Timestamp | FieldValue; 
}

/**
 * Create a new notification
 * @param notification The notification data to create
 * @returns The ID of the created notification
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
  try {
    const notificationData = {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param notificationId The ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications for a user as read
 * @param userId The ID of the user
 * @param tenantId The ID of the tenant
 */
export async function markAllNotificationsAsRead(userId: string, tenantId: string): Promise<void> {
  try {
    // Get all unread notifications for the user
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('tenantId', '==', tenantId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(notificationsQuery);
    
    // Use a batch to update all notifications at once
    const batch = writeBatch(db);
    
    querySnapshot.forEach((document) => {
      const notificationRef = doc(db, 'notifications', document.id);
      batch.update(notificationRef, { read: true });
    });
    
    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 * @param tenantId The tenant ID
 * @param userIds Array of user IDs to notify
 * @param notificationData The notification data (without userId, tenantId, id, and createdAt)
 */
export async function createNotificationForUsers(
  tenantId: string,
  userIds: string[],
  notificationData: Omit<Notification, 'id' | 'userId' | 'tenantId' | 'createdAt'>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Create a notification for each user
    userIds.forEach((userId) => {
      const notification = {
        ...notificationData,
        userId,
        tenantId,
        read: false,
        createdAt: serverTimestamp(),
      };
      
      const newNotificationRef = doc(collection(db, 'notifications'));
      batch.set(newNotificationRef, notification);
    });
    
    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error creating notifications for users:', error);
    throw error;
  }
}

/**
 * Delete a notification
 * @param notificationId The ID of the notification to delete
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      deleted: true
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
} 