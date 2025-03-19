import { 
  Integration, 
  IntegrationAuth, 
  IntegrationConfig, 
  IntegrationType, 
  DataMapping,
  WebhookConfig
} from '../IntegrationService';
import { integrationAuthManager } from './IntegrationAuthManager';
import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

/**
 * API request options
 */
export interface ApiRequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  data?: any;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * API response
 */
export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: Record<string, string>;
}

/**
 * Data sync operation results
 */
export interface SyncOperationResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  recordsSuccess?: number;
  recordsError?: number;
  errors?: Array<any>;
  details?: any;
}

/**
 * Integration execution service
 * Responsible for actual API calls and data transformation
 */
export class IntegrationExecutor {
  /**
   * Executes an API request
   * @param options API request options
   * @param auth Integration authentication
   * @returns Promise with API response
   */
  async executeApiRequest<T = any>(
    options: ApiRequestOptions,
    auth: IntegrationAuth
  ): Promise<ApiResponse<T>> {
    // Decrypt auth credentials for the request
    const decryptedAuth = integrationAuthManager.restoreCredentials(auth);
    
    // Get the authentication headers
    const authHeaders = integrationAuthManager.prepareAuthHeaders(decryptedAuth);
    
    // Prepare the request config
    const config: AxiosRequestConfig = {
      method: options.method as Method,
      url: options.url,
      headers: {
        ...options.headers,
        ...authHeaders
      },
      params: options.queryParams,
      data: options.data,
      timeout: options.timeout || 30000 // Default timeout of 30 seconds
    };
    
    try {
      // Execute the request with retry logic if specified
      let response: AxiosResponse;
      let attempt = 0;
      const maxAttempts = options.retryAttempts || 1;
      const retryDelay = options.retryDelay || 1000;
      
      while (attempt < maxAttempts) {
        try {
          response = await axios(config);
          // If successful, break out of retry loop
          break;
        } catch (error) {
          attempt++;
          
          // If this was the last attempt, throw the error
          if (attempt >= maxAttempts) {
            throw error;
          }
          
          // Otherwise, wait and then retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // Return formatted response
      return {
        status: response!.status,
        statusText: response!.statusText,
        data: response!.data,
        headers: response!.headers as Record<string, string>
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Return formatted error response
        return {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers as Record<string, string>
        };
      } else {
        // Non-Axios error or no response from server
        throw error;
      }
    }
  }
  
  /**
   * Transforms data according to mapping rules
   * @param sourceData Source data to transform
   * @param mappings Data mapping rules
   * @returns Transformed data
   */
  transformData(sourceData: any, mappings: DataMapping[]): any {
    // Handle arrays of objects
    if (Array.isArray(sourceData)) {
      return sourceData.map(item => this.transformData(item, mappings));
    }
    
    // Handle single object
    const result: Record<string, any> = {};
    
    for (const mapping of mappings) {
      const { sourceField, targetField, transform, defaultValue } = mapping;
      let value: any;
      
      // Get the source value (support nested paths with dot notation)
      if (sourceField.includes('.')) {
        value = sourceField.split('.').reduce((obj, key) => obj?.[key], sourceData);
      } else {
        value = sourceData?.[sourceField];
      }
      
      // Use default value if source value is undefined
      if (value === undefined && defaultValue !== undefined) {
        value = defaultValue;
      }
      
      // Skip if no value and no default
      if (value === undefined) continue;
      
      // Apply transformation if specified
      if (transform && value !== undefined) {
        switch (transform) {
          case 'uppercase':
            if (typeof value === 'string') value = value.toUpperCase();
            break;
          case 'lowercase':
            if (typeof value === 'string') value = value.toLowerCase();
            break;
          case 'trim':
            if (typeof value === 'string') value = value.trim();
            break;
          case 'capitalize':
            if (typeof value === 'string') {
              value = value.charAt(0).toUpperCase() + value.slice(1);
            }
            break;
          case 'number':
            value = Number(value);
            break;
          case 'string':
            value = String(value);
            break;
          case 'boolean':
            value = Boolean(value);
            break;
          case 'date':
            value = new Date(value);
            break;
        }
      }
      
      // Set the target value (support nested paths with dot notation)
      if (targetField.includes('.')) {
        const keys = targetField.split('.');
        const lastKey = keys.pop()!;
        let target = result;
        
        // Create nested objects if they don't exist
        for (const key of keys) {
          if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
          }
          target = target[key];
        }
        
        target[lastKey] = value;
      } else {
        result[targetField] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Executes a webhook
   * @param webhook Webhook configuration
   * @param payload Webhook payload
   * @returns Promise with API response
   */
  async executeWebhook(
    webhook: WebhookConfig,
    payload: any
  ): Promise<ApiResponse> {
    // Prepare the request options
    const options: ApiRequestOptions = {
      method: webhook.method,
      url: webhook.url,
      headers: {
        'Content-Type': webhook.format === 'xml' 
          ? 'application/xml' 
          : (webhook.format === 'form' ? 'application/x-www-form-urlencoded' : 'application/json'),
        ...webhook.headers
      },
      queryParams: webhook.queryParams,
      data: payload,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 2000
    };
    
    // If a secret is provided, add a signature header
    if (webhook.secret) {
      const signature = this.generateWebhookSignature(payload, webhook.secret);
      options.headers = {
        ...options.headers,
        'X-Webhook-Signature': signature
      };
    }
    
    // Execute the webhook request with empty auth (no auth headers needed)
    return this.executeApiRequest(options, { type: IntegrationType.CUSTOM });
  }
  
  /**
   * Generates a signature for webhook payloads
   * @param payload Webhook payload
   * @param secret Secret key for signing
   * @returns HMAC signature as hex string
   */
  private generateWebhookSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    hmac.update(data);
    return hmac.digest('hex');
  }
  
  /**
   * Synchronizes data from an external API
   * @param integration Integration configuration
   * @param syncOptions Additional sync options
   * @returns Promise with sync operation results
   */
  async syncData(
    integration: Integration,
    syncOptions?: {
      endpoint?: string;
      method?: string;
      params?: Record<string, string>;
      transformOverride?: DataMapping[];
      syncEntities?: string[];
    }
  ): Promise<SyncOperationResult> {
    try {
      // Use config from integration or override from options
      const endpoint = syncOptions?.endpoint || integration.config.endpoint;
      const method = syncOptions?.method || 'GET';
      const params = syncOptions?.params || integration.config.queryParams;
      const mappings = syncOptions?.transformOverride || integration.config.dataMapping || [];
      
      if (!endpoint) {
        return {
          success: false,
          message: 'No endpoint specified for sync operation'
        };
      }
      
      // Prepare the request options
      const options: ApiRequestOptions = {
        method,
        url: endpoint,
        queryParams: params,
        timeout: integration.config.timeout,
        retryAttempts: integration.config.retryAttempts,
        retryDelay: integration.config.retryDelay
      };
      
      // Execute the API request
      const response = await this.executeApiRequest(options, integration.auth);
      
      // Check for success
      if (response.status < 200 || response.status >= 300) {
        return {
          success: false,
          message: `API request failed: ${response.status} ${response.statusText}`,
          details: response.data
        };
      }
      
      // Transform the data if mappings are provided
      let transformedData: any;
      let recordsProcessed = 0;
      
      if (mappings && mappings.length > 0) {
        if (Array.isArray(response.data)) {
          transformedData = response.data.map(item => this.transformData(item, mappings));
          recordsProcessed = transformedData.length;
        } else if (response.data && typeof response.data === 'object') {
          // Handle response with items in a nested property (common API pattern)
          const items = response.data.items || response.data.data || response.data.results || [response.data];
          if (Array.isArray(items)) {
            transformedData = items.map(item => this.transformData(item, mappings));
            recordsProcessed = transformedData.length;
          } else {
            transformedData = this.transformData(response.data, mappings);
            recordsProcessed = 1;
          }
        } else {
          transformedData = response.data;
          recordsProcessed = 1;
        }
      } else {
        transformedData = response.data;
        if (Array.isArray(transformedData)) {
          recordsProcessed = transformedData.length;
        } else {
          recordsProcessed = 1;
        }
      }
      
      return {
        success: true,
        message: 'Data synchronization completed successfully',
        recordsProcessed,
        recordsSuccess: recordsProcessed,
        recordsError: 0,
        details: {
          transformedData
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Data synchronization failed: ${error instanceof Error ? error.message : String(error)}`,
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsError: 0,
        errors: [error]
      };
    }
  }
}

// Export a singleton instance
export const integrationExecutor = new IntegrationExecutor(); 