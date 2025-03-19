"use client";

import { useEffect, useState } from 'react';
import { DocumentData } from 'firebase/firestore';
import { subscribeToNotifications } from '@/lib/realtime/firebase-realtime';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  Notification
} from '@/lib/realtime/notifications';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

/**
 * A hook for subscribing to a user's notifications in real-time
 * @param userId The user's ID
 * @param tenantId The tenant ID
 * @param includeRead Whether to include read notifications (default: false)
 * @param maxResults Maximum number of notifications to fetch (default: 50)
 * @returns An object containing the notifications data, loading state, error, and utility functions
 */
export function useNotifications(
  userId: string | null | undefined,
  tenantId: string | null | undefined,
  includeRead: boolean = false,
  maxResults: number = 50
): NotificationsState {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If no user ID or tenant ID is provided, set notifications to empty array and stop loading
    if (!userId || !tenantId) {
      setNotifications([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    
    // Subscribe to notifications
    const unsubscribe = subscribeToNotifications<Notification>(
      userId,
      tenantId,
      (newData, newError) => {
        setNotifications(newData);
        setLoading(false);
        
        if (newError) {
          setError(newError);
        }
      },
      includeRead,
      maxResults
    );
    
    // Cleanup function to unsubscribe when component unmounts
    // or when parameters change
    return () => {
      unsubscribe();
    };
  }, [userId, tenantId, includeRead, maxResults]);

  // Calculate unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Mark a notification as read
  const handleMarkAsRead = async (notificationId: string): Promise<void> => {
    if (!userId || !tenantId) return;
    
    try {
      await markNotificationAsRead(notificationId);
      
      // Optimistically update the UI
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error);
      } else {
        setError(new Error('Unknown error marking notification as read'));
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async (): Promise<void> => {
    if (!userId || !tenantId) return;
    
    try {
      await markAllNotificationsAsRead(userId, tenantId);
      
      // Optimistically update the UI
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error);
      } else {
        setError(new Error('Unknown error marking all notifications as read'));
      }
    }
  };

  // Delete a notification
  const handleDeleteNotification = async (notificationId: string): Promise<void> => {
    if (!userId || !tenantId) return;
    
    try {
      await deleteNotification(notificationId);
      
      // Optimistically update the UI
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error);
      } else {
        setError(new Error('Unknown error deleting notification'));
      }
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
  };
} 