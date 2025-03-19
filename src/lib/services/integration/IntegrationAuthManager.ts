import { IntegrationAuth, IntegrationType } from '../IntegrationService';
import axios from 'axios';
import * as crypto from 'crypto';

/**
 * Result from token refresh operation
 */
export interface TokenRefreshResult {
  success: boolean;
  message: string;
  newAuth?: IntegrationAuth;
  error?: any;
}

/**
 * Integration authentication manager
 * Handles token refreshes, credential encryption/decryption,
 * and helps prepare request authentication
 */
export class IntegrationAuthManager {
  // Encryption key should be stored securely, preferably in environment variables
  private readonly encryptionKey: string = process.env.INTEGRATION_ENCRYPTION_KEY || 'integration-encryption-key';
  private readonly encryptionAlgorithm: string = 'aes-256-cbc';
  
  /**
   * Encrypts sensitive data like API keys and tokens
   * @param value The value to encrypt
   * @returns Encrypted value as a string
   */
  encryptValue(value: string): string {
    if (!value) return '';
    
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv(this.encryptionAlgorithm, key, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypts a previously encrypted value
   * @param encryptedValue The encrypted value
   * @returns Decrypted value as a string
   */
  decryptValue(encryptedValue: string): string {
    if (!encryptedValue) return '';
    
    try {
      const [ivHex, encryptedText] = encryptedValue.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv(this.encryptionAlgorithm, key, iv);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }
  
  /**
   * Secures authentication credentials by encrypting sensitive fields
   * @param auth The authentication object to secure
   * @returns Authentication object with encrypted credentials
   */
  secureCredentials(auth: IntegrationAuth): IntegrationAuth {
    const secured: IntegrationAuth = {
      ...auth,
      credentials: { ...auth.credentials }
    };
    
    if (secured.credentials) {
      // Encrypt sensitive fields based on auth type
      switch (auth.type) {
        case IntegrationType.API_KEY:
          if (secured.credentials.apiKey) {
            secured.credentials.apiKey = this.encryptValue(secured.credentials.apiKey);
          }
          break;
          
        case IntegrationType.OAUTH2:
          if (secured.credentials.clientSecret) {
            secured.credentials.clientSecret = this.encryptValue(secured.credentials.clientSecret);
          }
          if (secured.credentials.accessToken) {
            secured.credentials.accessToken = this.encryptValue(secured.credentials.accessToken);
          }
          if (secured.credentials.refreshToken) {
            secured.credentials.refreshToken = this.encryptValue(secured.credentials.refreshToken);
          }
          break;
          
        case IntegrationType.BASIC_AUTH:
          if (secured.credentials.password) {
            secured.credentials.password = this.encryptValue(secured.credentials.password);
          }
          break;
          
        case IntegrationType.CUSTOM:
          // For custom auth types, we should encrypt all credential fields
          Object.keys(secured.credentials).forEach(key => {
            const value = secured.credentials![key];
            if (typeof value === 'string' && value) {
              secured.credentials![key] = this.encryptValue(value);
            }
          });
          break;
      }
    }
    
    return secured;
  }
  
  /**
   * Restores decrypted credentials from secured authentication object
   * @param securedAuth The secured authentication object
   * @returns Authentication object with decrypted credentials
   */
  restoreCredentials(securedAuth: IntegrationAuth): IntegrationAuth {
    const restored: IntegrationAuth = {
      ...securedAuth,
      credentials: { ...securedAuth.credentials }
    };
    
    if (restored.credentials) {
      // Decrypt sensitive fields based on auth type
      switch (securedAuth.type) {
        case IntegrationType.API_KEY:
          if (restored.credentials.apiKey) {
            restored.credentials.apiKey = this.decryptValue(restored.credentials.apiKey);
          }
          break;
          
        case IntegrationType.OAUTH2:
          if (restored.credentials.clientSecret) {
            restored.credentials.clientSecret = this.decryptValue(restored.credentials.clientSecret);
          }
          if (restored.credentials.accessToken) {
            restored.credentials.accessToken = this.decryptValue(restored.credentials.accessToken);
          }
          if (restored.credentials.refreshToken) {
            restored.credentials.refreshToken = this.decryptValue(restored.credentials.refreshToken);
          }
          break;
          
        case IntegrationType.BASIC_AUTH:
          if (restored.credentials.password) {
            restored.credentials.password = this.decryptValue(restored.credentials.password);
          }
          break;
          
        case IntegrationType.CUSTOM:
          // For custom auth types, we should decrypt all credential fields
          Object.keys(restored.credentials).forEach(key => {
            const value = restored.credentials![key];
            if (typeof value === 'string' && value && value.includes(':')) {
              restored.credentials![key] = this.decryptValue(value);
            }
          });
          break;
      }
    }
    
    return restored;
  }
  
  /**
   * Refreshes OAuth2 tokens using the refresh token
   * @param auth The authentication object with encrypted credentials
   * @returns Result with success status and potentially new auth details
   */
  async refreshOAuth2Token(auth: IntegrationAuth): Promise<TokenRefreshResult> {
    if (auth.type !== IntegrationType.OAUTH2) {
      return {
        success: false,
        message: 'Not an OAuth2 integration'
      };
    }
    
    if (!auth.tokenUrl || !auth.credentials?.refreshToken) {
      return {
        success: false,
        message: 'Missing token URL or refresh token'
      };
    }
    
    try {
      // Decrypt credentials for the refresh request
      const decryptedAuth = this.restoreCredentials(auth);
      
      // Prepare token refresh request
      const data = new URLSearchParams();
      data.append('grant_type', 'refresh_token');
      data.append('refresh_token', decryptedAuth.credentials!.refreshToken || '');
      data.append('client_id', decryptedAuth.credentials!.clientId || '');
      
      // Only include client_secret if available
      if (decryptedAuth.credentials!.clientSecret) {
        data.append('client_secret', decryptedAuth.credentials!.clientSecret);
      }
      
      // Make the refresh token request
      const response = await axios.post(decryptedAuth.tokenUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (response.status !== 200) {
        return {
          success: false,
          message: `Token refresh failed: ${response.statusText}`,
          error: response.data
        };
      }
      
      // Update the auth object with new tokens
      const newAuth: IntegrationAuth = {
        ...auth,
        credentials: {
          ...auth.credentials,
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token || auth.credentials?.refreshToken,
          tokenExpiry: new Date(Date.now() + (response.data.expires_in * 1000))
        }
      };
      
      // Re-encrypt the credentials
      const securedNewAuth = this.secureCredentials(newAuth);
      
      return {
        success: true,
        message: 'Token refreshed successfully',
        newAuth: securedNewAuth
      };
    } catch (error) {
      return {
        success: false,
        message: `Token refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error
      };
    }
  }
  
  /**
   * Prepares authentication headers for API requests
   * @param auth The authentication object with decrypted credentials
   * @returns Headers object with authentication details
   */
  prepareAuthHeaders(auth: IntegrationAuth): Record<string, string> {
    const headers: Record<string, string> = {};
    
    switch (auth.type) {
      case IntegrationType.API_KEY:
        if (auth.credentials?.apiKey) {
          // Common patterns for API key auth
          headers['X-API-Key'] = auth.credentials.apiKey;
          // Some APIs use different header names
          headers['Authorization'] = `ApiKey ${auth.credentials.apiKey}`;
        }
        break;
        
      case IntegrationType.OAUTH2:
        if (auth.credentials?.accessToken) {
          headers['Authorization'] = `Bearer ${auth.credentials.accessToken}`;
        }
        break;
        
      case IntegrationType.BASIC_AUTH:
        if (auth.credentials?.username && auth.credentials?.password) {
          const basicAuth = Buffer.from(
            `${auth.credentials.username}:${auth.credentials.password}`
          ).toString('base64');
          headers['Authorization'] = `Basic ${basicAuth}`;
        }
        break;
        
      // For other types, return empty headers
      // Specialized handling would be implemented per case
    }
    
    return headers;
  }
}

// Export a singleton instance
export const integrationAuthManager = new IntegrationAuthManager(); 