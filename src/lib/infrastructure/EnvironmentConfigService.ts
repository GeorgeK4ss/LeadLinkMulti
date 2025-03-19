import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  updateDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from '../services/firebase/FirestoreService';

/**
 * Environment type
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing'
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig extends FirestoreDocument {
  name: Environment;
  isActive: boolean;
  apiEndpoints: {
    base: string;
    auth: string;
    data: string;
    storage: string;
    functions: string;
    analytics: string;
  };
  featureFlags: Record<string, boolean>;
  settings: Record<string, any>;
  secrets?: Record<string, string>; // Should be encrypted in a real app
  maintenanceMode: boolean;
  version: string;
  lastDeployedAt?: Timestamp;
  releaseNotes?: string;
}

/**
 * Feature flag definition
 */
export interface FeatureFlag extends FirestoreDocument {
  name: string;
  description: string;
  isEnabled: boolean;
  environments: Environment[];
  rolloutPercentage: number; // 0-100
  userGroups?: string[]; // IDs of user groups this applies to
  startDate?: Timestamp;
  endDate?: Timestamp;
  ownerEmail?: string;
}

/**
 * Environment configuration service
 */
export class EnvironmentConfigService {
  private db: Firestore;
  private currentEnvironment: Environment;
  private environmentConfig: EnvironmentConfig | null = null;
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private configListeners: Array<(config: EnvironmentConfig) => void> = [];
  private featureFlagListeners: Array<(flags: Map<string, FeatureFlag>) => void> = [];
  
  private readonly CONFIG_COLLECTION = 'environment_configs';
  private readonly FEATURE_FLAGS_COLLECTION = 'feature_flags';
  
  /**
   * Constructor
   */
  constructor() {
    this.db = db;
    
    // Determine current environment
    // In a real app, this would be based on environment variables or domain
    this.currentEnvironment = process.env.NODE_ENV === 'production' 
      ? Environment.PRODUCTION 
      : Environment.DEVELOPMENT;
      
    // Initialize by loading current environment config
    this.initialize();
  }
  
  /**
   * Initialize the service
   * @private
   */
  private async initialize(): Promise<void> {
    try {
      // Load environment config
      await this.loadEnvironmentConfig();
      
      // Load feature flags
      await this.loadFeatureFlags();
      
      // Set up real-time listeners
      this.setupConfigListener();
      this.setupFeatureFlagsListener();
    } catch (error) {
      console.error('Failed to initialize environment configuration:', error);
    }
  }
  
  /**
   * Get current environment
   */
  getCurrentEnvironment(): Environment {
    return this.currentEnvironment;
  }
  
  /**
   * Set current environment (useful for testing)
   */
  setCurrentEnvironment(environment: Environment): void {
    this.currentEnvironment = environment;
    // Reload config for new environment
    this.loadEnvironmentConfig();
    this.loadFeatureFlags();
  }
  
  /**
   * Get current environment configuration
   */
  getEnvironmentConfig(): EnvironmentConfig | null {
    return this.environmentConfig;
  }
  
  /**
   * Get API endpoint for the specified service
   * @param service API service name (base, auth, data, etc.)
   */
  getApiEndpoint(service: keyof EnvironmentConfig['apiEndpoints']): string | null {
    if (!this.environmentConfig) {
      console.warn('Environment config not loaded');
      return null;
    }
    
    return this.environmentConfig.apiEndpoints[service] || null;
  }
  
  /**
   * Get all API endpoints
   */
  getAllApiEndpoints(): EnvironmentConfig['apiEndpoints'] | null {
    if (!this.environmentConfig) {
      console.warn('Environment config not loaded');
      return null;
    }
    
    return this.environmentConfig.apiEndpoints;
  }
  
  /**
   * Get application setting
   * @param key Setting key
   * @param defaultValue Default value if setting not found
   */
  getSetting<T>(key: string, defaultValue?: T): T | null {
    if (!this.environmentConfig) {
      console.warn('Environment config not loaded');
      return defaultValue || null;
    }
    
    return (this.environmentConfig.settings[key] as T) || defaultValue || null;
  }
  
  /**
   * Get all settings
   */
  getAllSettings(): Record<string, any> | null {
    if (!this.environmentConfig) {
      console.warn('Environment config not loaded');
      return null;
    }
    
    return this.environmentConfig.settings;
  }
  
  /**
   * Check if a feature flag is enabled
   * @param flagName Feature flag name
   * @param userId Optional user ID for percentage rollouts
   */
  isFeatureEnabled(flagName: string, userId?: string): boolean {
    // If feature flag doesn't exist, default to false
    if (!this.featureFlags.has(flagName)) {
      console.warn(`Feature flag "${flagName}" not found`);
      return false;
    }
    
    const flag = this.featureFlags.get(flagName)!;
    
    // Check if flag is generally enabled
    if (!flag.isEnabled) {
      return false;
    }
    
    // Check if flag applies to current environment
    if (!flag.environments.includes(this.currentEnvironment)) {
      return false;
    }
    
    // Check date range if specified
    const now = new Date();
    if (flag.startDate && flag.startDate.toDate() > now) {
      return false;
    }
    if (flag.endDate && flag.endDate.toDate() < now) {
      return false;
    }
    
    // Check rollout percentage if user ID provided
    if (userId && flag.rolloutPercentage < 100) {
      // Simple deterministic hashing for consistent user experience
      const hash = this.hashString(`${userId}:${flagName}`);
      const userValue = hash % 100;
      
      if (userValue >= flag.rolloutPercentage) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get all feature flags
   */
  getAllFeatureFlags(): Map<string, FeatureFlag> {
    return new Map(this.featureFlags);
  }
  
  /**
   * Get feature flag details
   * @param flagName Feature flag name
   */
  getFeatureFlag(flagName: string): FeatureFlag | null {
    return this.featureFlags.get(flagName) || null;
  }
  
  /**
   * Register configuration change listener
   * @param listener Callback function
   */
  onConfigChange(listener: (config: EnvironmentConfig) => void): () => void {
    this.configListeners.push(listener);
    
    // Immediately call with current config if available
    if (this.environmentConfig) {
      listener(this.environmentConfig);
    }
    
    // Return unsubscribe function
    return () => {
      this.configListeners = this.configListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Register feature flags change listener
   * @param listener Callback function
   */
  onFeatureFlagsChange(listener: (flags: Map<string, FeatureFlag>) => void): () => void {
    this.featureFlagListeners.push(listener);
    
    // Immediately call with current flags if available
    if (this.featureFlags.size > 0) {
      listener(this.featureFlags);
    }
    
    // Return unsubscribe function
    return () => {
      this.featureFlagListeners = this.featureFlagListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Creates a default environment configuration if it doesn't exist
   * @param environment Environment to create config for
   */
  async createDefaultConfig(environment: Environment): Promise<EnvironmentConfig> {
    try {
      const configRef = doc(this.db, this.CONFIG_COLLECTION, environment);
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        console.log(`Config for environment ${environment} already exists`);
        return configDoc.data() as EnvironmentConfig;
      }
      
      const defaultConfig: Omit<EnvironmentConfig, 'id'> = {
        name: environment,
        isActive: environment === Environment.DEVELOPMENT,
        apiEndpoints: {
          base: `https://api.leadlink.${environment === Environment.PRODUCTION ? 'com' : 'dev'}`,
          auth: `/auth`,
          data: `/data`,
          storage: `/storage`,
          functions: `/functions`,
          analytics: `/analytics`
        },
        featureFlags: {
          // Default feature flags
          darkMode: true,
          advancedAnalytics: environment === Environment.PRODUCTION,
          betaFeatures: environment !== Environment.PRODUCTION
        },
        settings: {
          maxUploadSize: 10 * 1024 * 1024, // 10MB
          sessionTimeout: 60 * 60 * 1000, // 1 hour
          defaultLanguage: 'en',
          supportEmail: 'support@leadlink.com'
        },
        maintenanceMode: false,
        version: '1.0.0',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(configRef, defaultConfig);
      
      return {
        id: environment,
        ...defaultConfig
      } as EnvironmentConfig;
    } catch (error) {
      console.error('Error creating default config:', error);
      throw error;
    }
  }
  
  /**
   * Load environment configuration from Firestore
   * @private
   */
  private async loadEnvironmentConfig(): Promise<void> {
    try {
      const configRef = doc(this.db, this.CONFIG_COLLECTION, this.currentEnvironment);
      const configDoc = await getDoc(configRef);
      
      if (!configDoc.exists()) {
        console.warn(`No configuration found for environment ${this.currentEnvironment}`);
        
        // Create default config
        this.environmentConfig = await this.createDefaultConfig(this.currentEnvironment);
        return;
      }
      
      this.environmentConfig = {
        id: configDoc.id,
        ...configDoc.data()
      } as EnvironmentConfig;
      
      // Notify listeners
      this.notifyConfigListeners();
    } catch (error) {
      console.error('Error loading environment config:', error);
    }
  }
  
  /**
   * Load feature flags from Firestore
   * @private
   */
  private async loadFeatureFlags(): Promise<void> {
    try {
      const flagsQuery = query(
        collection(this.db, this.FEATURE_FLAGS_COLLECTION),
        where('environments', 'array-contains', this.currentEnvironment)
      );
      
      const flagsSnapshot = await getDocs(flagsQuery);
      
      // Clear existing flags
      this.featureFlags.clear();
      
      // Add flags from snapshot
      flagsSnapshot.forEach(doc => {
        const flag = {
          id: doc.id,
          ...doc.data()
        } as FeatureFlag;
        
        this.featureFlags.set(flag.name, flag);
      });
      
      // Notify listeners
      this.notifyFeatureFlagListeners();
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  }
  
  /**
   * Set up real-time listener for environment configuration
   * @private
   */
  private setupConfigListener(): void {
    const configRef = doc(this.db, this.CONFIG_COLLECTION, this.currentEnvironment);
    
    onSnapshot(configRef, (doc) => {
      if (!doc.exists()) {
        console.warn(`No configuration found for environment ${this.currentEnvironment}`);
        return;
      }
      
      this.environmentConfig = {
        id: doc.id,
        ...doc.data()
      } as EnvironmentConfig;
      
      // Notify listeners
      this.notifyConfigListeners();
    }, (error) => {
      console.error('Error in config real-time update:', error);
    });
  }
  
  /**
   * Set up real-time listener for feature flags
   * @private
   */
  private setupFeatureFlagsListener(): void {
    const flagsQuery = query(
      collection(this.db, this.FEATURE_FLAGS_COLLECTION),
      where('environments', 'array-contains', this.currentEnvironment)
    );
    
    onSnapshot(flagsQuery, (snapshot) => {
      // Handle added/modified flags
      snapshot.docChanges().forEach(change => {
        const flag = {
          id: change.doc.id,
          ...change.doc.data()
        } as FeatureFlag;
        
        if (change.type === 'removed') {
          this.featureFlags.delete(flag.name);
        } else {
          this.featureFlags.set(flag.name, flag);
        }
      });
      
      // Notify listeners
      this.notifyFeatureFlagListeners();
    }, (error) => {
      console.error('Error in feature flags real-time update:', error);
    });
  }
  
  /**
   * Notify all config listeners
   * @private
   */
  private notifyConfigListeners(): void {
    if (!this.environmentConfig) return;
    
    this.configListeners.forEach(listener => {
      try {
        listener(this.environmentConfig!);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });
  }
  
  /**
   * Notify all feature flag listeners
   * @private
   */
  private notifyFeatureFlagListeners(): void {
    this.featureFlagListeners.forEach(listener => {
      try {
        listener(this.featureFlags);
      } catch (error) {
        console.error('Error in feature flags change listener:', error);
      }
    });
  }
  
  /**
   * Simple string hashing function for deterministic user percentage rollouts
   * @private
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance
export const environmentConfigService = new EnvironmentConfigService(); 