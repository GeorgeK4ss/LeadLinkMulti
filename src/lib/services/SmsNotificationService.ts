import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  DocumentReference
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';

/**
 * SMS Notification Provider
 */
export enum SmsProvider {
  TWILIO = 'twilio',
  SENDGRID = 'sendgrid',
  AWS_SNS = 'aws_sns',
  VONAGE = 'vonage',
  CUSTOM = 'custom'
}

/**
 * SMS Notification Status
 */
export enum SmsStatus {
  QUEUED = 'queued',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  UNDELIVERED = 'undelivered'
}

/**
 * SMS Notification Type
 */
export enum SmsNotificationType {
  VERIFICATION = 'verification',
  ALERT = 'alert',
  REMINDER = 'reminder',
  PROMOTIONAL = 'promotional',
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  TWO_FACTOR = 'two_factor'
}

/**
 * SMS Message Template
 */
export interface SmsTemplate extends FirestoreDocument {
  name: string;
  content: string;
  type: SmsNotificationType;
  variables: string[];
  createdBy: string;
  isActive: boolean;
  tags?: string[];
  description?: string;
}

/**
 * SMS Notification
 */
export interface SmsNotification extends FirestoreDocument {
  to: string;
  from?: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, any>;
  type: SmsNotificationType;
  status: SmsStatus;
  provider: SmsProvider;
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  failedAt?: Timestamp;
  error?: string;
  externalId?: string; // ID from provider (e.g., Twilio message SID)
  retryCount: number;
  maxRetries: number;
  userId?: string; // User who the SMS is being sent to
  tenantId?: string; // For multi-tenant applications
  metadata?: Record<string, any>;
}

/**
 * SMS Provider Configuration
 */
export interface SmsProviderConfig extends FirestoreDocument {
  provider: SmsProvider;
  accountSid?: string; // For Twilio
  authToken?: string; // For Twilio
  apiKey?: string; // For SendGrid, Vonage
  apiSecret?: string; // For Vonage
  accessKeyId?: string; // For AWS SNS
  secretAccessKey?: string; // For AWS SNS
  region?: string; // For AWS SNS
  defaultFrom: string;
  isActive: boolean;
  createdBy: string;
  tenantId?: string;
  customEndpoint?: string; // For custom provider
}

/**
 * SMS Delivery Options
 */
export interface SmsDeliveryOptions {
  priority?: 'high' | 'normal' | 'low';
  maxRetries?: number;
  retryInterval?: number; // in milliseconds
  provider?: SmsProvider; // Override default provider
  scheduledFor?: Date; // For scheduled SMS
  trackDelivery?: boolean;
  validatePhoneNumber?: boolean;
}

/**
 * SMS Notification Service for sending SMS messages
 */
export class SmsNotificationService {
  private db: Firestore;
  private functions: ReturnType<typeof getFunctions>;
  private auth: ReturnType<typeof getAuth>;
  
  private readonly SMS_TEMPLATES_COLLECTION = 'sms_templates';
  private readonly SMS_NOTIFICATIONS_COLLECTION = 'sms_notifications';
  private readonly SMS_PROVIDERS_COLLECTION = 'sms_providers';
  
  constructor() {
    this.db = db;
    this.functions = getFunctions();
    this.auth = getAuth();
  }
  
  /**
   * Send SMS notification
   * @param to Phone number to send SMS to
   * @param body SMS content
   * @param options SMS delivery options
   * @returns Promise with sent SMS notification
   */
  async sendSms(
    to: string,
    body: string,
    options: Partial<SmsDeliveryOptions> = {}
  ): Promise<SmsNotification> {
    try {
      // Get current user
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to send SMS');
      }
      
      // Validate phone number format
      if (options.validatePhoneNumber !== false) {
        if (!this.isValidPhoneNumber(to)) {
          throw new Error(`Invalid phone number format: ${to}`);
        }
      }
      
      // Get active provider configuration
      const provider = options.provider || await this.getDefaultProvider();
      
      // Create SMS notification document
      const smsData: Omit<SmsNotification, 'id'> = {
        to,
        body,
        type: SmsNotificationType.TRANSACTIONAL, // Default
        status: SmsStatus.QUEUED,
        provider,
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {}
      };
      
      // Add to Firestore
      const smsRef = await addDoc(collection(this.db, this.SMS_NOTIFICATIONS_COLLECTION), smsData);
      
      // For scheduled messages, just save and return
      if (options.scheduledFor && options.scheduledFor > new Date()) {
        await updateDoc(smsRef, {
          metadata: {
            ...smsData.metadata,
            scheduledFor: Timestamp.fromDate(options.scheduledFor)
          }
        });
        
        return {
          id: smsRef.id,
          ...smsData
        } as SmsNotification;
      }
      
      // Send SMS via Cloud Function
      const result = await this.deliverSms(smsRef.id);
      
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
  
  /**
   * Send SMS using a template
   * @param to Phone number to send SMS to
   * @param templateId ID of SMS template
   * @param templateData Data for template variables
   * @param options SMS delivery options
   * @returns Promise with sent SMS notification
   */
  async sendTemplatedSms(
    to: string,
    templateId: string,
    templateData: Record<string, any> = {},
    options: Partial<SmsDeliveryOptions> = {}
  ): Promise<SmsNotification> {
    try {
      // Get template
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      // Replace template variables with actual data
      const body = this.processTemplate(template.content, templateData);
      
      // Get current user
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to send templated SMS');
      }
      
      // Get active provider configuration
      const provider = options.provider || await this.getDefaultProvider();
      
      // Create SMS notification document
      const smsData: Omit<SmsNotification, 'id'> = {
        to,
        body,
        templateId,
        templateData,
        type: template.type,
        status: SmsStatus.QUEUED,
        provider,
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {}
      };
      
      // Add to Firestore
      const smsRef = await addDoc(collection(this.db, this.SMS_NOTIFICATIONS_COLLECTION), smsData);
      
      // For scheduled messages, just save and return
      if (options.scheduledFor && options.scheduledFor > new Date()) {
        await updateDoc(smsRef, {
          metadata: {
            ...smsData.metadata,
            scheduledFor: Timestamp.fromDate(options.scheduledFor)
          }
        });
        
        return {
          id: smsRef.id,
          ...smsData
        } as SmsNotification;
      }
      
      // Send SMS via Cloud Function
      const result = await this.deliverSms(smsRef.id);
      
      return result;
    } catch (error) {
      console.error('Error sending templated SMS:', error);
      throw error;
    }
  }
  
  /**
   * Create SMS template
   * @param template Template data
   * @returns Promise with created template
   */
  async createTemplate(template: Omit<SmsTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<SmsTemplate> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to create template');
      }
      
      const templateData = {
        ...template,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      // Extract variables from template content using {{variable}} pattern
      const variableMatches = template.content.match(/\{\{([^}]+)\}\}/g) || [];
      const variables = variableMatches.map(match => match.substring(2, match.length - 2).trim());
      
      // Add to Firestore
      const templateRef = await addDoc(
        collection(this.db, this.SMS_TEMPLATES_COLLECTION), 
        { ...templateData, variables }
      );
      
      return {
        id: templateRef.id,
        ...templateData,
        variables
      } as SmsTemplate;
    } catch (error) {
      console.error('Error creating SMS template:', error);
      throw error;
    }
  }
  
  /**
   * Update SMS template
   * @param id Template ID
   * @param template Template data to update
   * @returns Promise with updated template
   */
  async updateTemplate(id: string, template: Partial<Omit<SmsTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>): Promise<SmsTemplate> {
    try {
      const templateRef = doc(this.db, this.SMS_TEMPLATES_COLLECTION, id);
      const templateDoc = await getDoc(templateRef);
      
      if (!templateDoc.exists()) {
        throw new Error(`Template with ID ${id} not found`);
      }
      
      const updates: Record<string, any> = {
        ...template,
        updatedAt: Timestamp.now()
      };
      
      // Update variables if content was changed
      if (template.content) {
        const variableMatches = template.content.match(/\{\{([^}]+)\}\}/g) || [];
        const variables = variableMatches.map(match => match.substring(2, match.length - 2).trim());
        updates.variables = variables;
      }
      
      await updateDoc(templateRef, updates);
      
      const updatedDoc = await getDoc(templateRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as SmsTemplate;
    } catch (error) {
      console.error('Error updating SMS template:', error);
      throw error;
    }
  }
  
  /**
   * Delete SMS template
   * @param id Template ID
   * @returns Promise indicating success or failure
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(this.db, this.SMS_TEMPLATES_COLLECTION, id));
      return true;
    } catch (error) {
      console.error('Error deleting SMS template:', error);
      throw error;
    }
  }
  
  /**
   * Get SMS template by ID
   * @param id Template ID
   * @returns Promise with template or null if not found
   */
  async getTemplate(id: string): Promise<SmsTemplate | null> {
    try {
      const templateDoc = await getDoc(doc(this.db, this.SMS_TEMPLATES_COLLECTION, id));
      
      if (!templateDoc.exists()) {
        return null;
      }
      
      return {
        id: templateDoc.id,
        ...templateDoc.data()
      } as SmsTemplate;
    } catch (error) {
      console.error('Error getting SMS template:', error);
      throw error;
    }
  }
  
  /**
   * Get all SMS templates
   * @param type Optional type filter
   * @returns Promise with array of templates
   */
  async getAllTemplates(type?: SmsNotificationType): Promise<SmsTemplate[]> {
    try {
      let templatesQuery;
      
      if (type) {
        templatesQuery = query(
          collection(this.db, this.SMS_TEMPLATES_COLLECTION),
          where('type', '==', type)
        );
      } else {
        templatesQuery = query(collection(this.db, this.SMS_TEMPLATES_COLLECTION));
      }
      
      const templatesSnapshot = await getDocs(templatesQuery);
      
      return templatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SmsTemplate[];
    } catch (error) {
      console.error('Error getting all SMS templates:', error);
      throw error;
    }
  }
  
  /**
   * Configure SMS provider
   * @param config Provider configuration
   * @returns Promise with provider configuration
   */
  async configureProvider(config: Omit<SmsProviderConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<SmsProviderConfig> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to configure provider');
      }
      
      // Check if configuration for this provider already exists
      const existingConfigQuery = query(
        collection(this.db, this.SMS_PROVIDERS_COLLECTION),
        where('provider', '==', config.provider),
        where('tenantId', '==', config.tenantId || null)
      );
      
      const existingConfigSnapshot = await getDocs(existingConfigQuery);
      
      if (!existingConfigSnapshot.empty) {
        // Update existing configuration
        const existingConfig = existingConfigSnapshot.docs[0];
        await updateDoc(existingConfig.ref, {
          ...config,
          updatedAt: Timestamp.now()
        });
        
        const updatedDoc = await getDoc(existingConfig.ref);
        return {
          id: updatedDoc.id,
          ...updatedDoc.data()
        } as SmsProviderConfig;
      }
      
      // Create new configuration
      const configData = {
        ...config,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const configRef = await addDoc(collection(this.db, this.SMS_PROVIDERS_COLLECTION), configData);
      
      return {
        id: configRef.id,
        ...configData
      } as SmsProviderConfig;
    } catch (error) {
      console.error('Error configuring SMS provider:', error);
      throw error;
    }
  }
  
  /**
   * Get SMS notification details
   * @param id Notification ID
   * @returns Promise with notification details
   */
  async getSmsDetails(id: string): Promise<SmsNotification | null> {
    try {
      const smsDoc = await getDoc(doc(this.db, this.SMS_NOTIFICATIONS_COLLECTION, id));
      
      if (!smsDoc.exists()) {
        return null;
      }
      
      return {
        id: smsDoc.id,
        ...smsDoc.data()
      } as SmsNotification;
    } catch (error) {
      console.error('Error getting SMS details:', error);
      throw error;
    }
  }
  
  /**
   * Get SMS notifications for a user
   * @param userId User ID
   * @param limit Maximum number of notifications to return
   * @returns Promise with array of notifications
   */
  async getUserSmsHistory(userId: string, limit = 50): Promise<SmsNotification[]> {
    try {
      const smsQuery = query(
        collection(this.db, this.SMS_NOTIFICATIONS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      
      const smsSnapshot = await getDocs(smsQuery);
      
      return smsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SmsNotification[];
    } catch (error) {
      console.error('Error getting user SMS history:', error);
      throw error;
    }
  }
  
  /**
   * Retry failed SMS
   * @param id SMS notification ID
   * @returns Promise with updated notification
   */
  async retrySms(id: string): Promise<SmsNotification> {
    try {
      const smsDoc = await getDoc(doc(this.db, this.SMS_NOTIFICATIONS_COLLECTION, id));
      
      if (!smsDoc.exists()) {
        throw new Error(`SMS notification with ID ${id} not found`);
      }
      
      const smsData = smsDoc.data() as SmsNotification;
      
      if (smsData.status !== SmsStatus.FAILED && smsData.status !== SmsStatus.UNDELIVERED) {
        throw new Error(`Cannot retry SMS that is not in failed or undelivered state`);
      }
      
      if (smsData.retryCount >= smsData.maxRetries) {
        throw new Error(`Maximum retry attempts (${smsData.maxRetries}) reached for this SMS`);
      }
      
      // Update status and retry count
      await updateDoc(smsDoc.ref, {
        status: SmsStatus.QUEUED,
        retryCount: smsData.retryCount + 1,
        updatedAt: Timestamp.now()
      });
      
      // Deliver SMS
      return this.deliverSms(id);
    } catch (error) {
      console.error('Error retrying SMS:', error);
      throw error;
    }
  }
  
  /**
   * Cancel scheduled SMS
   * @param id SMS notification ID
   * @returns Promise indicating success or failure
   */
  async cancelScheduledSms(id: string): Promise<boolean> {
    try {
      const smsDoc = await getDoc(doc(this.db, this.SMS_NOTIFICATIONS_COLLECTION, id));
      
      if (!smsDoc.exists()) {
        throw new Error(`SMS notification with ID ${id} not found`);
      }
      
      const smsData = smsDoc.data() as SmsNotification;
      
      if (smsData.status !== SmsStatus.QUEUED) {
        throw new Error(`Cannot cancel SMS that is not in queued state`);
      }
      
      const scheduledFor = smsData.metadata?.scheduledFor;
      if (!scheduledFor) {
        throw new Error(`SMS is not scheduled for future delivery`);
      }
      
      // Delete the SMS notification
      await deleteDoc(smsDoc.ref);
      
      return true;
    } catch (error) {
      console.error('Error canceling scheduled SMS:', error);
      throw error;
    }
  }
  
  /**
   * Process template by replacing variables with values
   * @private
   */
  private processTemplate(templateContent: string, data: Record<string, any>): string {
    return templateContent.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const varName = variable.trim();
      return data[varName] !== undefined ? String(data[varName]) : match;
    });
  }
  
  /**
   * Validate phone number format
   * @private
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation - should be enhanced for production use
    // This allows formats like: +1234567890, 1234567890, (123) 456-7890
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
  
  /**
   * Get default SMS provider
   * @private
   */
  private async getDefaultProvider(): Promise<SmsProvider> {
    try {
      // Get active provider configuration
      const providersQuery = query(
        collection(this.db, this.SMS_PROVIDERS_COLLECTION),
        where('isActive', '==', true),
        limit(1)
      );
      
      const providersSnapshot = await getDocs(providersQuery);
      
      if (providersSnapshot.empty) {
        throw new Error('No active SMS provider configured');
      }
      
      const providerData = providersSnapshot.docs[0].data() as SmsProviderConfig;
      return providerData.provider;
    } catch (error) {
      console.error('Error getting default provider:', error);
      throw error;
    }
  }
  
  /**
   * Deliver SMS notification
   * @private
   */
  private async deliverSms(smsId: string): Promise<SmsNotification> {
    try {
      // Update status to SENDING
      const smsRef = doc(this.db, this.SMS_NOTIFICATIONS_COLLECTION, smsId);
      await updateDoc(smsRef, {
        status: SmsStatus.SENDING,
        updatedAt: Timestamp.now()
      });
      
      // In a real implementation, we would call a Cloud Function to handle delivery
      // For this example, we'll simulate it with a delay and always succeed
      
      // Call Cloud Function to send the SMS
      const sendSmsFunction = httpsCallable<{smsId: string}, {success: boolean; externalId?: string; error?: string}>(
        this.functions, 
        'sendSms'
      );
      
      const result = await sendSmsFunction({ smsId });
      
      if (result.data.success) {
        // Update with success
        await updateDoc(smsRef, {
          status: SmsStatus.DELIVERED,
          sentAt: Timestamp.now(),
          deliveredAt: Timestamp.now(),
          externalId: result.data.externalId,
          updatedAt: Timestamp.now()
        });
      } else {
        // Update with failure
        await updateDoc(smsRef, {
          status: SmsStatus.FAILED,
          failedAt: Timestamp.now(),
          error: result.data.error || 'Unknown error',
          updatedAt: Timestamp.now()
        });
      }
      
      // Get updated document
      const updatedDoc = await getDoc(smsRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as SmsNotification;
    } catch (error) {
      console.error('Error delivering SMS:', error);
      
      // Update with failure
      const smsRef = doc(this.db, this.SMS_NOTIFICATIONS_COLLECTION, smsId);
      await updateDoc(smsRef, {
        status: SmsStatus.FAILED,
        failedAt: Timestamp.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: Timestamp.now()
      });
      
      // Get updated document
      const updatedDoc = await getDoc(smsRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as SmsNotification;
    }
  }
  
  /**
   * Bulk send SMS notifications
   * @param recipients Array of phone numbers to send to
   * @param body SMS content
   * @param options SMS delivery options
   * @returns Promise with array of sent notifications
   */
  async bulkSendSms(
    recipients: string[],
    body: string,
    options: Partial<SmsDeliveryOptions> = {}
  ): Promise<SmsNotification[]> {
    try {
      // Validate recipients
      if (!recipients.length) {
        throw new Error('No recipients provided for bulk SMS');
      }
      
      const results: SmsNotification[] = [];
      
      // Send SMS to each recipient (could be optimized in a real implementation)
      for (const recipient of recipients) {
        try {
          const result = await this.sendSms(recipient, body, options);
          results.push(result);
        } catch (error) {
          console.error(`Error sending SMS to ${recipient}:`, error);
          
          // Continue with other recipients even if one fails
          continue;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in bulk SMS send:', error);
      throw error;
    }
  }
  
  /**
   * Bulk send templated SMS notifications
   * @param recipients Array of recipients with their template data
   * @param templateId ID of SMS template
   * @param options SMS delivery options
   * @returns Promise with array of sent notifications
   */
  async bulkSendTemplatedSms(
    recipients: Array<{ to: string; data: Record<string, any> }>,
    templateId: string,
    options: Partial<SmsDeliveryOptions> = {}
  ): Promise<SmsNotification[]> {
    try {
      // Validate recipients
      if (!recipients.length) {
        throw new Error('No recipients provided for bulk templated SMS');
      }
      
      // Get template once
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }
      
      const results: SmsNotification[] = [];
      
      // Send SMS to each recipient
      for (const { to, data } of recipients) {
        try {
          const result = await this.sendTemplatedSms(to, templateId, data, options);
          results.push(result);
        } catch (error) {
          console.error(`Error sending templated SMS to ${to}:`, error);
          
          // Continue with other recipients even if one fails
          continue;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in bulk templated SMS send:', error);
      throw error;
    }
  }
  
  /**
   * Send verification code via SMS
   * @param phoneNumber Phone number to verify
   * @param codeLength Length of verification code
   * @returns Promise with verification code
   */
  async sendVerificationCode(
    phoneNumber: string,
    codeLength = 6
  ): Promise<string> {
    try {
      // Generate verification code
      const code = this.generateVerificationCode(codeLength);
      
      // Send SMS with code
      await this.sendSms(
        phoneNumber,
        `Your verification code is: ${code}`,
        {
          validatePhoneNumber: true
        }
      );
      
      return code;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  }
  
  /**
   * Generate verification code
   * @private
   */
  private generateVerificationCode(length: number): string {
    const characters = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      const char = characters.substring(randomIndex, randomIndex + 1);
      code += char;
    }
    
    return code;
  }
}

// Export singleton instance
export const smsNotificationService = new SmsNotificationService(); 