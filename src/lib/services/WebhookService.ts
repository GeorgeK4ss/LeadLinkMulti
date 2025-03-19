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
  Timestamp,
  serverTimestamp,
  setDoc,
  DocumentReference
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';

/**
 * Webhook event types
 */
export enum WebhookEventType {
  // Lead events
  LEAD_CREATED = 'lead.created',
  LEAD_UPDATED = 'lead.updated',
  LEAD_DELETED = 'lead.deleted',
  LEAD_CONVERTED = 'lead.converted',
  LEAD_ASSIGNED = 'lead.assigned',
  
  // Customer events
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_DELETED = 'customer.deleted',
  
  // Deal events
  DEAL_CREATED = 'deal.created',
  DEAL_UPDATED = 'deal.updated',
  DEAL_DELETED = 'deal.deleted',
  DEAL_STAGE_CHANGED = 'deal.stage_changed',
  DEAL_WON = 'deal.won',
  DEAL_LOST = 'deal.lost',
  
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  
  // Activity events
  ACTIVITY_CREATED = 'activity.created',
  ACTIVITY_UPDATED = 'activity.updated',
  ACTIVITY_DELETED = 'activity.deleted',
  ACTIVITY_COMPLETED = 'activity.completed',
  
  // Task events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_COMPLETED = 'task.completed',
  TASK_ASSIGNED = 'task.assigned',
  
  // System events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  SYSTEM_ERROR = 'system.error',
  BACKUP_CREATED = 'backup.created',
  EXPORT_COMPLETED = 'export.completed',
  IMPORT_COMPLETED = 'import.completed'
}

/**
 * Webhook status
 */
export enum WebhookStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  FAILED = 'failed',
  PENDING_VERIFICATION = 'pending_verification'
}

/**
 * Webhook interface
 */
export interface Webhook extends FirestoreDocument {
  name: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  status: WebhookStatus;
  tenantId: string;
  createdBy: string;
  failureCount: number;
  lastFailure?: {
    timestamp: Date;
    statusCode: number;
    message: string;
  };
  successCount: number;
  lastSuccess?: Date;
  headers?: Record<string, string>;
  description?: string;
  version?: string;
  isVerified?: boolean;
  verificationCode?: string;
  verificationExpiry?: Date;
}

/**
 * Webhook event log interface
 */
export interface WebhookEventLog extends FirestoreDocument {
  webhookId: string;
  eventType: WebhookEventType;
  payload: any;
  attempt: number;
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  response?: any;
  error?: string;
  processingTime?: number;
  tenantId: string;
}

/**
 * Webhook delivery options
 */
export interface WebhookDeliveryOptions {
  timeout?: number;  // Timeout in milliseconds
  maxRetries?: number;
  retryDelay?: number;  // Delay between retries in milliseconds
  retryBackoff?: boolean;  // Whether to use exponential backoff
}

/**
 * Event payload for webhook
 */
export interface WebhookEventPayload {
  eventType: WebhookEventType;
  timestamp: number;
  data: any;
  tenant: string;
  environment: 'production' | 'staging' | 'development';
  version: string;
}

/**
 * Default webhook delivery options
 */
const DEFAULT_DELIVERY_OPTIONS: WebhookDeliveryOptions = {
  timeout: 10000,  // 10 seconds
  maxRetries: 3,
  retryDelay: 5000,  // 5 seconds
  retryBackoff: true
};

/**
 * Webhook Service for managing webhooks and sending webhook events
 */
export class WebhookService {
  private db: Firestore;
  private readonly WEBHOOKS_COLLECTION = 'webhooks';
  private readonly WEBHOOK_LOGS_COLLECTION = 'webhook_events';
  private readonly WEBHOOK_SECRET_LENGTH = 32;
  private readonly APP_VERSION = '1.0.0';
  private environment: 'production' | 'staging' | 'development';
  
  constructor() {
    this.db = db;
    
    // Determine environment based on hostname or environment variable
    this.environment = process.env.NODE_ENV === 'production' 
      ? 'production' 
      : (process.env.NODE_ENV === 'staging' ? 'staging' : 'development');
  }
  
  /**
   * Register a new webhook
   * @param webhook Webhook configuration
   * @param userId User ID
   * @returns Created webhook
   */
  async createWebhook(webhook: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt' | 'secret' | 'failureCount' | 'successCount'>, userId: string): Promise<Webhook> {
    try {
      // Generate secret if not provided
      const secret = webhook.secret || this.generateSecret();
      
      // Generate verification code if webhook requires verification
      const verificationCode = this.generateVerificationCode();
      const verificationExpiry = new Date();
      verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry
      
      const newWebhook: Partial<Webhook> = {
        ...webhook,
        secret,
        status: WebhookStatus.PENDING_VERIFICATION,
        createdBy: userId,
        failureCount: 0,
        successCount: 0,
        isVerified: false,
        verificationCode,
        verificationExpiry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add the webhook to the database
      const webhooksCollection = collection(this.db, this.WEBHOOKS_COLLECTION);
      const docRef = await addDoc(webhooksCollection, newWebhook);
      
      // Get the created document
      const webhookSnapshot = await getDoc(docRef);
      const createdWebhook = {
        id: webhookSnapshot.id,
        ...webhookSnapshot.data()
      } as Webhook;
      
      // Try to send verification event
      await this.sendVerificationEvent(createdWebhook);
      
      return createdWebhook;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing webhook
   * @param id Webhook ID
   * @param webhook Webhook update data
   * @param userId User ID
   * @returns Updated webhook
   */
  async updateWebhook(id: string, webhook: Partial<Webhook>, userId: string): Promise<Webhook> {
    try {
      const webhookRef = doc(this.db, this.WEBHOOKS_COLLECTION, id);
      const webhookSnapshot = await getDoc(webhookRef);
      
      if (!webhookSnapshot.exists()) {
        throw new Error(`Webhook with ID ${id} not found`);
      }
      
      const currentWebhook = {
        id: webhookSnapshot.id,
        ...webhookSnapshot.data()
      } as Webhook;
      
      // If URL changed, require re-verification
      const needsVerification = webhook.url && webhook.url !== currentWebhook.url;
      
      let updates: Partial<Webhook> = {
        ...webhook,
        updatedAt: serverTimestamp()
      };
      
      // If webhook needs verification, update status and generate new verification code
      if (needsVerification) {
        const verificationCode = this.generateVerificationCode();
        const verificationExpiry = new Date();
        verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry
        
        updates = {
          ...updates,
          status: WebhookStatus.PENDING_VERIFICATION,
          isVerified: false,
          verificationCode,
          verificationExpiry
        };
      }
      
      await updateDoc(webhookRef, updates as any);
      
      // Get the updated webhook
      const updatedWebhookSnapshot = await getDoc(webhookRef);
      const updatedWebhook = {
        id: updatedWebhookSnapshot.id,
        ...updatedWebhookSnapshot.data()
      } as Webhook;
      
      // If webhook needs verification, send verification event
      if (needsVerification) {
        await this.sendVerificationEvent(updatedWebhook);
      }
      
      return updatedWebhook;
    } catch (error) {
      console.error(`Error updating webhook ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a webhook
   * @param id Webhook ID
   * @returns Promise that resolves when webhook is deleted
   */
  async deleteWebhook(id: string): Promise<void> {
    try {
      const webhookRef = doc(this.db, this.WEBHOOKS_COLLECTION, id);
      await deleteDoc(webhookRef);
    } catch (error) {
      console.error(`Error deleting webhook ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a webhook by ID
   * @param id Webhook ID
   * @returns Webhook or null if not found
   */
  async getWebhook(id: string): Promise<Webhook | null> {
    try {
      const webhookRef = doc(this.db, this.WEBHOOKS_COLLECTION, id);
      const webhookSnapshot = await getDoc(webhookRef);
      
      if (!webhookSnapshot.exists()) {
        return null;
      }
      
      return {
        id: webhookSnapshot.id,
        ...webhookSnapshot.data()
      } as Webhook;
    } catch (error) {
      console.error(`Error getting webhook ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get webhooks for a tenant
   * @param tenantId Tenant ID
   * @param eventType Optional event type to filter by
   * @returns Array of webhooks
   */
  async getWebhooksForTenant(tenantId: string, eventType?: WebhookEventType): Promise<Webhook[]> {
    try {
      const webhooksCollection = collection(this.db, this.WEBHOOKS_COLLECTION);
      
      // Create query
      let q = query(
        webhooksCollection,
        where('tenantId', '==', tenantId),
        where('status', '==', WebhookStatus.ACTIVE),
        orderBy('createdAt', 'desc')
      );
      
      // If event type is specified, filter webhooks that listen for this event
      if (eventType) {
        q = query(
          webhooksCollection,
          where('tenantId', '==', tenantId),
          where('status', '==', WebhookStatus.ACTIVE),
          where('events', 'array-contains', eventType),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Webhook));
    } catch (error) {
      console.error(`Error getting webhooks for tenant ${tenantId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verify a webhook using verification code
   * @param id Webhook ID
   * @param verificationCode Verification code
   * @returns Updated webhook
   */
  async verifyWebhook(id: string, verificationCode: string): Promise<Webhook> {
    try {
      const webhookRef = doc(this.db, this.WEBHOOKS_COLLECTION, id);
      const webhookSnapshot = await getDoc(webhookRef);
      
      if (!webhookSnapshot.exists()) {
        throw new Error(`Webhook with ID ${id} not found`);
      }
      
      const webhook = {
        id: webhookSnapshot.id,
        ...webhookSnapshot.data()
      } as Webhook;
      
      // Check if verification code is valid and not expired
      if (webhook.verificationCode !== verificationCode) {
        throw new Error('Invalid verification code');
      }
      
      if (webhook.verificationExpiry && webhook.verificationExpiry.getTime() < Date.now()) {
        throw new Error('Verification code has expired');
      }
      
      // Update webhook status
      await updateDoc(webhookRef, {
        status: WebhookStatus.ACTIVE,
        isVerified: true,
        verificationCode: null,
        verificationExpiry: null,
        updatedAt: serverTimestamp()
      });
      
      // Get the updated webhook
      const updatedWebhookSnapshot = await getDoc(webhookRef);
      
      return {
        id: updatedWebhookSnapshot.id,
        ...updatedWebhookSnapshot.data()
      } as Webhook;
    } catch (error) {
      console.error(`Error verifying webhook ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Trigger a webhook event
   * @param eventType Event type
   * @param data Event data
   * @param tenantId Tenant ID
   * @param options Delivery options
   * @returns Promise that resolves when all webhooks are triggered
   */
  async triggerEvent(
    eventType: WebhookEventType,
    data: any,
    tenantId: string,
    options: Partial<WebhookDeliveryOptions> = {}
  ): Promise<void> {
    try {
      // Get webhooks for this tenant that listen to this event type
      const webhooks = await this.getWebhooksForTenant(tenantId, eventType);
      
      if (webhooks.length === 0) {
        return; // No webhooks to trigger
      }
      
      // Build the event payload
      const payload: WebhookEventPayload = {
        eventType,
        timestamp: Date.now(),
        data,
        tenant: tenantId,
        environment: this.environment,
        version: this.APP_VERSION
      };
      
      // Trigger each webhook
      const deliveryPromises = webhooks.map(webhook => 
        this.deliverWebhook(webhook, payload, options)
      );
      
      // Wait for all webhooks to be triggered
      await Promise.all(deliveryPromises);
    } catch (error) {
      console.error(`Error triggering event ${eventType}:`, error);
      throw error;
    }
  }
  
  /**
   * Deliver a webhook
   * @param webhook Webhook to deliver
   * @param payload Event payload
   * @param options Delivery options
   * @returns Promise that resolves when webhook is delivered
   */
  private async deliverWebhook(
    webhook: Webhook,
    payload: WebhookEventPayload,
    options: Partial<WebhookDeliveryOptions> = {}
  ): Promise<void> {
    const mergedOptions = { ...DEFAULT_DELIVERY_OPTIONS, ...options };
    
    // Create a webhook event log entry
    const eventLogRef = await this.createEventLog(webhook, payload);
    
    try {
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': webhook.id,
        'X-Webhook-Event': payload.eventType,
        'X-Webhook-Signature': this.generateSignature(payload, webhook.secret),
        'X-Webhook-Timestamp': payload.timestamp.toString(),
        ...webhook.headers
      };
      
      // Start delivery timer
      const startTime = Date.now();
      
      // Make the request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(mergedOptions.timeout || 10000)
      });
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Update event log and webhook based on response
      if (response.ok) {
        // Success case
        const responseData = await response.text();
        
        // Update event log
        await this.updateEventLogSuccess(eventLogRef, {
          status: 'success',
          statusCode: response.status,
          response: responseData,
          processingTime
        });
        
        // Update webhook success stats
        await this.updateWebhookSuccess(webhook.id);
      } else {
        // Failed case
        const responseData = await response.text();
        
        // Update event log
        await this.updateEventLogFailure(eventLogRef, {
          status: 'failed',
          statusCode: response.status,
          error: `Request failed with status ${response.status}: ${responseData}`,
          processingTime
        });
        
        // Update webhook failure stats
        await this.updateWebhookFailure(webhook.id, {
          statusCode: response.status,
          message: `Request failed with status ${response.status}: ${responseData}`
        });
        
        // Retry if needed
        if (mergedOptions.maxRetries && mergedOptions.maxRetries > 0) {
          await this.retryWebhook(webhook, payload, {
            ...mergedOptions,
            maxRetries: mergedOptions.maxRetries - 1
          });
        }
      }
    } catch (error) {
      // Handle request errors
      console.error(`Error delivering webhook ${webhook.id}:`, error);
      
      // Update event log
      await this.updateEventLogFailure(eventLogRef, {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        processingTime: 0
      });
      
      // Update webhook failure stats
      await this.updateWebhookFailure(webhook.id, {
        statusCode: 0,
        message: error instanceof Error ? error.message : String(error)
      });
      
      // Retry if needed
      if (mergedOptions.maxRetries && mergedOptions.maxRetries > 0) {
        await this.retryWebhook(webhook, payload, {
          ...mergedOptions,
          maxRetries: mergedOptions.maxRetries - 1
        });
      }
    }
  }
  
  /**
   * Retry a webhook delivery after a delay
   * @param webhook Webhook to retry
   * @param payload Event payload
   * @param options Delivery options
   */
  private async retryWebhook(
    webhook: Webhook,
    payload: WebhookEventPayload,
    options: WebhookDeliveryOptions
  ): Promise<void> {
    // Calculate delay
    let delay = options.retryDelay || 5000;
    
    // Apply exponential backoff if enabled
    if (options.retryBackoff) {
      const retryAttempt = DEFAULT_DELIVERY_OPTIONS.maxRetries! - options.maxRetries!;
      delay = delay * Math.pow(2, retryAttempt);
    }
    
    // Wait for the delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry the webhook
    await this.deliverWebhook(webhook, payload, options);
  }
  
  /**
   * Create event log entry
   * @param webhook Webhook
   * @param payload Event payload
   * @returns Document reference to the created event log
   */
  private async createEventLog(
    webhook: Webhook,
    payload: WebhookEventPayload
  ): Promise<DocumentReference> {
    const eventLog: Partial<WebhookEventLog> = {
      webhookId: webhook.id,
      eventType: payload.eventType,
      payload,
      attempt: 1,
      status: 'pending',
      tenantId: webhook.tenantId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const eventLogsCollection = collection(this.db, this.WEBHOOK_LOGS_COLLECTION);
    return await addDoc(eventLogsCollection, eventLog);
  }
  
  /**
   * Update event log for successful delivery
   * @param eventLogRef Event log reference
   * @param updateData Update data
   */
  private async updateEventLogSuccess(
    eventLogRef: DocumentReference,
    updateData: Partial<WebhookEventLog>
  ): Promise<void> {
    await updateDoc(eventLogRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Update event log for failed delivery
   * @param eventLogRef Event log reference
   * @param updateData Update data
   */
  private async updateEventLogFailure(
    eventLogRef: DocumentReference,
    updateData: Partial<WebhookEventLog>
  ): Promise<void> {
    await updateDoc(eventLogRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Update webhook with successful delivery
   * @param webhookId Webhook ID
   */
  private async updateWebhookSuccess(webhookId: string): Promise<void> {
    const webhookRef = doc(this.db, this.WEBHOOKS_COLLECTION, webhookId);
    
    await updateDoc(webhookRef, {
      successCount: { increment: 1 },
      lastSuccess: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Update webhook with failed delivery
   * @param webhookId Webhook ID
   * @param failure Failure details
   */
  private async updateWebhookFailure(
    webhookId: string,
    failure: { statusCode: number; message: string }
  ): Promise<void> {
    const webhookRef = doc(this.db, this.WEBHOOKS_COLLECTION, webhookId);
    const webhookSnapshot = await getDoc(webhookRef);
    
    if (!webhookSnapshot.exists()) {
      return;
    }
    
    const webhook = webhookSnapshot.data() as Webhook;
    const failureCount = (webhook.failureCount || 0) + 1;
    
    // If webhook has failed too many times, set status to failed
    let status = webhook.status;
    if (failureCount >= 10 && status === WebhookStatus.ACTIVE) {
      status = WebhookStatus.FAILED;
    }
    
    await updateDoc(webhookRef, {
      failureCount,
      status,
      lastFailure: {
        timestamp: serverTimestamp(),
        statusCode: failure.statusCode,
        message: failure.message
      },
      updatedAt: serverTimestamp()
    });
  }
  
  /**
   * Send verification event to webhook
   * @param webhook Webhook to verify
   */
  private async sendVerificationEvent(webhook: Webhook): Promise<void> {
    try {
      // Build verification payload
      const payload: WebhookEventPayload = {
        eventType: WebhookEventType.SYSTEM_ERROR,
        timestamp: Date.now(),
        data: {
          message: 'Webhook verification',
          code: webhook.verificationCode
        },
        tenant: webhook.tenantId,
        environment: this.environment,
        version: this.APP_VERSION
      };
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-ID': webhook.id,
        'X-Webhook-Event': payload.eventType,
        'X-Webhook-Signature': this.generateSignature(payload, webhook.secret),
        'X-Webhook-Timestamp': payload.timestamp.toString(),
        ...webhook.headers
      };
      
      // Make the request
      await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
    } catch (error) {
      console.error(`Error sending verification event to webhook ${webhook.id}:`, error);
      // Failure to verify doesn't prevent creation, user can verify later
    }
  }
  
  /**
   * Generate a signature for a webhook payload
   * @param payload Webhook payload
   * @param secret Webhook secret
   * @returns HMAC signature
   */
  private generateSignature(payload: any, secret: string): string {
    // In a real implementation, use a proper HMAC library
    // For this example, we'll just use a simple hash
    const payloadStr = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < payloadStr.length; i++) {
      const char = payloadStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // In production, use crypto:
    // const crypto = require('crypto');
    // return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    
    return `sha256=${Math.abs(hash).toString(16)}`;
  }
  
  /**
   * Generate a random secret for webhooks
   * @returns Random secret
   */
  private generateSecret(): string {
    // In a real implementation, use a proper crypto library
    // For this example, we'll just use a simple random string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < this.WEBHOOK_SECRET_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
    
    // In production, use crypto:
    // const crypto = require('crypto');
    // return crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * Generate a verification code for webhooks
   * @returns Verification code
   */
  private generateVerificationCode(): string {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  /**
   * Get webhook event logs
   * @param webhookId Webhook ID
   * @param limit Maximum number of logs to return
   * @param status Optional status to filter by
   * @returns Array of webhook event logs
   */
  async getWebhookLogs(
    webhookId: string,
    limit: number = 50,
    status?: 'success' | 'failed' | 'pending'
  ): Promise<WebhookEventLog[]> {
    try {
      const logsCollection = collection(this.db, this.WEBHOOK_LOGS_COLLECTION);
      
      // Create query
      let q = query(
        logsCollection,
        where('webhookId', '==', webhookId),
        orderBy('createdAt', 'desc')
      );
      
      // Add status filter if specified
      if (status) {
        q = query(
          logsCollection,
          where('webhookId', '==', webhookId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WebhookEventLog));
    } catch (error) {
      console.error(`Error getting webhook logs for ${webhookId}:`, error);
      throw error;
    }
  }
  
  /**
   * Reactivate a failed webhook
   * @param id Webhook ID
   * @returns Updated webhook
   */
  async reactivateWebhook(id: string): Promise<Webhook> {
    try {
      const webhookRef = doc(this.db, this.WEBHOOKS_COLLECTION, id);
      const webhookSnapshot = await getDoc(webhookRef);
      
      if (!webhookSnapshot.exists()) {
        throw new Error(`Webhook with ID ${id} not found`);
      }
      
      const webhook = webhookSnapshot.data() as Webhook;
      
      if (webhook.status !== WebhookStatus.FAILED) {
        return {
          id: webhookSnapshot.id,
          ...webhook
        } as Webhook;
      }
      
      // Reset failure count and set status to active
      await updateDoc(webhookRef, {
        status: WebhookStatus.ACTIVE,
        failureCount: 0,
        updatedAt: serverTimestamp()
      });
      
      // Get the updated webhook
      const updatedWebhookSnapshot = await getDoc(webhookRef);
      
      return {
        id: updatedWebhookSnapshot.id,
        ...updatedWebhookSnapshot.data()
      } as Webhook;
    } catch (error) {
      console.error(`Error reactivating webhook ${id}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService(); 