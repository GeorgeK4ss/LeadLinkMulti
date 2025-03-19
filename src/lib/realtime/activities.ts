import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  DocumentData,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Activity {
  id: string;
  tenantId: string;
  userId: string;
  userDisplayName?: string;
  userPhotoURL?: string;
  action: string;
  description: string;
  entityId?: string;
  entityType?: string;
  entityName?: string;
  metadata?: Record<string, any>;
  timestamp: Timestamp | FieldValue;
}

/**
 * Activity types for consistent logging
 */
export const ActivityTypes = {
  LEAD: {
    CREATED: 'lead_created',
    UPDATED: 'lead_updated',
    DELETED: 'lead_deleted',
    STATUS_CHANGED: 'lead_status_changed',
    ASSIGNED: 'lead_assigned',
    CONVERTED: 'lead_converted',
    NOTE_ADDED: 'lead_note_added'
  },
  CUSTOMER: {
    CREATED: 'customer_created',
    UPDATED: 'customer_updated',
    DELETED: 'customer_deleted',
    STATUS_CHANGED: 'customer_status_changed',
    ASSIGNED: 'customer_assigned',
    NOTE_ADDED: 'customer_note_added'
  },
  TASK: {
    CREATED: 'task_created',
    UPDATED: 'task_updated',
    DELETED: 'task_deleted',
    COMPLETED: 'task_completed',
    STATUS_CHANGED: 'task_status_changed',
    ASSIGNED: 'task_assigned',
    COMMENT_ADDED: 'task_comment_added'
  },
  DEAL: {
    CREATED: 'deal_created',
    UPDATED: 'deal_updated',
    DELETED: 'deal_deleted',
    STAGE_CHANGED: 'deal_stage_changed',
    ASSIGNED: 'deal_assigned',
    WON: 'deal_won',
    LOST: 'deal_lost',
    NOTE_ADDED: 'deal_note_added'
  },
  USER: {
    LOGGED_IN: 'user_logged_in',
    LOGGED_OUT: 'user_logged_out',
    CREATED: 'user_created',
    UPDATED: 'user_updated',
    DELETED: 'user_deleted',
    ROLE_CHANGED: 'user_role_changed',
    SETTINGS_CHANGED: 'user_settings_changed'
  },
  SYSTEM: {
    TENANT_CREATED: 'tenant_created',
    TENANT_UPDATED: 'tenant_updated',
    TENANT_DELETED: 'tenant_deleted',
    SETTINGS_CHANGED: 'settings_changed',
    INTEGRATION_CONNECTED: 'integration_connected',
    INTEGRATION_DISCONNECTED: 'integration_disconnected',
    ERROR: 'system_error'
  }
};

/**
 * Create a new activity log entry
 * @param activity The activity data to create (without id and timestamp)
 * @returns The ID of the created activity log
 */
export async function createActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Promise<string> {
  try {
    const activityData = {
      ...activity,
      timestamp: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'activities'), activityData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }
}

/**
 * Create a detailed activity log for a specific action
 * @param tenantId The tenant ID
 * @param userId The user ID who performed the action
 * @param action The action type (use ActivityTypes constants)
 * @param description A human-readable description of the activity
 * @param entityDetails Optional details about the related entity
 * @returns The ID of the created activity log
 */
export async function logActivity(
  tenantId: string,
  userId: string,
  action: string,
  description: string,
  entityDetails?: {
    entityId?: string;
    entityType?: string;
    entityName?: string;
    metadata?: Record<string, any>;
  }
): Promise<string> {
  try {
    // Get user display name and photo URL
    let userDisplayName: string | undefined;
    let userPhotoURL: string | undefined;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userDisplayName = userData.displayName;
        userPhotoURL = userData.photoURL;
      }
    } catch (error) {
      console.warn('Could not fetch user details for activity log:', error);
      // Continue without user details
    }
    
    // Create the activity log
    const activity: Omit<Activity, 'id' | 'timestamp'> = {
      tenantId,
      userId,
      userDisplayName,
      userPhotoURL,
      action,
      description,
      ...(entityDetails || {})
    };
    
    return createActivity(activity);
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
}

/**
 * Log a lead-related activity
 * @param tenantId The tenant ID
 * @param userId The user ID who performed the action
 * @param leadId The lead ID
 * @param leadName The lead name
 * @param action The action type (use ActivityTypes.LEAD constants)
 * @param description A human-readable description of the activity
 * @param metadata Optional additional data about the activity
 * @returns The ID of the created activity log
 */
export async function logLeadActivity(
  tenantId: string,
  userId: string,
  leadId: string,
  leadName: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logActivity(
    tenantId,
    userId,
    action,
    description,
    {
      entityId: leadId,
      entityType: 'lead',
      entityName: leadName,
      metadata
    }
  );
}

/**
 * Log a customer-related activity
 * @param tenantId The tenant ID
 * @param userId The user ID who performed the action
 * @param customerId The customer ID
 * @param customerName The customer name
 * @param action The action type (use ActivityTypes.CUSTOMER constants)
 * @param description A human-readable description of the activity
 * @param metadata Optional additional data about the activity
 * @returns The ID of the created activity log
 */
export async function logCustomerActivity(
  tenantId: string,
  userId: string,
  customerId: string,
  customerName: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logActivity(
    tenantId,
    userId,
    action,
    description,
    {
      entityId: customerId,
      entityType: 'customer',
      entityName: customerName,
      metadata
    }
  );
}

/**
 * Log a task-related activity
 * @param tenantId The tenant ID
 * @param userId The user ID who performed the action
 * @param taskId The task ID
 * @param taskTitle The task title
 * @param action The action type (use ActivityTypes.TASK constants)
 * @param description A human-readable description of the activity
 * @param metadata Optional additional data about the activity
 * @returns The ID of the created activity log
 */
export async function logTaskActivity(
  tenantId: string,
  userId: string,
  taskId: string,
  taskTitle: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logActivity(
    tenantId,
    userId,
    action,
    description,
    {
      entityId: taskId,
      entityType: 'task',
      entityName: taskTitle,
      metadata
    }
  );
}

/**
 * Log a user-related activity
 * @param tenantId The tenant ID
 * @param userId The user ID who performed the action
 * @param targetUserId The ID of the user the action is about (can be the same as userId)
 * @param targetUserName The name of the user the action is about
 * @param action The action type (use ActivityTypes.USER constants)
 * @param description A human-readable description of the activity
 * @param metadata Optional additional data about the activity
 * @returns The ID of the created activity log
 */
export async function logUserActivity(
  tenantId: string,
  userId: string,
  targetUserId: string,
  targetUserName: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logActivity(
    tenantId,
    userId,
    action,
    description,
    {
      entityId: targetUserId,
      entityType: 'user',
      entityName: targetUserName,
      metadata
    }
  );
}

/**
 * Log a system-related activity
 * @param tenantId The tenant ID
 * @param userId The user ID who performed the action
 * @param action The action type (use ActivityTypes.SYSTEM constants)
 * @param description A human-readable description of the activity
 * @param metadata Optional additional data about the activity
 * @returns The ID of the created activity log
 */
export async function logSystemActivity(
  tenantId: string,
  userId: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
): Promise<string> {
  return logActivity(
    tenantId,
    userId,
    action,
    description,
    {
      entityType: 'system',
      metadata
    }
  );
} 