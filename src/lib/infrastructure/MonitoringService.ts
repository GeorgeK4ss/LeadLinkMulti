import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from '../services/firebase/FirestoreService';
import { Environment, environmentConfigService } from './EnvironmentConfigService';

/**
 * System health status
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  MAINTENANCE = 'maintenance',
  UNKNOWN = 'unknown'
}

/**
 * Service type
 */
export enum ServiceType {
  API = 'api',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  STORAGE = 'storage',
  FUNCTIONS = 'functions',
  MESSAGING = 'messaging',
  CACHE = 'cache',
  UI = 'ui',
  NOTIFICATIONS = 'notifications',
  SEARCH = 'search',
  ANALYTICS = 'analytics',
  PAYMENTS = 'payments'
}

/**
 * Alert severity
 */
export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Service health
 */
export interface ServiceHealth extends FirestoreDocument {
  name: string;
  type: ServiceType;
  status: HealthStatus;
  environment: Environment;
  latency?: number; // in milliseconds
  uptime?: number; // in seconds
  errors?: number;
  lastCheckedAt: Timestamp;
  lastHealthyAt?: Timestamp;
  metrics?: Record<string, number>;
  message?: string;
  version?: string;
}

/**
 * System alert
 */
export interface SystemAlert extends FirestoreDocument {
  title: string;
  message: string;
  severity: AlertSeverity;
  service?: ServiceType;
  environment: Environment;
  isActive: boolean;
  triggeredAt: Timestamp;
  resolvedAt?: Timestamp;
  acknowledgedBy?: string;
  acknowledgedAt?: Timestamp;
  metadata?: Record<string, any>;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  latency: number;
  message?: string;
  timestamp: Timestamp;
  metrics?: Record<string, number>;
}

/**
 * System status summary
 */
export interface SystemStatusSummary {
  overallStatus: HealthStatus;
  environment: Environment;
  services: ServiceHealth[];
  activeAlerts: SystemAlert[];
  lastUpdatedAt: Timestamp;
}

/**
 * Monitoring service for application health checks
 */
export class MonitoringService {
  private db: Firestore;
  private functions: ReturnType<typeof getFunctions>;
  private auth: ReturnType<typeof getAuth>;
  private currentEnvironment: Environment;
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private statusListeners: Array<(summary: SystemStatusSummary) => void> = [];
  private alertListeners: Array<(alert: SystemAlert) => void> = [];
  
  private readonly SERVICE_HEALTH_COLLECTION = 'service_health';
  private readonly SYSTEM_ALERTS_COLLECTION = 'system_alerts';
  
  /**
   * Constructor
   */
  constructor() {
    this.db = db;
    this.functions = getFunctions();
    this.auth = getAuth();
    
    // Get current environment from service
    this.currentEnvironment = environmentConfigService.getCurrentEnvironment();
  }
  
  /**
   * Initialize monitoring
   * @param services Services to monitor
   * @param checkIntervalMs Interval between health checks (in milliseconds)
   */
  async initialize(services: ServiceType[], checkIntervalMs = 60000): Promise<void> {
    try {
      // Clear any existing intervals
      this.stopAllHealthChecks();
      
      // Set up health checks for each service
      for (const service of services) {
        this.startHealthCheck(service, checkIntervalMs);
      }
      
      console.log(`Monitoring initialized for ${services.length} services`);
    } catch (error) {
      console.error('Error initializing monitoring:', error);
    }
  }
  
  /**
   * Start health check for a service
   * @param service Service type
   * @param intervalMs Interval between checks (in milliseconds)
   */
  startHealthCheck(service: ServiceType, intervalMs: number): void {
    // Stop existing check if any
    this.stopHealthCheck(service);
    
    // Initial check
    this.checkServiceHealth(service);
    
    // Set up interval
    const intervalId = setInterval(() => {
      this.checkServiceHealth(service);
    }, intervalMs);
    
    // Store interval ID
    this.healthCheckIntervals.set(service, intervalId);
  }
  
  /**
   * Stop health check for a service
   * @param service Service type
   */
  stopHealthCheck(service: ServiceType): void {
    const intervalId = this.healthCheckIntervals.get(service);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.healthCheckIntervals.delete(service);
    }
  }
  
  /**
   * Stop all health checks
   */
  stopAllHealthChecks(): void {
    for (const [service, intervalId] of this.healthCheckIntervals.entries()) {
      clearInterval(intervalId);
      this.healthCheckIntervals.delete(service);
    }
  }
  
  /**
   * Check health of a service
   * @param service Service type
   */
  async checkServiceHealth(service: ServiceType): Promise<HealthCheckResult> {
    try {
      // Start timing
      const startTime = performance.now();
      
      // Call Cloud Function to check service health
      const checkHealthFunction = httpsCallable<{service: ServiceType, environment: Environment}, {status: HealthStatus; message?: string; metrics?: Record<string, number>}>(
        this.functions, 
        'checkServiceHealth'
      );
      
      const result = await checkHealthFunction({
        service,
        environment: this.currentEnvironment
      });
      
      // Calculate latency
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      const healthResult: HealthCheckResult = {
        status: result.data.status,
        latency,
        message: result.data.message,
        timestamp: Timestamp.now(),
        metrics: result.data.metrics
      };
      
      // Update service health in Firestore
      await this.updateServiceHealth(service, healthResult);
      
      // Check if we need to create alerts
      if (healthResult.status === HealthStatus.DEGRADED || healthResult.status === HealthStatus.UNHEALTHY) {
        await this.createServiceAlert(service, healthResult);
      }
      
      return healthResult;
    } catch (error) {
      console.error(`Error checking ${service} health:`, error);
      
      // Create error result
      const errorResult: HealthCheckResult = {
        status: HealthStatus.UNKNOWN,
        latency: 0,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Timestamp.now()
      };
      
      // Update service health in Firestore
      await this.updateServiceHealth(service, errorResult);
      
      return errorResult;
    }
  }
  
  /**
   * Update service health record in Firestore
   * @param service Service type
   * @param result Health check result
   * @private
   */
  private async updateServiceHealth(service: ServiceType, result: HealthCheckResult): Promise<void> {
    try {
      // Get existing service health document
      const servicesQuery = query(
        collection(this.db, this.SERVICE_HEALTH_COLLECTION),
        where('type', '==', service),
        where('environment', '==', this.currentEnvironment),
        limit(1)
      );
      
      const servicesSnapshot = await getDocs(servicesQuery);
      
      if (servicesSnapshot.empty) {
        // Create new service health document
        const healthData: Omit<ServiceHealth, 'id'> = {
          name: this.getServiceName(service),
          type: service,
          status: result.status,
          environment: this.currentEnvironment,
          latency: result.latency,
          errors: result.status === HealthStatus.UNHEALTHY ? 1 : 0,
          lastCheckedAt: result.timestamp,
          lastHealthyAt: result.status === HealthStatus.HEALTHY ? result.timestamp : undefined,
          metrics: result.metrics,
          message: result.message,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await addDoc(collection(this.db, this.SERVICE_HEALTH_COLLECTION), healthData);
      } else {
        // Update existing service health document
        const healthDoc = servicesSnapshot.docs[0];
        const existingHealth = healthDoc.data() as ServiceHealth;
        
        const updates: Record<string, any> = {
          status: result.status,
          latency: result.latency,
          lastCheckedAt: result.timestamp,
          metrics: result.metrics,
          message: result.message,
          updatedAt: Timestamp.now()
        };
        
        // Update last healthy timestamp if service is healthy
        if (result.status === HealthStatus.HEALTHY) {
          updates.lastHealthyAt = result.timestamp;
        }
        
        // Increment error count if service is unhealthy
        if (result.status === HealthStatus.UNHEALTHY) {
          updates.errors = (existingHealth.errors || 0) + 1;
        }
        
        await updateDoc(healthDoc.ref, updates);
      }
      
      // Update system status
      await this.getSystemStatus();
    } catch (error) {
      console.error('Error updating service health:', error);
    }
  }
  
  /**
   * Create a service alert
   * @param service Service type
   * @param result Health check result
   * @private
   */
  private async createServiceAlert(service: ServiceType, result: HealthCheckResult): Promise<void> {
    try {
      // Check if there's already an active alert for this service
      const alertsQuery = query(
        collection(this.db, this.SYSTEM_ALERTS_COLLECTION),
        where('service', '==', service),
        where('environment', '==', this.currentEnvironment),
        where('isActive', '==', true),
        limit(1)
      );
      
      const alertsSnapshot = await getDocs(alertsQuery);
      
      if (!alertsSnapshot.empty) {
        // Alert already exists
        return;
      }
      
      // Create new alert
      const severity = result.status === HealthStatus.UNHEALTHY ? AlertSeverity.HIGH : AlertSeverity.MEDIUM;
      
      const alertData: Omit<SystemAlert, 'id'> = {
        title: `${this.getServiceName(service)} service ${result.status}`,
        message: result.message || `The ${this.getServiceName(service)} service is reporting a ${result.status} status.`,
        severity,
        service,
        environment: this.currentEnvironment,
        isActive: true,
        triggeredAt: result.timestamp,
        metadata: {
          latency: result.latency,
          metrics: result.metrics
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const alertRef = await addDoc(collection(this.db, this.SYSTEM_ALERTS_COLLECTION), alertData);
      
      // Get the complete alert with ID
      const alertDoc = await getDoc(alertRef);
      const alert: SystemAlert = {
        id: alertDoc.id,
        ...alertDoc.data()
      } as SystemAlert;
      
      // Notify listeners
      this.notifyAlertListeners(alert);
    } catch (error) {
      console.error('Error creating service alert:', error);
    }
  }
  
  /**
   * Get system status summary
   */
  async getSystemStatus(): Promise<SystemStatusSummary> {
    try {
      // Get all service health documents for current environment
      const servicesQuery = query(
        collection(this.db, this.SERVICE_HEALTH_COLLECTION),
        where('environment', '==', this.currentEnvironment)
      );
      
      const servicesSnapshot = await getDocs(servicesQuery);
      
      const services = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceHealth[];
      
      // Get all active alerts
      const alertsQuery = query(
        collection(this.db, this.SYSTEM_ALERTS_COLLECTION),
        where('environment', '==', this.currentEnvironment),
        where('isActive', '==', true)
      );
      
      const alertsSnapshot = await getDocs(alertsQuery);
      
      const activeAlerts = alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemAlert[];
      
      // Determine overall status
      let overallStatus = HealthStatus.HEALTHY;
      
      if (services.some(s => s.status === HealthStatus.UNHEALTHY)) {
        overallStatus = HealthStatus.UNHEALTHY;
      } else if (services.some(s => s.status === HealthStatus.DEGRADED)) {
        overallStatus = HealthStatus.DEGRADED;
      } else if (services.some(s => s.status === HealthStatus.MAINTENANCE)) {
        overallStatus = HealthStatus.MAINTENANCE;
      } else if (services.length === 0 || services.some(s => s.status === HealthStatus.UNKNOWN)) {
        overallStatus = HealthStatus.UNKNOWN;
      }
      
      const summary: SystemStatusSummary = {
        overallStatus,
        environment: this.currentEnvironment,
        services,
        activeAlerts,
        lastUpdatedAt: Timestamp.now()
      };
      
      // Notify listeners
      this.notifyStatusListeners(summary);
      
      return summary;
    } catch (error) {
      console.error('Error getting system status:', error);
      
      // Return unknown status
      const summary: SystemStatusSummary = {
        overallStatus: HealthStatus.UNKNOWN,
        environment: this.currentEnvironment,
        services: [],
        activeAlerts: [],
        lastUpdatedAt: Timestamp.now()
      };
      
      return summary;
    }
  }
  
  /**
   * Get recent alerts
   * @param maxCount Maximum number of alerts to return
   * @param activeOnly Whether to only return active alerts
   */
  async getRecentAlerts(maxCount = 10, activeOnly = false): Promise<SystemAlert[]> {
    try {
      let constraints = [
        where('environment', '==', this.currentEnvironment),
        orderBy('triggeredAt', 'desc'),
        limit(maxCount)
      ];
      
      if (activeOnly) {
        constraints = [
          where('environment', '==', this.currentEnvironment),
          where('isActive', '==', true),
          orderBy('triggeredAt', 'desc'),
          limit(maxCount)
        ];
      }
      
      const alertsQuery = query(collection(this.db, this.SYSTEM_ALERTS_COLLECTION), ...constraints);
      
      const alertsSnapshot = await getDocs(alertsQuery);
      
      return alertsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemAlert[];
    } catch (error) {
      console.error('Error getting recent alerts:', error);
      throw error;
    }
  }
  
  /**
   * Acknowledge an alert
   * @param alertId Alert ID
   */
  async acknowledgeAlert(alertId: string): Promise<SystemAlert> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        throw new Error('Authentication required to acknowledge alert');
      }
      
      const alertRef = doc(this.db, this.SYSTEM_ALERTS_COLLECTION, alertId);
      const alertDoc = await getDoc(alertRef);
      
      if (!alertDoc.exists()) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }
      
      const alert = alertDoc.data() as SystemAlert;
      
      if (!alert.isActive) {
        throw new Error('Cannot acknowledge an inactive alert');
      }
      
      await updateDoc(alertRef, {
        acknowledgedBy: currentUser.uid,
        acknowledgedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      const updatedDoc = await getDoc(alertRef);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as SystemAlert;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }
  
  /**
   * Resolve an alert
   * @param alertId Alert ID
   */
  async resolveAlert(alertId: string): Promise<SystemAlert> {
    try {
      const alertRef = doc(this.db, this.SYSTEM_ALERTS_COLLECTION, alertId);
      const alertDoc = await getDoc(alertRef);
      
      if (!alertDoc.exists()) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }
      
      const alert = alertDoc.data() as SystemAlert;
      
      if (!alert.isActive) {
        throw new Error('Alert is already resolved');
      }
      
      await updateDoc(alertRef, {
        isActive: false,
        resolvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      const updatedDoc = await getDoc(alertRef);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as SystemAlert;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }
  
  /**
   * Set maintenance mode for a service
   * @param service Service type
   * @param inMaintenance Whether service is in maintenance mode
   * @param message Optional maintenance message
   */
  async setServiceMaintenance(service: ServiceType, inMaintenance: boolean, message?: string): Promise<ServiceHealth> {
    try {
      const servicesQuery = query(
        collection(this.db, this.SERVICE_HEALTH_COLLECTION),
        where('type', '==', service),
        where('environment', '==', this.currentEnvironment),
        limit(1)
      );
      
      const servicesSnapshot = await getDocs(servicesQuery);
      
      if (servicesSnapshot.empty) {
        throw new Error(`Service ${service} not found in monitoring`);
      }
      
      const serviceDoc = servicesSnapshot.docs[0];
      
      await updateDoc(serviceDoc.ref, {
        status: inMaintenance ? HealthStatus.MAINTENANCE : HealthStatus.UNKNOWN,
        message: message || (inMaintenance ? 'Service is under maintenance' : ''),
        updatedAt: Timestamp.now()
      });
      
      // If leaving maintenance, trigger a new health check
      if (!inMaintenance) {
        setTimeout(() => {
          this.checkServiceHealth(service);
        }, 2000);
      }
      
      const updatedDoc = await getDoc(serviceDoc.ref);
      
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      } as ServiceHealth;
    } catch (error) {
      console.error('Error setting service maintenance:', error);
      throw error;
    }
  }
  
  /**
   * Register for system status updates
   * @param listener Callback function
   */
  onStatusChange(listener: (summary: SystemStatusSummary) => void): () => void {
    this.statusListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Register for new alerts
   * @param listener Callback function
   */
  onNewAlert(listener: (alert: SystemAlert) => void): () => void {
    this.alertListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.alertListeners = this.alertListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify status listeners
   * @param summary System status summary
   * @private
   */
  private notifyStatusListeners(summary: SystemStatusSummary): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(summary);
      } catch (error) {
        console.error('Error in status change listener:', error);
      }
    });
  }
  
  /**
   * Notify alert listeners
   * @param alert System alert
   * @private
   */
  private notifyAlertListeners(alert: SystemAlert): void {
    this.alertListeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('Error in alert listener:', error);
      }
    });
  }
  
  /**
   * Get human-readable service name
   * @param service Service type
   * @private
   */
  private getServiceName(service: ServiceType): string {
    const serviceNames: Record<ServiceType, string> = {
      [ServiceType.API]: 'API',
      [ServiceType.DATABASE]: 'Database',
      [ServiceType.AUTHENTICATION]: 'Authentication',
      [ServiceType.STORAGE]: 'Storage',
      [ServiceType.FUNCTIONS]: 'Cloud Functions',
      [ServiceType.MESSAGING]: 'Messaging',
      [ServiceType.CACHE]: 'Cache',
      [ServiceType.UI]: 'User Interface',
      [ServiceType.NOTIFICATIONS]: 'Notifications',
      [ServiceType.SEARCH]: 'Search',
      [ServiceType.ANALYTICS]: 'Analytics',
      [ServiceType.PAYMENTS]: 'Payments'
    };
    
    return serviceNames[service] || service;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService(); 