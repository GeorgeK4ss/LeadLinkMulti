import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type QueryConstraint,
  Unsubscribe,
  type DocumentData,
  type DocumentSnapshot,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { type Activity } from '@/types/firestore';
import { type Notification } from '../realtime/notifications';

/**
 * Subscribe to a single document with real-time updates
 * @param collectionName The Firestore collection name
 * @param documentId The document ID to subscribe to
 * @param callback Function to call with the document data when it changes
 * @returns An unsubscribe function
 */
export function subscribeToDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  callback: (data: T | null, error?: Error) => void
): Unsubscribe {
  const docRef = doc(db, collectionName, documentId);
  
  return onSnapshot(
    docRef,
    (snapshot: DocumentSnapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.id, ...snapshot.data() } as unknown as T;
        callback(data);
      } else {
        callback(null);
      }
    },
    (error: Error) => {
      console.error(`Error subscribing to document ${documentId} in ${collectionName}:`, error);
      callback(null, error);
    }
  );
}

/**
 * Subscribe to a collection with real-time updates
 * @param collectionName The Firestore collection name
 * @param constraints Optional query constraints (where, orderBy, limit, etc.)
 * @param callback Function to call with the collection data when it changes
 * @returns An unsubscribe function
 */
export function subscribeToCollection<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  callback: (data: T[], error?: Error) => void
): Unsubscribe {
  const collectionRef = collection(db, collectionName);
  const queryRef = constraints.length > 0 
    ? query(collectionRef, ...constraints)
    : query(collectionRef);
  
  return onSnapshot(
    queryRef,
    (snapshot: QuerySnapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
      callback(data);
    },
    (error: Error) => {
      console.error(`Error subscribing to collection ${collectionName}:`, error);
      callback([], error);
    }
  );
}

/**
 * Subscribe to a filtered collection for a specific tenant
 * @param collectionName The Firestore collection name
 * @param tenantId The tenant ID to filter by
 * @param additionalConstraints Optional additional query constraints
 * @param callback Function to call with the collection data when it changes
 * @returns An unsubscribe function
 */
export function subscribeTenantCollection<T extends DocumentData>(
  collectionName: string,
  tenantId: string,
  additionalConstraints: QueryConstraint[] = [],
  callback: (data: T[], error?: Error) => void
): Unsubscribe {
  const constraints = [
    where('tenantId', '==', tenantId),
    ...additionalConstraints
  ];
  
  return subscribeToCollection<T>(collectionName, constraints, callback);
}

/**
 * Subscribe to a filtered collection with a specific status
 * @param collectionName The Firestore collection name
 * @param tenantId The tenant ID to filter by
 * @param status The status to filter by
 * @param additionalConstraints Optional additional query constraints
 * @param callback Function to call with the collection data when it changes
 * @returns An unsubscribe function
 */
export function subscribeByStatus<T extends DocumentData>(
  collectionName: string,
  tenantId: string,
  status: string,
  additionalConstraints: QueryConstraint[] = [],
  callback: (data: T[], error?: Error) => void
): Unsubscribe {
  const constraints = [
    where('tenantId', '==', tenantId),
    where('status', '==', status),
    ...additionalConstraints
  ];
  
  return subscribeToCollection<T>(collectionName, constraints, callback);
}

/**
 * Subscribe to recent activities
 * @param tenantId The tenant ID to filter by
 * @param callback Function to call with the activities data when it changes
 * @param maxResults Maximum number of results to return
 * @param entityId Optional entity ID to filter by (user, lead, etc.)
 * @param entityType Optional entity type to filter by
 * @returns An unsubscribe function
 */
export function subscribeToActivities<T extends DocumentData>(
  tenantId: string,
  callback: (data: T[], error?: Error) => void,
  maxResults: number = 50,
  entityId?: string,
  entityType?: string
): Unsubscribe {
  let constraints: QueryConstraint[] = [
    where('tenantId', '==', tenantId),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  ];
  
  if (entityId) {
    constraints.push(where('entityId', '==', entityId));
  }
  
  if (entityType) {
    constraints.push(where('entityType', '==', entityType));
  }
  
  return subscribeToCollection<T>('activities', constraints, callback);
}

/**
 * Subscribe to user notifications
 * @param userId The user ID to filter by
 * @param tenantId The tenant ID to filter by
 * @param callback Function to call with the notifications data when it changes
 * @param includeRead Whether to include read notifications
 * @param maxResults Maximum number of results to return
 * @returns An unsubscribe function
 */
export function subscribeToNotifications<T extends DocumentData>(
  userId: string,
  tenantId: string,
  callback: (data: T[], error?: Error) => void,
  includeRead: boolean = false,
  maxResults: number = 50
): Unsubscribe {
  let constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    where('tenantId', '==', tenantId),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  ];
  
  // Only include unread notifications if specified
  if (!includeRead) {
    constraints.push(where('read', '==', false));
  }
  
  return subscribeToCollection<T>('notifications', constraints, callback);
} 