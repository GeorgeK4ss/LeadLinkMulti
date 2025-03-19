/**
 * This file demonstrates how to use the Integration Service
 * All examples are for illustration purposes only
 */

import { 
  integrationService,
  IntegrationType,
  IntegrationCategory,
  IntegrationStatus
} from '../index';

/**
 * Example showing how to create a new API integration
 */
async function createApiIntegration(tenantId: string, userId: string) {
  try {
    // Set tenant context first to ensure proper isolation
    integrationService.setTenantContext(tenantId);
    
    const integration = await integrationService.createIntegration(
      {
        name: 'Example CRM API',
        description: 'Integration with our CRM system',
        type: IntegrationType.API_KEY,
        category: IntegrationCategory.CRM,
        provider: 'example-crm',
        status: IntegrationStatus.CONFIGURING,
        auth: {
          type: IntegrationType.API_KEY,
          credentials: {
            apiKey: 'YOUR_API_KEY_HERE', // This will be encrypted automatically
          }
        },
        config: {
          endpoint: 'https://api.example-crm.com/v1',
          version: 'v1',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000,
          dataMapping: [
            {
              sourceField: 'customer.email',
              targetField: 'emailAddress',
              transform: 'lowercase'
            },
            {
              sourceField: 'customer.name',
              targetField: 'fullName'
            },
            {
              sourceField: 'customer.company',
              targetField: 'companyName'
            }
          ]
        }
      },
      userId
    );
    
    console.log('Created integration:', integration.id);
    return integration;
  } catch (error) {
    console.error('Error creating integration:', error);
    throw error;
  }
}

/**
 * Example showing how to create an OAuth2 integration
 */
async function createOAuth2Integration(tenantId: string, userId: string) {
  try {
    integrationService.setTenantContext(tenantId);
    
    const integration = await integrationService.createIntegration(
      {
        name: 'Gmail Integration',
        description: 'Integrate with Gmail for email syncing',
        type: IntegrationType.OAUTH2,
        category: IntegrationCategory.EMAIL,
        provider: 'google',
        status: IntegrationStatus.PENDING_AUTH,
        auth: {
          type: IntegrationType.OAUTH2,
          authUrl: 'https://accounts.google.com/o/oauth2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          callbackUrl: 'https://app.leadlink.com/integrations/callback',
          credentials: {
            clientId: 'YOUR_CLIENT_ID',
            clientSecret: 'YOUR_CLIENT_SECRET', // This will be encrypted
            scopes: ['https://www.googleapis.com/auth/gmail.readonly']
          }
        },
        config: {
          endpoint: 'https://gmail.googleapis.com/gmail/v1',
          version: 'v1',
          dataMapping: [
            {
              sourceField: 'messages.id',
              targetField: 'messageId'
            },
            {
              sourceField: 'messages.snippet',
              targetField: 'preview'
            }
          ]
        }
      },
      userId
    );
    
    console.log('Created OAuth2 integration:', integration.id);
    return integration;
  } catch (error) {
    console.error('Error creating OAuth2 integration:', error);
    throw error;
  }
}

/**
 * Example showing how to update an integration's status
 */
async function activateIntegration(integrationId: string, tenantId: string, userId: string) {
  try {
    integrationService.setTenantContext(tenantId);
    
    const integration = await integrationService.updateIntegration(
      integrationId,
      {
        status: IntegrationStatus.ACTIVE,
        errorMessage: undefined
      },
      userId
    );
    
    console.log('Activated integration:', integration.id);
    return integration;
  } catch (error) {
    console.error('Error activating integration:', error);
    throw error;
  }
}

/**
 * Example showing how to execute an API request
 */
async function fetchCustomersFromCrm(integrationId: string, tenantId: string) {
  try {
    integrationService.setTenantContext(tenantId);
    
    const data = await integrationService.executeApiRequest(
      integrationId,
      {
        endpoint: 'https://api.example-crm.com/v1/customers',
        method: 'GET',
        queryParams: {
          limit: '100',
          status: 'active'
        }
      }
    );
    
    console.log(`Fetched ${data.length} customers from CRM`);
    return data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

/**
 * Example showing how to run data synchronization
 */
async function syncCustomerData(integrationId: string, tenantId: string, userId: string) {
  try {
    integrationService.setTenantContext(tenantId);
    
    const result = await integrationService.runSync(
      integrationId,
      userId,
      {
        endpoint: 'https://api.example-crm.com/v1/customers',
        method: 'GET',
        params: {
          updatedSince: new Date(Date.now() - 86400000).toISOString() // Last 24 hours
        }
      }
    );
    
    if (result.success) {
      console.log(`Sync completed successfully! Processed ${result.recordsProcessed} records.`);
    } else {
      console.error('Sync failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error running sync:', error);
    throw error;
  }
}

/**
 * Example showing how to refresh OAuth2 tokens
 */
async function refreshTokens(integrationId: string, tenantId: string, userId: string) {
  try {
    integrationService.setTenantContext(tenantId);
    
    const result = await integrationService.refreshOAuth2Token(
      integrationId,
      userId
    );
    
    if (result.success) {
      console.log('Token refreshed successfully!');
    } else {
      console.error('Token refresh failed:', result.message);
    }
    
    return result;
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    throw error;
  }
}

// Export the examples
export {
  createApiIntegration,
  createOAuth2Integration,
  activateIntegration,
  fetchCustomersFromCrm,
  syncCustomerData,
  refreshTokens
}; 