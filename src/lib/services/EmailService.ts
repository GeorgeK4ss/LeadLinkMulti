import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';
import { 
  EmailTemplateType, 
  EmailVariable, 
  EmailTemplate, 
  emailTemplateService 
} from './EmailTemplateService';

/**
 * Email status types
 */
export enum EmailStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  SPAM = 'spam'
}

/**
 * Attachment interface for emails
 */
export interface EmailAttachment {
  filename: string;
  content?: string;
  contentType?: string;
  url?: string;
}

/**
 * Email options interface
 */
export interface EmailOptions {
  fromName?: string;
  fromEmail?: string;
  toName?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  trackOpens?: boolean;
  trackClicks?: boolean;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
  relatedTo?: {
    type: 'lead' | 'customer' | 'deal' | 'activity';
    id: string;
  };
}

/**
 * Email interface
 */
export interface Email extends FirestoreDocument {
  to: string;
  toName?: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  html: string;
  text: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  status: EmailStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date | Date[];
  clickedAt?: Date | Date[];
  clickedLinks?: {
    url: string;
    timestamp: Date;
  }[];
  bounceReason?: string;
  trackOpens: boolean;
  trackClicks: boolean;
  relatedTo?: {
    type: 'lead' | 'customer' | 'deal' | 'activity';
    id: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Email service for sending emails and managing email operations
 */
export class EmailService {
  private currentTenantId: string | null = null;
  private db: Firestore;
  private emailTemplateService: typeof emailTemplateService;
  
  constructor(tenantId?: string) {
    this.db = db;
    this.emailTemplateService = emailTemplateService;
    
    if (tenantId) {
      this.currentTenantId = tenantId;
      this.emailTemplateService.setTenantContext(tenantId);
    }
  }
  
  /**
   * Sets the current tenant context for operations
   * @param tenantId The tenant ID to set as current context
   */
  setTenantContext(tenantId: string): void {
    this.currentTenantId = tenantId;
    this.emailTemplateService.setTenantContext(tenantId);
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
   * Get emails collection path
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Collection path for emails
   */
  getEmailsCollection(tenantId?: string): any {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(this.db, 'tenants', effectiveTenantId, 'emails');
  }

  /**
   * Send an email
   * @param email Email data
   * @param tenantId Optional tenant ID override
   * @returns Promise resolving to true if successful
   */
  async sendEmail(
    email: Omit<Email, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'sentAt'>,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const userId = 'system'; // This would be dynamic in a real implementation
      
      // For now, we'll just save to Firestore and simulate sending
      const emailsCollection = this.getEmailsCollection(effectiveTenantId);
      const emailData: Omit<Email, 'id'> = {
        ...email,
        status: EmailStatus.SENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };
      
      const docRef = await addDoc(emailsCollection, emailData);
      
      // Simulate sending (would be handled by a Cloud Function in production)
      setTimeout(async () => {
        await updateDoc(doc(this.db, 'tenants', effectiveTenantId, 'emails', docRef.id), {
          status: EmailStatus.SENT,
          sentAt: new Date(),
          updatedAt: new Date()
        });
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
  
  /**
   * Send an email using a template
   * @param templateId ID of the template to use
   * @param to Recipient email address
   * @param variables Variables to replace in the template
   * @param options Additional email options
   * @param tenantId Optional tenant ID override
   * @returns Promise resolving when email is sent
   */
  async sendEmailFromTemplate(
    templateId: string,
    to: string,
    variables: EmailVariable[],
    options?: EmailOptions,
    tenantId?: string
  ): Promise<boolean> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the template
      const template = await this.emailTemplateService.getTemplate(templateId, effectiveTenantId);
      
      if (!template) {
        throw new Error(`Email template with ID ${templateId} not found`);
      }
      
      if (!template.isActive) {
        throw new Error(`Email template with ID ${templateId} is not active`);
      }
      
      // Process the template (replace variables)
      const processedTemplate = this.emailTemplateService.processTemplate(template, variables);
      
      // Prepare email data with default values
      const emailData: Omit<Email, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status' | 'sentAt'> = {
        to,
        toName: options?.toName,
        fromName: options?.fromName || 'LeadLink CRM',
        fromEmail: options?.fromEmail || 'noreply@leadlink.example.com',
        subject: processedTemplate.subject,
        html: processedTemplate.htmlContent,
        text: processedTemplate.textContent,
        templateId,
        cc: options?.cc,
        bcc: options?.bcc,
        replyTo: options?.replyTo,
        attachments: options?.attachments,
        scheduledAt: options?.scheduledAt,
        trackOpens: options?.trackOpens ?? true,
        trackClicks: options?.trackClicks ?? true,
        relatedTo: options?.relatedTo,
        metadata: options?.metadata
      };
      
      // Send the email
      return await this.sendEmail(emailData, effectiveTenantId);
    } catch (error) {
      console.error('Error sending email from template:', error);
      throw error;
    }
  }
  
  /**
   * Get email by ID
   * @param id Email ID
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the email or null if not found
   */
  async getEmail(id: string, tenantId?: string): Promise<Email | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.db, 'tenants', effectiveTenantId, 'emails', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(data as object)
      } as Email;
    } catch (error) {
      console.error(`Error getting email with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all emails for a tenant
   * @param options Query options
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with array of emails
   */
  async getEmails(
    options?: {
      status?: EmailStatus;
      relatedToType?: 'lead' | 'customer' | 'deal' | 'activity';
      relatedToId?: string;
      fromDate?: Date;
      toDate?: Date;
      sortBy?: 'createdAt' | 'updatedAt' | 'sentAt';
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    },
    tenantId?: string
  ): Promise<Email[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const constraints: QueryConstraint[] = [];
      
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }
      
      if (options?.relatedToType) {
        constraints.push(where('relatedTo.type', '==', options.relatedToType));
      }
      
      if (options?.relatedToId) {
        constraints.push(where('relatedTo.id', '==', options.relatedToId));
      }
      
      if (options?.fromDate) {
        constraints.push(where('createdAt', '>=', options.fromDate));
      }
      
      if (options?.toDate) {
        constraints.push(where('createdAt', '<=', options.toDate));
      }
      
      const sortField = options?.sortBy || 'createdAt';
      const sortDir = options?.sortDirection || 'desc';
      constraints.push(orderBy(sortField, sortDir));
      
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }
      
      const emailsCollection = this.getEmailsCollection(effectiveTenantId);
      const q = query(emailsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as object)
        } as Email;
      });
    } catch (error) {
      console.error('Error getting emails:', error);
      throw error;
    }
  }
  
  /**
   * Get scheduled emails that need to be sent
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with array of scheduled emails
   */
  async getScheduledEmails(tenantId?: string): Promise<Email[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const constraints = [
        where('status', '==', EmailStatus.SCHEDULED),
        where('scheduledAt', '<=', new Date()),
        orderBy('scheduledAt', 'asc')
      ];
      
      const emailsCollection = this.getEmailsCollection(effectiveTenantId);
      const q = query(emailsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as unknown as Email));
    } catch (error) {
      console.error('Error getting scheduled emails:', error);
      throw error;
    }
  }
  
  /**
   * Track email open event
   * @param emailId Email ID
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise resolving when tracking is complete
   */
  async trackEmailOpen(emailId: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const emailRef = doc(this.db, 'tenants', effectiveTenantId, 'emails', emailId);
      const emailDoc = await getDoc(emailRef);
      
      if (!emailDoc.exists()) {
        throw new Error(`Email with ID ${emailId} not found`);
      }
      
      const emailData = emailDoc.data();
      
      // Handle multiple opens
      let openedAt = emailData.openedAt || [];
      if (!Array.isArray(openedAt)) {
        openedAt = [openedAt];
      }
      openedAt.push(new Date());
      
      await updateDoc(emailRef, {
        status: EmailStatus.OPENED,
        openedAt,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error tracking email open for ID ${emailId}:`, error);
      throw error;
    }
  }
  
  /**
   * Track email click event
   * @param emailId Email ID
   * @param url Clicked URL
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise resolving when tracking is complete
   */
  async trackEmailClick(emailId: string, url: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const emailRef = doc(this.db, 'tenants', effectiveTenantId, 'emails', emailId);
      const emailDoc = await getDoc(emailRef);
      
      if (!emailDoc.exists()) {
        throw new Error(`Email with ID ${emailId} not found`);
      }
      
      const emailData = emailDoc.data();
      
      // Handle multiple clicks
      let clickedAt = emailData.clickedAt || [];
      if (!Array.isArray(clickedAt)) {
        clickedAt = [clickedAt];
      }
      clickedAt.push(new Date());
      
      // Handle clicked links tracking
      const clickedLinks = emailData.clickedLinks || [];
      clickedLinks.push({
        url,
        timestamp: new Date()
      });
      
      await updateDoc(emailRef, {
        status: EmailStatus.CLICKED,
        clickedAt,
        clickedLinks,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error tracking email click for ID ${emailId}:`, error);
      throw error;
    }
  }

  /**
   * Process and send scheduled emails
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the number of emails processed
   */
  async processScheduledEmails(tenantId?: string): Promise<number> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const scheduledEmails = await this.getScheduledEmails(effectiveTenantId);
      
      let processedCount = 0;
      
      for (const email of scheduledEmails) {
        // Update status to sending
        await updateDoc(doc(this.db, 'tenants', effectiveTenantId, 'emails', email.id), {
          status: EmailStatus.SENDING,
          updatedAt: new Date()
        });
        
        // Simulate sending (would be handled by a Cloud Function in production)
        setTimeout(async () => {
          await updateDoc(doc(this.db, 'tenants', effectiveTenantId, 'emails', email.id), {
            status: EmailStatus.SENT,
            sentAt: new Date(),
            updatedAt: new Date()
          });
        }, 2000);
        
        processedCount++;
      }
      
      return processedCount;
    } catch (error) {
      console.error('Error processing scheduled emails:', error);
      throw error;
    }
  }

  /**
   * Test email isolation between tenants
   * @param tenantId1 First tenant ID to test
   * @param tenantId2 Second tenant ID to test
   * @returns Promise with test results indicating success or failure
   */
  async testEmailIsolation(
    tenantId1: string,
    tenantId2: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const testSubject = `Test Email ${Date.now()}`;
      
      // Create test email in tenant 1
      await this.sendEmail({
        to: 'test@example.com',
        fromName: 'Test Sender',
        fromEmail: 'test@example.com',
        subject: testSubject,
        html: '<p>Test content</p>',
        text: 'Test content',
        trackOpens: false,
        trackClicks: false
      }, tenantId1);
      
      // Try to get the email from tenant 2
      this.setTenantContext(tenantId2);
      const tenant2Emails = await this.getEmails({}, tenantId2);
      
      // Check if tenant 2 can access tenant 1's email
      const foundInTenant2 = tenant2Emails.some(e => e.subject === testSubject);
      
      if (foundInTenant2) {
        return {
          success: false,
          message: `Isolation failed: Email created in tenant ${tenantId1} was accessible from tenant ${tenantId2}`
        };
      }
      
      return {
        success: true,
        message: `Email isolation successful: Emails are properly isolated between tenants ${tenantId1} and ${tenantId2}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing email isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Create a singleton instance
export const emailService = new EmailService();