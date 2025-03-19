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
  Unsubscribe,
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from './firebase/FirestoreService';
import * as crypto from 'crypto';

/**
 * Integration type for external services
 */
export enum IntegrationType {
  API_KEY = 'api_key',
  OAUTH1 = 'oauth1',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  WEBHOOK = 'webhook',
  CUSTOM = 'custom'
}

/**
 * Integration status
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PENDING_AUTH = 'pending_auth',
  CONFIGURING = 'configuring'
}

/**
 * Integration category
 */
export enum IntegrationCategory {
  CRM = 'crm',
  MARKETING = 'marketing',
  EMAIL = 'email',
  CALENDAR = 'calendar',
  PAYMENT = 'payment',
  COMMUNICATION = 'communication',
  DATA_SYNC = 'data_sync',
  ANALYTICS = 'analytics',
  SOCIAL_MEDIA = 'social_media',
  PROJECT_MANAGEMENT = 'project_management',
  CUSTOM = 'custom'
}

/**
 * Data mapping for field transformations
 */
export interface DataMapping {
  sourceField: string;
  targetField: string;
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'capitalize' | 'number' | 'string' | 'boolean' | 'date';
  defaultValue?: any;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyTemplate?: string;
  format?: 'json' | 'xml' | 'form';
  secret?: string;
  events: string[];
}

/**
 * Schedule for recurring integrations
 */
export interface IntegrationSchedule {
  enabled: boolean;
  interval: 'minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  value: number; // e.g., 15 for "every 15 minutes"
  startTime?: Date;
  endTime?: Date;
  timezone?: string;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Authentication details for integrations
 */
export interface IntegrationAuth {
  type: IntegrationType;
  credentials?: {
    apiKey?: string;
    username?: string;
    password?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    scopes?: string[];
    [key: string]: any;
  };
  authUrl?: string;
  tokenUrl?: string;
  callbackUrl?: string;
  additionalParams?: Record<string, string>;
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  endpoint?: string;
  version?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimitPerMinute?: number;
  dataMapping?: DataMapping[];
  webhooks?: WebhookConfig[];
  schedule?: IntegrationSchedule;
  [key: string]: any;
}

/**
 * Sync history record
 */
export interface SyncHistory extends FirestoreDocument {
  integrationId: string;
  startTime: Date;
  endTime?: Date;
  status: 'success' | 'error' | 'partial' | 'in_progress';
  recordsProcessed?: number;
  recordsSuccess?: number;
  recordsError?: number;
  errorMessage?: string;
  details?: any;
}

/**
 * Integration entity
 */
export interface Integration extends FirestoreDocument {
  name: string;
  description?: string;
  type: IntegrationType;
  category: IntegrationCategory;
  provider: string;
  status: IntegrationStatus;
  auth: IntegrationAuth;
  config: IntegrationConfig;
  lastSyncTime?: Date;
  syncFrequency?: string;
  isSystem?: boolean;
  errorMessage?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Service for managing external integrations with multi-tenant isolation
 */
export class IntegrationService {
  private currentTenantId: string | null = null;
  private db: Firestore;
  
  /**
   * Creates a new IntegrationService
   * @param tenantId Optional tenant ID to initialize with
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
   * Get integrations collection reference
   * @param tenantId Optional tenant ID override
   * @returns Firestore collection reference
   */
  getIntegrationsCollection(tenantId?: string): any {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(this.db, 'tenants', effectiveTenantId, 'integrations');
  }
  
  /**
   * Get sync history collection reference
   * @param tenantId Optional tenant ID override
   * @returns Firestore collection reference
   */
  getSyncHistoryCollection(tenantId?: string): any {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    return collection(this.db, 'tenants', effectiveTenantId, 'integrationSyncHistory');
  }
  
  /**
   * Create a new integration
   * @param data Integration data
   * @param userId User ID creating the integration
   * @param tenantId Optional tenant ID override
   * @returns Promise with the created integration
   */
  async createIntegration(
    data: Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    userId: string,
    tenantId?: string
  ): Promise<Integration> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const integrationsCollection = this.getIntegrationsCollection(effectiveTenantId);
      
      // Secure any sensitive credentials
      const securedAuth = this.secureAuthCredentials(data.auth);
      
      const integrationData = {
        ...data,
        auth: securedAuth,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };
      
      const docRef = await addDoc(integrationsCollection, integrationData);
      
      return {
        id: docRef.id,
        ...integrationData
      } as unknown as Integration;
    } catch (error) {
      console.error('Error creating integration:', error);
      throw error;
    }
  }
  
  /**
   * Get an integration by ID
   * @param id Integration ID
   * @param tenantId Optional tenant ID override
   * @returns Promise with the integration or null if not found
   */
  async getIntegration(id: string, tenantId?: string): Promise<Integration | null> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const docRef = doc(this.getIntegrationsCollection(effectiveTenantId), id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(data as object)
      } as Integration;
    } catch (error) {
      console.error(`Error getting integration with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an integration
   * @param id Integration ID
   * @param updates Updates to apply
   * @param userId User ID making the update
   * @param tenantId Optional tenant ID override
   * @returns Promise with the updated integration
   */
  async updateIntegration(
    id: string,
    updates: Partial<Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>,
    userId: string,
    tenantId?: string
  ): Promise<Integration> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the current integration
      const integration = await this.getIntegration(id, effectiveTenantId);
      if (!integration) {
        throw new Error(`Integration with ID ${id} not found`);
      }
      
      // If auth is being updated, secure credentials
      if (updates.auth) {
        updates.auth = this.secureAuthCredentials(updates.auth);
      }
      
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      };
      
      const docRef = doc(this.getIntegrationsCollection(effectiveTenantId), id);
      await updateDoc(docRef, updateData);
      
      return {
        ...integration,
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      } as unknown as Integration;
    } catch (error) {
      console.error(`Error updating integration with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an integration
   * @param id Integration ID
   * @param tenantId Optional tenant ID override
   * @returns Promise that resolves when the delete is complete
   */
  async deleteIntegration(id: string, tenantId?: string): Promise<void> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the integration to verify it exists
      const integration = await this.getIntegration(id, effectiveTenantId);
      if (!integration) {
        throw new Error(`Integration with ID ${id} not found`);
      }
      
      // System integrations cannot be deleted
      if (integration.isSystem) {
        throw new Error(`Cannot delete system integration: ${integration.name}`);
      }
      
      // Delete the integration
      const docRef = doc(this.getIntegrationsCollection(effectiveTenantId), id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting integration with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all integrations
   * @param options Query options
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of integrations
   */
  async getIntegrations(
    options?: {
      type?: IntegrationType;
      category?: IntegrationCategory;
      status?: IntegrationStatus;
      provider?: string;
      includeSystem?: boolean;
      sortBy?: 'name' | 'provider' | 'status' | 'lastSyncTime' | 'createdAt' | 'updatedAt';
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    },
    tenantId?: string
  ): Promise<Integration[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const integrationsCollection = this.getIntegrationsCollection(effectiveTenantId);
      
      const constraints: QueryConstraint[] = [];
      
      if (options?.type) {
        constraints.push(where('type', '==', options.type));
      }
      
      if (options?.category) {
        constraints.push(where('category', '==', options.category));
      }
      
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }
      
      if (options?.provider) {
        constraints.push(where('provider', '==', options.provider));
      }
      
      if (options?.includeSystem === false) {
        constraints.push(where('isSystem', '==', false));
      }
      
      // Add sorting
      const sortField = options?.sortBy || 'name';
      const sortDir = options?.sortDirection || 'asc';
      constraints.push(orderBy(sortField, sortDir));
      
      // Add limit if specified
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(integrationsCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const integrations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as object)
        } as Integration;
      });
      
      return integrations;
    } catch (error) {
      console.error('Error getting integrations:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to integrations
   * @param callback Function to call when integrations change
   * @param options Query options
   * @param tenantId Optional tenant ID override
   * @returns Unsubscribe function
   */
  subscribeToIntegrations(
    callback: (integrations: Integration[]) => void,
    options?: {
      type?: IntegrationType;
      category?: IntegrationCategory;
      status?: IntegrationStatus;
      provider?: string;
      includeSystem?: boolean;
      sortBy?: 'name' | 'provider' | 'status' | 'lastSyncTime' | 'createdAt' | 'updatedAt';
      sortDirection?: 'asc' | 'desc';
      limit?: number;
    },
    tenantId?: string
  ): Unsubscribe {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    const integrationsCollection = this.getIntegrationsCollection(effectiveTenantId);
    
    const constraints: QueryConstraint[] = [];
    
    if (options?.type) {
      constraints.push(where('type', '==', options.type));
    }
    
    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }
    
    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    }
    
    if (options?.provider) {
      constraints.push(where('provider', '==', options.provider));
    }
    
    if (options?.includeSystem === false) {
      constraints.push(where('isSystem', '==', false));
    }
    
    // Add sorting
    const sortField = options?.sortBy || 'name';
    const sortDir = options?.sortDirection || 'asc';
    constraints.push(orderBy(sortField, sortDir));
    
    // Add limit if specified
    if (options?.limit) {
      constraints.push(limit(options.limit));
    }
    
    const q = query(integrationsCollection, ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const integrations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as object)
        } as Integration;
      });
      
      callback(integrations);
    });
  }
  
  /**
   * Record sync history
   * @param integrationId Integration ID
   * @param history Sync history data
   * @param tenantId Optional tenant ID override
   * @returns Promise with created sync history record
   */
  async recordSyncHistory(
    integrationId: string,
    history: Omit<SyncHistory, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'integrationId'>,
    userId: string,
    tenantId?: string
  ): Promise<SyncHistory> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const syncHistoryCollection = this.getSyncHistoryCollection(effectiveTenantId);
      
      const historyData = {
        ...history,
        integrationId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId
      };
      
      const docRef = await addDoc(syncHistoryCollection, historyData);
      
      // Update the integration's last sync time
      const integrationRef = doc(this.getIntegrationsCollection(effectiveTenantId), integrationId);
      await updateDoc(integrationRef, {
        lastSyncTime: new Date(),
        status: history.status === 'error' ? IntegrationStatus.ERROR : IntegrationStatus.ACTIVE,
        errorMessage: history.status === 'error' ? history.errorMessage : null,
        updatedAt: new Date(),
        updatedBy: userId
      });
      
      return {
        id: docRef.id,
        ...historyData
      } as unknown as SyncHistory;
    } catch (error) {
      console.error('Error recording sync history:', error);
      throw error;
    }
  }
  
  /**
   * Get sync history for an integration
   * @param integrationId Integration ID
   * @param options Query options
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of sync history records
   */
  async getSyncHistory(
    integrationId: string,
    options?: {
      status?: 'success' | 'error' | 'partial' | 'in_progress';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
    tenantId?: string
  ): Promise<SyncHistory[]> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      const syncHistoryCollection = this.getSyncHistoryCollection(effectiveTenantId);
      
      const constraints: QueryConstraint[] = [
        where('integrationId', '==', integrationId)
      ];
      
      if (options?.status) {
        constraints.push(where('status', '==', options.status));
      }
      
      if (options?.startDate) {
        constraints.push(where('startTime', '>=', options.startDate));
      }
      
      if (options?.endDate) {
        constraints.push(where('startTime', '<=', options.endDate));
      }
      
      // Add sorting by start time desc
      constraints.push(orderBy('startTime', 'desc'));
      
      // Add limit if specified
      if (options?.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(syncHistoryCollection, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const history = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...(data as object)
        } as SyncHistory;
      });
      
      return history;
    } catch (error) {
      console.error('Error getting sync history:', error);
      throw error;
    }
  }
  
  /**
   * Test webhook configuration
   * @param webhookConfig Webhook config to test
   * @param testPayload Test payload to send
   * @param tenantId Optional tenant ID override
   * @returns Promise with test result
   */
  async testWebhook(
    webhookConfig: WebhookConfig,
    testPayload: any,
    tenantId?: string
  ): Promise<{ success: boolean; message: string; response?: any }> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // In a real implementation, this would make an actual HTTP request
      // For now, we'll just validate the webhook config
      
      if (!webhookConfig.url) {
        return { success: false, message: 'Webhook URL is required' };
      }
      
      if (!webhookConfig.method) {
        return { success: false, message: 'Webhook method is required' };
      }
      
      if (!webhookConfig.events || webhookConfig.events.length === 0) {
        return { success: false, message: 'At least one event must be specified' };
      }
      
      // Simulate a successful webhook test
      return {
        success: true,
        message: 'Webhook test successful',
        response: {
          statusCode: 200,
          body: { status: 'ok', message: 'Webhook received' }
        }
      };
    } catch (error) {
      console.error('Error testing webhook:', error);
      return {
        success: false,
        message: `Webhook test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Test API connection
   * @param auth Authentication details to test
   * @param config Integration config to test
   * @param tenantId Optional tenant ID override
   * @returns Promise with test result
   */
  async testConnection(
    auth: IntegrationAuth,
    config: IntegrationConfig,
    tenantId?: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // In a real implementation, this would make an actual API request
      // For now, we'll just validate the auth and config
      
      if (!auth.type) {
        return { success: false, message: 'Authentication type is required' };
      }
      
      // Validate auth details based on type
      switch (auth.type) {
        case IntegrationType.API_KEY:
          if (!auth.credentials?.apiKey) {
            return { success: false, message: 'API key is required' };
          }
          break;
        case IntegrationType.OAUTH2:
          if (!auth.credentials?.accessToken) {
            return { success: false, message: 'Access token is required' };
          }
          break;
        case IntegrationType.BASIC_AUTH:
          if (!auth.credentials?.username || !auth.credentials?.password) {
            return { success: false, message: 'Username and password are required' };
          }
          break;
      }
      
      // Validate config
      if (config.endpoint && !this.isValidUrl(config.endpoint)) {
        return { success: false, message: 'Invalid endpoint URL' };
      }
      
      // Simulate a successful connection test
      return {
        success: true,
        message: 'Connection test successful',
        details: {
          apiVersion: config.version || 'v1',
          serverInfo: {
            name: 'API Server',
            version: '1.0.0'
          }
        }
      };
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Create default system integrations for a tenant
   * @param userId User ID creating the integrations
   * @param tenantId Optional tenant ID override
   * @returns Promise with array of created integrations
   */
  async createDefaultIntegrations(userId: string, tenantId?: string): Promise<Integration[]> {
    try {
      const effectiveTenantId = tenantId ?? this.getCurrentTenantId();
      const createdIntegrations: Integration[] = [];
      
      // Define default system integrations
      const defaultIntegrations = [
        {
          name: 'Email Sync',
          description: 'Synchronize email contacts and campaigns',
          type: IntegrationType.OAUTH2,
          category: IntegrationCategory.EMAIL,
          provider: 'email_provider',
          status: IntegrationStatus.CONFIGURING,
          auth: {
            type: IntegrationType.OAUTH2,
            authUrl: 'https://example.com/auth',
            tokenUrl: 'https://example.com/token',
            callbackUrl: 'https://app.leadlink.com/integrations/callback',
            credentials: {
              clientId: '',
              clientSecret: '',
              scopes: ['contacts.read', 'campaigns.read']
            }
          },
          config: {
            endpoint: 'https://api.example.com/v1',
            version: 'v1',
            dataMapping: [
              {
                sourceField: 'email',
                targetField: 'emailAddress'
              },
              {
                sourceField: 'name',
                targetField: 'fullName'
              }
            ] as DataMapping[],
            schedule: {
              enabled: false,
              interval: 'daily' as 'daily',
              value: 1
            }
          },
          isSystem: true
        },
        {
          name: 'CRM Integration',
          description: 'Synchronize leads and customers with CRM',
          type: IntegrationType.OAUTH2,
          category: IntegrationCategory.CRM,
          provider: 'crm_provider',
          status: IntegrationStatus.CONFIGURING,
          auth: {
            type: IntegrationType.OAUTH2,
            authUrl: 'https://crm.example.com/oauth/authorize',
            tokenUrl: 'https://crm.example.com/oauth/token',
            callbackUrl: 'https://app.leadlink.com/integrations/callback',
            credentials: {
              clientId: '',
              clientSecret: '',
              scopes: ['leads.read', 'leads.write', 'contacts.read', 'contacts.write']
            }
          },
          config: {
            endpoint: 'https://api.crm.example.com/v2',
            version: 'v2',
            dataMapping: [
              {
                sourceField: 'firstName',
                targetField: 'first_name'
              },
              {
                sourceField: 'lastName',
                targetField: 'last_name'
              },
              {
                sourceField: 'email',
                targetField: 'email_address'
              },
              {
                sourceField: 'phone',
                targetField: 'phone_number'
              }
            ] as DataMapping[],
            schedule: {
              enabled: false,
              interval: 'hourly' as 'hourly',
              value: 6
            }
          },
          isSystem: true
        },
        {
          name: 'Calendar Sync',
          description: 'Synchronize meetings and appointments with calendar',
          type: IntegrationType.OAUTH2,
          category: IntegrationCategory.CALENDAR,
          provider: 'calendar_provider',
          status: IntegrationStatus.CONFIGURING,
          auth: {
            type: IntegrationType.OAUTH2,
            authUrl: 'https://calendar.example.com/oauth/authorize',
            tokenUrl: 'https://calendar.example.com/oauth/token',
            callbackUrl: 'https://app.leadlink.com/integrations/callback',
            credentials: {
              clientId: '',
              clientSecret: '',
              scopes: ['calendar.read', 'calendar.write', 'events.read', 'events.write']
            }
          },
          config: {
            endpoint: 'https://api.calendar.example.com/v1',
            version: 'v1',
            dataMapping: [
              {
                sourceField: 'title',
                targetField: 'summary'
              },
              {
                sourceField: 'description',
                targetField: 'description'
              },
              {
                sourceField: 'startTime',
                targetField: 'start.dateTime',
                transform: 'date'
              },
              {
                sourceField: 'endTime',
                targetField: 'end.dateTime',
                transform: 'date'
              }
            ] as DataMapping[],
            schedule: {
              enabled: false,
              interval: 'hourly' as 'hourly',
              value: 1
            }
          },
          isSystem: true
        }
      ];
      
      // Create integrations
      for (const integrationData of defaultIntegrations) {
        try {
          const existingIntegrations = await this.getIntegrations(
            { provider: integrationData.provider, category: integrationData.category },
            effectiveTenantId
          );
          
          const exists = existingIntegrations.some(i => i.name === integrationData.name);
          
          if (!exists) {
            const integration = await this.createIntegration(
              integrationData,
              userId,
              effectiveTenantId
            );
            
            createdIntegrations.push(integration);
          }
        } catch (error) {
          console.warn(`Error creating default integration ${integrationData.name}:`, error);
          // Continue with next integration even if one fails
        }
      }
      
      return createdIntegrations;
    } catch (error) {
      console.error('Error creating default integrations:', error);
      throw error;
    }
  }
  
  /**
   * Encrypt sensitive data for storage
   * @param input String to encrypt
   * @returns Encrypted string
   */
  private encryptSensitive(input: string): string {
    // In a real application, implement proper encryption
    // This is a simple example that should not be used in production
    
    // For this example, we're just doing a simple obfuscation
    // In a real app, use a proper encryption library with a proper key management system
    return `encrypted_${input}`;
  }
  
  /**
   * Secure authentication credentials for storage
   * @param auth Authentication details to secure
   * @returns Secured authentication details
   */
  private secureAuthCredentials(auth: IntegrationAuth): IntegrationAuth {
    // Create a deep copy to avoid modifying the original
    const securedAuth = JSON.parse(JSON.stringify(auth)) as IntegrationAuth;
    
    if (securedAuth.credentials) {
      // Encrypt sensitive fields based on auth type
      switch (securedAuth.type) {
        case IntegrationType.API_KEY:
          if (securedAuth.credentials.apiKey && !securedAuth.credentials.apiKey.startsWith('encrypted_')) {
            securedAuth.credentials.apiKey = this.encryptSensitive(securedAuth.credentials.apiKey);
          }
          break;
        case IntegrationType.OAUTH2:
          if (securedAuth.credentials.clientSecret && !securedAuth.credentials.clientSecret.startsWith('encrypted_')) {
            securedAuth.credentials.clientSecret = this.encryptSensitive(securedAuth.credentials.clientSecret);
          }
          if (securedAuth.credentials.accessToken && !securedAuth.credentials.accessToken.startsWith('encrypted_')) {
            securedAuth.credentials.accessToken = this.encryptSensitive(securedAuth.credentials.accessToken);
          }
          if (securedAuth.credentials.refreshToken && !securedAuth.credentials.refreshToken.startsWith('encrypted_')) {
            securedAuth.credentials.refreshToken = this.encryptSensitive(securedAuth.credentials.refreshToken);
          }
          break;
        case IntegrationType.BASIC_AUTH:
          if (securedAuth.credentials.password && !securedAuth.credentials.password.startsWith('encrypted_')) {
            securedAuth.credentials.password = this.encryptSensitive(securedAuth.credentials.password);
          }
          break;
      }
    }
    
    return securedAuth;
  }
  
  /**
   * Check if a string is a valid URL
   * @param url URL to validate
   * @returns True if valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Test integration isolation between tenants
   * @param tenantId1 First tenant ID
   * @param tenantId2 Second tenant ID
   * @returns Promise with isolation test results
   */
  async testIntegrationIsolation(
    tenantId1: string,
    tenantId2: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Create a test integration in tenant 1
      const testIntegrationName = `Test Integration ${Date.now()}`;
      const userId = 'system';
      
      const integration1 = await this.createIntegration({
        name: testIntegrationName,
        description: 'Test integration for isolation testing',
        type: IntegrationType.API_KEY,
        category: IntegrationCategory.CUSTOM,
        provider: 'test_provider',
        status: IntegrationStatus.ACTIVE,
        auth: {
          type: IntegrationType.API_KEY,
          credentials: {
            apiKey: 'test_api_key'
          }
        },
        config: {
          endpoint: 'https://test.example.com/api'
        }
      } as Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>, userId, tenantId1);
      
      // Switch to tenant 2 and try to find the integration
      this.setTenantContext(tenantId2);
      
      const integrations2 = await this.getIntegrations(
        { provider: 'test_provider' },
        tenantId2
      );
      
      // Clean up the test integration
      const id = integration1?.id;
      if (id) {
        await this.deleteIntegration(id, tenantId1);
      }
      
      // Check if tenant 2 can see tenant 1's integration
      const foundInTenant2 = integrations2.some(i => i.name === testIntegrationName);
      
      if (foundInTenant2) {
        return {
          success: false,
          message: `Isolation failed: Integration created in tenant ${tenantId1} was accessible from tenant ${tenantId2}`
        };
      }
      
      return {
        success: true,
        message: `Integration isolation successful: Integrations are properly isolated between tenants ${tenantId1} and ${tenantId2}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Error testing integration isolation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Create a singleton instance
export const integrationService = new IntegrationService(); 