import { 
  Integration, 
  IntegrationService, 
  IntegrationAuth,
  IntegrationConfig,
  IntegrationCategory,
  IntegrationType,
  IntegrationStatus,
  SyncHistory
} from '../IntegrationService';
import { integrationAuthManager } from './IntegrationAuthManager';
import { integrationExecutor, SyncOperationResult } from './IntegrationExecutor';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enhanced integration service with execution capabilities
 * Extends the base IntegrationService with methods to actually
 * execute API calls and handle data synchronization
 */
export class EnhancedIntegrationService extends IntegrationService {
  /**
   * Creates an instance of EnhancedIntegrationService
   * @param tenantId Optional tenant ID to initialize with
   */
  constructor(tenantId?: string) {
    super(tenantId);
  }
  
  /**
   * Creates a new integration with secure credentials
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
    // Secure the credentials before storing
    const secureData = {
      ...data,
      auth: integrationAuthManager.secureCredentials(data.auth)
    };
    
    // Use the parent class to create the integration
    return super.createIntegration(secureData, userId, tenantId);
  }
  
  /**
   * Updates an integration with secure credentials
   * @param id Integration ID
   * @param updates Integration updates
   * @param userId User ID updating the integration
   * @param tenantId Optional tenant ID override
   * @returns Promise with the updated integration
   */
  async updateIntegration(
    id: string,
    updates: Partial<Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>,
    userId: string,
    tenantId?: string
  ): Promise<Integration> {
    // If auth is being updated, secure the credentials
    if (updates.auth) {
      updates = {
        ...updates,
        auth: integrationAuthManager.secureCredentials(updates.auth)
      };
    }
    
    // Use the parent class to update the integration
    return super.updateIntegration(id, updates, userId, tenantId);
  }
  
  /**
   * Runs a data synchronization for an integration
   * @param integrationId Integration ID
   * @param userId User ID running the sync
   * @param syncOptions Additional sync options
   * @param tenantId Optional tenant ID override
   * @returns Promise with sync operation results
   */
  async runSync(
    integrationId: string,
    userId: string,
    syncOptions?: {
      endpoint?: string;
      method?: string;
      params?: Record<string, string>;
      transformOverride?: any[];
      syncEntities?: string[];
    },
    tenantId?: string
  ): Promise<SyncOperationResult> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the integration
      const integration = await this.getIntegration(integrationId, effectiveTenantId);
      if (!integration) {
        return {
          success: false,
          message: `Integration with ID ${integrationId} not found`
        };
      }
      
      // Check if the integration is active
      if (integration.status !== IntegrationStatus.ACTIVE) {
        return {
          success: false,
          message: `Integration is not active (status: ${integration.status})`
        };
      }
      
      // Start sync history entry
      const syncHistory: Omit<SyncHistory, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'integrationId'> = {
        startTime: new Date(),
        status: 'in_progress'
      };
      
      const syncHistoryRecord = await this.recordSyncHistory(
        integrationId,
        syncHistory,
        userId,
        effectiveTenantId
      );
      
      // Run the sync operation
      const result = await integrationExecutor.syncData(integration, syncOptions);
      
      // Update the sync history with results
      const updatedSyncHistory: Partial<SyncHistory> = {
        endTime: new Date(),
        status: result.success ? 'success' : 'error',
        recordsProcessed: result.recordsProcessed,
        recordsSuccess: result.recordsSuccess,
        recordsError: result.recordsError,
        errorMessage: result.success ? undefined : result.message,
        details: result.details
      };
      
      // Update the integration record
      await this.updateIntegration(
        integrationId,
        {
          lastSyncTime: new Date(),
          status: result.success ? IntegrationStatus.ACTIVE : IntegrationStatus.ERROR,
          errorMessage: result.success ? undefined : result.message
        },
        userId,
        effectiveTenantId
      );
      
      // Update the sync history record
      await this.updateSyncHistory(
        syncHistoryRecord.id!,
        updatedSyncHistory,
        userId,
        effectiveTenantId
      );
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Sync operation failed: ${error instanceof Error ? error.message : String(error)}`,
        errors: [error]
      };
    }
  }
  
  /**
   * Updates a sync history record
   * @param id Sync history ID
   * @param updates Update data
   * @param userId User ID making the update
   * @param tenantId Optional tenant ID override
   */
  private async updateSyncHistory(
    id: string,
    updates: Partial<SyncHistory>,
    userId: string,
    tenantId?: string
  ): Promise<void> {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    const syncHistoryCollection = this.getSyncHistoryCollection(effectiveTenantId);
    
    const now = new Date();
    await syncHistoryCollection.doc(id).update({
      ...updates,
      updatedAt: now,
      updatedBy: userId
    });
  }
  
  /**
   * Tests an integration connection with given auth and config
   * @param auth Authentication details
   * @param config Integration configuration
   * @param tenantId Optional tenant ID override
   * @returns Promise with test result
   */
  async testConnection(
    auth: IntegrationAuth,
    config: IntegrationConfig,
    tenantId?: string
  ): Promise<{ success: boolean; message: string; details?: any }> {
    // Delegate to the parent's test connection method
    return super.testConnection(auth, config, tenantId);
  }
  
  /**
   * Execute a single API request using an integration
   * @param integrationId Integration ID to use
   * @param options Request options
   * @param tenantId Optional tenant ID override
   * @returns Promise with API response
   */
  async executeApiRequest(
    integrationId: string,
    options: {
      endpoint?: string;
      method?: string;
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
      data?: any;
    },
    tenantId?: string
  ): Promise<any> {
    const effectiveTenantId = tenantId || this.getCurrentTenantId();
    
    // Get the integration
    const integration = await this.getIntegration(integrationId, effectiveTenantId);
    if (!integration) {
      throw new Error(`Integration with ID ${integrationId} not found`);
    }
    
    // Check if the integration is active
    if (integration.status !== IntegrationStatus.ACTIVE) {
      throw new Error(`Integration is not active (status: ${integration.status})`);
    }
    
    // Prepare the request options
    const requestOptions = {
      method: options.method || 'GET',
      url: options.endpoint || integration.config.endpoint || '',
      headers: options.headers,
      queryParams: options.queryParams || integration.config.queryParams,
      data: options.data,
      timeout: integration.config.timeout,
      retryAttempts: integration.config.retryAttempts,
      retryDelay: integration.config.retryDelay
    };
    
    if (!requestOptions.url) {
      throw new Error('No endpoint specified for API request');
    }
    
    // Execute the API request
    const response = await integrationExecutor.executeApiRequest(
      requestOptions,
      integration.auth
    );
    
    // Check for success
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.data;
  }
  
  /**
   * Refreshes OAuth2 tokens for an integration
   * @param integrationId Integration ID
   * @param userId User ID running the refresh
   * @param tenantId Optional tenant ID override
   * @returns Promise with refresh result
   */
  async refreshOAuth2Token(
    integrationId: string,
    userId: string,
    tenantId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const effectiveTenantId = tenantId || this.getCurrentTenantId();
      
      // Get the integration
      const integration = await this.getIntegration(integrationId, effectiveTenantId);
      if (!integration) {
        return {
          success: false,
          message: `Integration with ID ${integrationId} not found`
        };
      }
      
      // Check if the integration is OAuth2
      if (integration.auth.type !== IntegrationType.OAUTH2) {
        return {
          success: false,
          message: 'Integration is not using OAuth2 authentication'
        };
      }
      
      // Refresh the token
      const result = await integrationAuthManager.refreshOAuth2Token(integration.auth);
      
      // If successful, update the integration
      if (result.success && result.newAuth) {
        await this.updateIntegration(
          integrationId,
          {
            auth: result.newAuth,
            status: IntegrationStatus.ACTIVE,
            errorMessage: undefined
          },
          userId,
          effectiveTenantId
        );
      } else {
        // If failed, update the status
        await this.updateIntegration(
          integrationId,
          {
            status: IntegrationStatus.ERROR,
            errorMessage: result.message
          },
          userId,
          effectiveTenantId
        );
      }
      
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Export singleton instance
export const enhancedIntegrationService = new EnhancedIntegrationService(); 