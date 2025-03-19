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
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';

/**
 * Email template type
 */
export enum EmailTemplateType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  VERIFICATION = 'verification',
  LEAD_FOLLOWUP = 'lead_followup',
  MEETING_CONFIRMATION = 'meeting_confirmation',
  INVOICE = 'invoice',
  NEWSLETTER = 'newsletter',
  CUSTOM = 'custom'
}

/**
 * Interface for email variable replacements
 */
export interface EmailVariable {
  key: string;
  value: string;
}

/**
 * Interface for an email template
 */
export interface EmailTemplate extends FirestoreDocument {
  name: string;
  type: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent: string;
  isActive: boolean;
  variables: string[]; // Keys that can be replaced
  category?: string;
  tags?: string[];
}

/**
 * Service for managing email templates with multi-tenant isolation
 */
export class EmailTemplateService {
  private currentTenantId: string | null = null;
  private db: Firestore;
  
  /**
   * Creates a new EmailTemplateService instance
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
   * Get email templates collection reference
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Firestore collection reference for templates
   */
  getEmailTemplatesCollection(tenantId?: string): any {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(this.db, 'tenants', effectiveTenantId, 'emailTemplates');
  }
  
  /**
   * Create a new email template
   * @param data Template data
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the created template
   */
  async createTemplate(
    data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    userId: string,
    tenantId?: string
  ): Promise<EmailTemplate> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const templatesCollection = this.getEmailTemplatesCollection(effectiveTenantId);
      
      const templateData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };
      
      const docRef = await addDoc(templatesCollection, templateData);
      
      return {
        id: docRef.id,
        ...templateData
      } as unknown as EmailTemplate;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }
  
  /**
   * Get a template by ID
   * @param id Template ID
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the template or null if not found
   */
  async getTemplate(id: string, tenantId?: string): Promise<EmailTemplate | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getEmailTemplatesCollection(effectiveTenantId), id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EmailTemplate;
    } catch (error) {
      console.error(`Error getting template with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing template
   * @param id Template ID
   * @param updates Updates to apply
   * @param userId ID of the user making the update
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the updated template
   */
  async updateTemplate(
    id: string,
    updates: Partial<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>,
    userId: string,
    tenantId?: string
  ): Promise<EmailTemplate> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getEmailTemplatesCollection(effectiveTenantId), id);
      
      // Get the current template to ensure it exists
      const template = await this.getTemplate(id, effectiveTenantId);
      if (!template) {
        throw new Error(`Template with ID ${id} not found`);
      }
      
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      };
      
      await updateDoc(docRef, updateData);
      
      return {
        ...template,
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      } as unknown as EmailTemplate;
    } catch (error) {
      console.error(`Error updating template with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a template
   * @param id Template ID
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise resolving when delete is complete
   */
  async deleteTemplate(id: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getEmailTemplatesCollection(effectiveTenantId), id);
      
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting template with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all templates for a tenant
   * @param options Query options
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with array of templates
   */
  async getTemplates(
    options?: {
      type?: EmailTemplateType;
      category?: string;
      tags?: string[];
      activeOnly?: boolean;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    },
    tenantId?: string
  ): Promise<EmailTemplate[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const templatesCollection = this.getEmailTemplatesCollection(effectiveTenantId);
      
      const constraints: QueryConstraint[] = [];
      
      // Add query constraints based on options
      if (options?.type) {
        constraints.push(where('type', '==', options.type));
      }
      
      if (options?.category) {
        constraints.push(where('category', '==', options.category));
      }
      
      if (options?.tags && options.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', options.tags));
      }
      
      if (options?.activeOnly) {
        constraints.push(where('isActive', '==', true));
      }
      
      // Add sorting
      const sortField = options?.sortBy || 'name';
      const sortDir = options?.sortDirection || 'asc';
      constraints.push(orderBy(sortField, sortDir));
      
      // Add limit if specified
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(templatesCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EmailTemplate));
    } catch (error) {
      console.error('Error getting email templates:', error);
      throw error;
    }
  }
  
  /**
   * Set active status of a template
   * @param id Template ID
   * @param isActive New active status
   * @param userId ID of the user making the change
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the updated template
   */
  async setTemplateActive(
    id: string,
    isActive: boolean,
    userId: string,
    tenantId?: string
  ): Promise<EmailTemplate> {
    return this.updateTemplate(id, { isActive }, userId, tenantId);
  }
  
  /**
   * Clone an existing template
   * @param id ID of the template to clone
   * @param newName Name for the cloned template
   * @param userId ID of the user creating the clone
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the new template
   */
  async cloneTemplate(
    id: string,
    newName: string,
    userId: string,
    tenantId?: string
  ): Promise<EmailTemplate> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the source template
      const sourceTemplate = await this.getTemplate(id, effectiveTenantId);
      if (!sourceTemplate) {
        throw new Error(`Template with ID ${id} not found`);
      }
      
      // Create new template with source data but new name
      const { id: _, createdAt, updatedAt, createdBy, updatedBy, ...templateData } = sourceTemplate;
      
      return await this.createTemplate(
        {
          ...templateData,
          name: newName
        },
        userId,
        effectiveTenantId
      );
    } catch (error) {
      console.error(`Error cloning template with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe to template updates
   * @param callback Function to call when templates change
   * @param options Query options
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Unsubscribe function
   */
  subscribeToTemplates(
    callback: (templates: EmailTemplate[]) => void,
    options?: {
      type?: EmailTemplateType;
      category?: string;
      tags?: string[];
      activeOnly?: boolean;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    },
    tenantId?: string
  ): Unsubscribe {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    const templatesCollection = this.getEmailTemplatesCollection(effectiveTenantId);
    
    const constraints: QueryConstraint[] = [];
    
    // Add query constraints based on options
    if (options?.type) {
      constraints.push(where('type', '==', options.type));
    }
    
    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }
    
    if (options?.tags && options.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', options.tags));
    }
    
    if (options?.activeOnly) {
      constraints.push(where('isActive', '==', true));
    }
    
    // Add sorting
    const sortField = options?.sortBy || 'name';
    const sortDir = options?.sortDirection || 'asc';
    constraints.push(orderBy(sortField, sortDir));
    
    // Add limit if specified
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }
    
    const q = query(templatesCollection, ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EmailTemplate));
      
      callback(templates);
    });
  }
  
  /**
   * Process template by replacing variables
   * @param template Template to process
   * @param variables Variables to replace in the template
   * @returns Processed template with variables replaced
   */
  processTemplate(template: EmailTemplate, variables: EmailVariable[]): {
    subject: string;
    htmlContent: string;
    textContent: string;
  } {
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;
    
    variables.forEach(variable => {
      const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, 'g');
      subject = subject.replace(regex, variable.value);
      htmlContent = htmlContent.replace(regex, variable.value);
      textContent = textContent.replace(regex, variable.value);
    });
    
    // Remove any remaining template variables
    const cleanupRegex = /{{[^{}]+}}/g;
    subject = subject.replace(cleanupRegex, '');
    htmlContent = htmlContent.replace(cleanupRegex, '');
    textContent = textContent.replace(cleanupRegex, '');
    
    return {
      subject,
      htmlContent,
      textContent
    };
  }
  
  /**
   * Get default templates for a tenant
   * These are built-in templates that can be used as starting points
   * @returns Array of default templates
   */
  getDefaultTemplates(): Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>[] {
    return [
      {
        name: 'Welcome Email',
        type: EmailTemplateType.WELCOME,
        subject: 'Welcome to {{companyName}}!',
        htmlContent: `
          <h1>Welcome to {{companyName}}!</h1>
          <p>Dear {{userName}},</p>
          <p>Thank you for joining {{companyName}}. We're excited to have you on board!</p>
          <p>Here are a few things you can do to get started:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore the dashboard</li>
            <li>Check out our knowledge base</li>
          </ul>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The {{companyName}} Team</p>
        `,
        textContent: `
          Welcome to {{companyName}}!
          
          Dear {{userName}},
          
          Thank you for joining {{companyName}}. We're excited to have you on board!
          
          Here are a few things you can do to get started:
          - Complete your profile
          - Explore the dashboard
          - Check out our knowledge base
          
          If you have any questions, please don't hesitate to contact our support team.
          
          Best regards,
          The {{companyName}} Team
        `,
        isActive: true,
        variables: ['companyName', 'userName']
      },
      {
        name: 'Password Reset',
        type: EmailTemplateType.PASSWORD_RESET,
        subject: 'Reset Your {{companyName}} Password',
        htmlContent: `
          <h1>Password Reset Request</h1>
          <p>Dear {{userName}},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <p><a href="{{resetLink}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request a password reset, you can ignore this email.</p>
          <p>Best regards,<br>The {{companyName}} Team</p>
        `,
        textContent: `
          Password Reset Request
          
          Dear {{userName}},
          
          We received a request to reset your password. Please visit the following link to set a new password:
          
          {{resetLink}}
          
          This link will expire in 24 hours.
          
          If you didn't request a password reset, you can ignore this email.
          
          Best regards,
          The {{companyName}} Team
        `,
        isActive: true,
        variables: ['companyName', 'userName', 'resetLink']
      },
      {
        name: 'Lead Follow-up',
        type: EmailTemplateType.LEAD_FOLLOWUP,
        subject: 'Following up on our conversation - {{companyName}}',
        htmlContent: `
          <h1>Following Up</h1>
          <p>Dear {{leadName}},</p>
          <p>Thank you for your interest in {{companyName}}. I wanted to follow up on our conversation about {{topic}}.</p>
          <p>As discussed, here are the key points:</p>
          <ul>
            <li>{{point1}}</li>
            <li>{{point2}}</li>
            <li>{{point3}}</li>
          </ul>
          <p>Would you be available for a quick call to discuss this further? Please let me know a time that works for you.</p>
          <p>Best regards,<br>{{senderName}}<br>{{senderTitle}}<br>{{companyName}}</p>
        `,
        textContent: `
          Following Up
          
          Dear {{leadName}},
          
          Thank you for your interest in {{companyName}}. I wanted to follow up on our conversation about {{topic}}.
          
          As discussed, here are the key points:
          - {{point1}}
          - {{point2}}
          - {{point3}}
          
          Would you be available for a quick call to discuss this further? Please let me know a time that works for you.
          
          Best regards,
          {{senderName}}
          {{senderTitle}}
          {{companyName}}
        `,
        isActive: true,
        variables: ['companyName', 'leadName', 'topic', 'point1', 'point2', 'point3', 'senderName', 'senderTitle']
      }
    ];
  }
  
  /**
   * Initialize default templates for a tenant
   * @param userId User ID creating the templates
   * @param tenantId Optional tenant ID, uses current tenant context if not provided
   * @returns Promise with the created templates
   */
  async initializeDefaultTemplates(userId: string, tenantId?: string): Promise<EmailTemplate[]> {
    try {
      const effectiveTenantId = tenantId ?? this.getCurrentTenantId();
      const defaultTemplates = this.getDefaultTemplates();
      
      const createdTemplates: EmailTemplate[] = [];
      
      for (const template of defaultTemplates) {
        const created = await this.createTemplate(template, userId, effectiveTenantId);
        createdTemplates.push(created);
      }
      
      return createdTemplates;
    } catch (error) {
      console.error('Error initializing default templates:', error);
      throw error;
    }
  }
  
  /**
   * Test email template isolation between tenants
   * @param tenantId1 First tenant ID to test
   * @param tenantId2 Second tenant ID to test
   * @returns Promise with test results indicating success or failure
   */
  async testTemplateIsolation(
    tenantId1: string,
    tenantId2: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Create test template in tenant 1
      const testTemplateName = `Test Template ${Date.now()}`;
      const userId = 'system';
      
      // Create template in tenant 1
      const template1 = await this.createTemplate({
        name: testTemplateName,
        type: EmailTemplateType.CUSTOM,
        subject: 'Test Subject for Tenant 1',
        htmlContent: '<p>Test content for tenant 1</p>',
        textContent: 'Test content for tenant 1',
        isActive: true,
        variables: ['test']
      }, userId, tenantId1);
      
      // Try to get the template from tenant 2
      this.setTenantContext(tenantId2);
      const templates2 = await this.getTemplates({ activeOnly: true }, tenantId2);
      
      // Check if tenant 2 can access tenant 1's template
      const foundInTenant2 = templates2.some(t => t.name === testTemplateName);
      
      // Clean up
      await this.deleteTemplate(template1.id, tenantId1);
      
      if (foundInTenant2) {
        return {
          success: false,
          message: `Isolation failed: Template created in tenant ${tenantId1} was accessible from tenant ${tenantId2}`
        };
      }
      
      return {
        success: true,
        message: `Template isolation successful: Templates are properly isolated between tenants ${tenantId1} and ${tenantId2}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing template isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Create a singleton instance
export const emailTemplateService = new EmailTemplateService(); 