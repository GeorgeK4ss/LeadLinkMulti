// Export the enhanced integration service as the default implementation
export { enhancedIntegrationService as integrationService } from './EnhancedIntegrationService';

// Export utility classes for direct access if needed
export { integrationAuthManager } from './IntegrationAuthManager';
export { integrationExecutor } from './IntegrationExecutor';
export { EnhancedIntegrationService } from './EnhancedIntegrationService';

// Re-export everything from the main IntegrationService
export * from '../IntegrationService';

// Export types from the utility modules
export type { TokenRefreshResult } from './IntegrationAuthManager';
export type { ApiRequestOptions, ApiResponse, SyncOperationResult } from './IntegrationExecutor'; 