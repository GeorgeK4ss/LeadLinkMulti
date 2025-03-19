import { 
  Firestore, 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  updateDoc,
  QueryConstraint,
  DocumentReference
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { FirestoreDocument } from '../services/firebase/FirestoreService';
import { Environment, environmentConfigService } from './EnvironmentConfigService';

/**
 * Log level
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Error severity
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Log entry
 */
export interface LogEntry extends FirestoreDocument {
  message: string;
  level: LogLevel;
  timestamp: Timestamp;
  environment: Environment;
  service?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Error report
 */
export interface ErrorReport extends FirestoreDocument {
  message: string;
  stack?: string;
  type: string;
  severity: ErrorSeverity;
  timestamp: Timestamp;
  environment: Environment;
  service?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  status: ErrorStatus;
  firstOccurrence: Timestamp;
  lastOccurrence: Timestamp;
  occurrenceCount: number;
  affectedUsers: string[];
  assignedTo?: string;
  resolvedAt?: Timestamp;
  resolution?: string;
}

/**
 * Error status
 */
export enum ErrorStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
  DEFERRED = 'deferred'
}

/**
 * Error occurrence
 */
export interface ErrorOccurrence extends FirestoreDocument {
  errorId: string;
  timestamp: Timestamp;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

/**
 * Performance metric
 */
export interface PerformanceMetric extends FirestoreDocument {
  name: string;
  value: number;
  unit: string;
  timestamp: Timestamp;
  environment: Environment;
  service?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

/**
 * Log filtering options
 */
export interface LogFilterOptions {
  level?: LogLevel | LogLevel[];
  environment?: Environment;
  service?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  startTime?: Date;
  endTime?: Date;
  tags?: string[];
  limit?: number;
}

/**
 * Error filtering options
 */
export interface ErrorFilterOptions {
  severity?: ErrorSeverity | ErrorSeverity[];
  environment?: Environment;
  service?: string;
  component?: string;
  status?: ErrorStatus | ErrorStatus[];
  startTime?: Date;
  endTime?: Date;
  tags?: string[];
  limit?: number;
}

/**
 * Logging and error tracking service
 */
export class LoggingService {
  private db: Firestore;
  private functions: ReturnType<typeof getFunctions>;
  private auth: ReturnType<typeof getAuth>;
  private currentEnvironment: Environment;
  private batchedLogs: LogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private errorCallback: ((error: ErrorReport) => void) | null = null;
  
  private readonly LOGS_COLLECTION = 'logs';
  private readonly ERRORS_COLLECTION = 'errors';
  private readonly ERROR_OCCURRENCES_COLLECTION = 'error_occurrences';
  private readonly METRICS_COLLECTION = 'performance_metrics';
  private readonly BATCH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_BATCH_SIZE = 100;
  
  constructor() {
    this.db = db;
    this.functions = getFunctions();
    this.auth = getAuth();
    this.currentEnvironment = environmentConfigService.getCurrentEnvironment();
    
    // Set up error handling for uncaught exceptions
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleUncaughtError.bind(this));
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    }
  }
  
  /**
   * Log a message
   * @param message Message to log
   * @param level Log level
   * @param metadata Additional metadata
   */
  log(
    message: string, 
    level: LogLevel = LogLevel.INFO,
    metadata: {
      service?: string;
      component?: string;
      requestId?: string;
      tags?: string[];
      data?: Record<string, any>;
    } = {}
  ): void {
    try {
      const timestamp = Timestamp.now();
      
      // Get current user and session if available
      const userId = this.auth.currentUser?.uid;
      const sessionId = this.getSessionId();
      
      const logEntry: Omit<LogEntry, 'id'> = {
        message,
        level,
        timestamp,
        environment: this.currentEnvironment,
        service: metadata.service,
        component: metadata.component,
        userId,
        sessionId,
        requestId: metadata.requestId,
        metadata: metadata.data,
        tags: metadata.tags,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      // Add to batch
      this.addToBatch(logEntry);
      
      // Log to console as well in non-production environments
      if (this.currentEnvironment !== Environment.PRODUCTION) {
        this.logToConsole(message, level, metadata);
      }
    } catch (error) {
      // Fallback to console logging if anything goes wrong
      console.error('Error logging message:', error);
      console.log(message);
    }
  }
  
  /**
   * Log debug message
   */
  debug(message: string, metadata?: any): void {
    this.log(message, LogLevel.DEBUG, metadata);
  }
  
  /**
   * Log info message
   */
  info(message: string, metadata?: any): void {
    this.log(message, LogLevel.INFO, metadata);
  }
  
  /**
   * Log warning message
   */
  warn(message: string, metadata?: any): void {
    this.log(message, LogLevel.WARN, metadata);
  }
  
  /**
   * Log error message
   */
  error(message: string, metadata?: any): void {
    this.log(message, LogLevel.ERROR, metadata);
  }
  
  /**
   * Log fatal error message
   */
  fatal(message: string, metadata?: any): void {
    this.log(message, LogLevel.FATAL, metadata);
  }
  
  /**
   * Report an error
   * @param error Error object or message
   * @param metadata Additional metadata
   */
  async reportError(
    error: Error | string,
    metadata: {
      severity?: ErrorSeverity;
      service?: string;
      component?: string;
      requestId?: string;
      url?: string;
      tags?: string[];
      data?: Record<string, any>;
    } = {}
  ): Promise<ErrorReport> {
    try {
      const timestamp = Timestamp.now();
      
      // Extract error details
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'string' ? undefined : error.stack;
      const errorType = typeof error === 'string' ? 'string' : error.constructor.name;
      
      // Get current user and session if available
      const userId = this.auth.currentUser?.uid;
      const sessionId = this.getSessionId();
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
      
      // Determine severity (default to MEDIUM)
      const severity = metadata.severity || ErrorSeverity.MEDIUM;
      
      // Check if similar error already exists
      const existingError = await this.findSimilarError(errorMessage, this.currentEnvironment);
      
      if (existingError) {
        // Update existing error
        const errorRef = doc(this.db, this.ERRORS_COLLECTION, existingError.id);
        
        // Update occurrence count and last occurrence
        const updates: Record<string, any> = {
          lastOccurrence: timestamp,
          occurrenceCount: existingError.occurrenceCount + 1,
          updatedAt: timestamp
        };
        
        // Add user to affected users if not already included
        if (userId && !existingError.affectedUsers.includes(userId)) {
          updates.affectedUsers = [...existingError.affectedUsers, userId];
        }
        
        // Add occurrence record
        await addDoc(collection(this.db, this.ERROR_OCCURRENCES_COLLECTION), {
          errorId: existingError.id,
          timestamp,
          userId,
          sessionId,
          metadata: metadata.data,
          stack: errorStack,
          createdAt: timestamp,
          updatedAt: timestamp
        });
        
        // Update error record
        await updateDoc(errorRef, updates);
        
        // Get updated error
        const updatedErrorDoc = await getDoc(errorRef);
        const updatedError = {
          id: updatedErrorDoc.id,
          ...updatedErrorDoc.data()
        } as ErrorReport;
        
        // Notify error callback if registered
        if (this.errorCallback) {
          this.errorCallback(updatedError);
        }
        
        return updatedError;
      } else {
        // Create new error
        const errorData: Omit<ErrorReport, 'id'> = {
          message: errorMessage,
          stack: errorStack,
          type: errorType,
          severity,
          timestamp,
          environment: this.currentEnvironment,
          service: metadata.service,
          component: metadata.component,
          userId,
          sessionId,
          requestId: metadata.requestId,
          url: metadata.url || (typeof window !== 'undefined' ? window.location.href : undefined),
          userAgent,
          metadata: metadata.data,
          tags: metadata.tags,
          status: ErrorStatus.OPEN,
          firstOccurrence: timestamp,
          lastOccurrence: timestamp,
          occurrenceCount: 1,
          affectedUsers: userId ? [userId] : [],
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        // Add to Firestore
        const errorRef = await addDoc(collection(this.db, this.ERRORS_COLLECTION), errorData);
        
        // Add occurrence record
        await addDoc(collection(this.db, this.ERROR_OCCURRENCES_COLLECTION), {
          errorId: errorRef.id,
          timestamp,
          userId,
          sessionId,
          metadata: metadata.data,
          stack: errorStack,
          createdAt: timestamp,
          updatedAt: timestamp
        });
        
        const newError = {
          id: errorRef.id,
          ...errorData
        } as ErrorReport;
        
        // Notify error callback if registered
        if (this.errorCallback) {
          this.errorCallback(newError);
        }
        
        return newError;
      }
    } catch (reportError) {
      // Fallback to console logging if anything goes wrong
      console.error('Error reporting error:', reportError);
      console.error(error);
      
      // Return a minimal error report
      return {
        id: 'local-error',
        message: typeof error === 'string' ? error : error.message,
        type: typeof error === 'string' ? 'string' : error.constructor.name,
        severity: ErrorSeverity.MEDIUM,
        timestamp: Timestamp.now(),
        environment: this.currentEnvironment,
        status: ErrorStatus.OPEN,
        firstOccurrence: Timestamp.now(),
        lastOccurrence: Timestamp.now(),
        occurrenceCount: 1,
        affectedUsers: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    }
  }
  
  /**
   * Record a performance metric
   * @param name Metric name
   * @param value Metric value
   * @param unit Metric unit
   * @param metadata Additional metadata
   */
  async recordMetric(
    name: string,
    value: number,
    unit: string,
    metadata: {
      service?: string;
      component?: string;
      requestId?: string;
      tags?: string[];
      data?: Record<string, any>;
    } = {}
  ): Promise<PerformanceMetric> {
    try {
      const timestamp = Timestamp.now();
      
      // Get current user and session if available
      const userId = this.auth.currentUser?.uid;
      const sessionId = this.getSessionId();
      
      const metricData: Omit<PerformanceMetric, 'id'> = {
        name,
        value,
        unit,
        timestamp,
        environment: this.currentEnvironment,
        service: metadata.service,
        component: metadata.component,
        userId,
        sessionId,
        requestId: metadata.requestId,
        metadata: metadata.data,
        tags: metadata.tags,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      // Add to Firestore
      const metricRef = await addDoc(collection(this.db, this.METRICS_COLLECTION), metricData);
      
      return {
        id: metricRef.id,
        ...metricData
      };
    } catch (error) {
      // Fallback to console logging if anything goes wrong
      console.error('Error recording metric:', error);
      
      // Return a minimal metric
      return {
        id: 'local-metric',
        name,
        value,
        unit,
        timestamp: Timestamp.now(),
        environment: this.currentEnvironment,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
    }
  }
  
  /**
   * Register a callback for new errors
   * @param callback Callback function
   */
  onError(callback: (error: ErrorReport) => void): void {
    this.errorCallback = callback;
  }
  
  /**
   * Get recent logs
   * @param options Filter options
   */
  async getLogs(options: LogFilterOptions = {}): Promise<LogEntry[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Apply filters
      if (options.level) {
        if (Array.isArray(options.level)) {
          constraints.push(where('level', 'in', options.level));
        } else {
          constraints.push(where('level', '==', options.level));
        }
      }
      
      if (options.environment) {
        constraints.push(where('environment', '==', options.environment));
      } else {
        constraints.push(where('environment', '==', this.currentEnvironment));
      }
      
      if (options.service) {
        constraints.push(where('service', '==', options.service));
      }
      
      if (options.component) {
        constraints.push(where('component', '==', options.component));
      }
      
      if (options.userId) {
        constraints.push(where('userId', '==', options.userId));
      }
      
      if (options.sessionId) {
        constraints.push(where('sessionId', '==', options.sessionId));
      }
      
      if (options.requestId) {
        constraints.push(where('requestId', '==', options.requestId));
      }
      
      if (options.startTime) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(options.startTime)));
      }
      
      if (options.endTime) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(options.endTime)));
      }
      
      // Always order by timestamp descending
      constraints.push(orderBy('timestamp', 'desc'));
      
      // Apply limit
      constraints.push(limit(options.limit || 100));
      
      const logsQuery = query(
        collection(this.db, this.LOGS_COLLECTION), 
        ...constraints
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      
      const logs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[];
      
      // Filter by tags if specified (needs client-side filtering)
      if (options.tags && options.tags.length > 0) {
        return logs.filter(log => {
          if (!log.tags) return false;
          return options.tags!.some(tag => log.tags!.includes(tag));
        });
      }
      
      return logs;
    } catch (error) {
      console.error('Error getting logs:', error);
      throw error;
    }
  }
  
  /**
   * Get recent errors
   * @param options Filter options
   */
  async getErrors(options: ErrorFilterOptions = {}): Promise<ErrorReport[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Apply filters
      if (options.severity) {
        if (Array.isArray(options.severity)) {
          constraints.push(where('severity', 'in', options.severity));
        } else {
          constraints.push(where('severity', '==', options.severity));
        }
      }
      
      if (options.environment) {
        constraints.push(where('environment', '==', options.environment));
      } else {
        constraints.push(where('environment', '==', this.currentEnvironment));
      }
      
      if (options.service) {
        constraints.push(where('service', '==', options.service));
      }
      
      if (options.component) {
        constraints.push(where('component', '==', options.component));
      }
      
      if (options.status) {
        if (Array.isArray(options.status)) {
          constraints.push(where('status', 'in', options.status));
        } else {
          constraints.push(where('status', '==', options.status));
        }
      }
      
      if (options.startTime) {
        constraints.push(where('lastOccurrence', '>=', Timestamp.fromDate(options.startTime)));
      }
      
      if (options.endTime) {
        constraints.push(where('lastOccurrence', '<=', Timestamp.fromDate(options.endTime)));
      }
      
      // Always order by last occurrence descending
      constraints.push(orderBy('lastOccurrence', 'desc'));
      
      // Apply limit
      constraints.push(limit(options.limit || 100));
      
      const errorsQuery = query(collection(this.db, this.ERRORS_COLLECTION), ...constraints);
      
      const errorsSnapshot = await getDocs(errorsQuery);
      
      const errors = errorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ErrorReport[];
      
      // Filter by tags if specified (needs client-side filtering)
      if (options.tags && options.tags.length > 0) {
        return errors.filter(error => {
          if (!error.tags) return false;
          return options.tags!.some(tag => error.tags!.includes(tag));
        });
      }
      
      return errors;
    } catch (error) {
      console.error('Error getting errors:', error);
      throw error;
    }
  }
  
  /**
   * Update error status
   * @param errorId Error ID
   * @param status New status
   * @param resolution Optional resolution message
   * @param assignedTo Optional user ID to assign error to
   */
  async updateErrorStatus(
    errorId: string,
    status: ErrorStatus,
    resolution?: string,
    assignedTo?: string
  ): Promise<ErrorReport> {
    try {
      const errorRef = doc(this.db, this.ERRORS_COLLECTION, errorId);
      const errorDoc = await getDoc(errorRef);
      
      if (!errorDoc.exists()) {
        throw new Error(`Error with ID ${errorId} not found`);
      }
      
      const updates: Record<string, any> = {
        status,
        updatedAt: Timestamp.now()
      };
      
      if (resolution) {
        updates.resolution = resolution;
      }
      
      if (assignedTo) {
        updates.assignedTo = assignedTo;
      }
      
      if (status === ErrorStatus.RESOLVED) {
        updates.resolvedAt = Timestamp.now();
      }
      
      await updateDoc(errorRef, updates);
      
      const updatedErrorDoc = await getDoc(errorRef);
      return {
        id: updatedErrorDoc.id,
        ...updatedErrorDoc.data()
      } as ErrorReport;
    } catch (error) {
      console.error('Error updating error status:', error);
      throw error;
    }
  }
  
  /**
   * Get error occurrences
   * @param errorId Error ID
   * @param limit Maximum number of occurrences to return
   */
  async getErrorOccurrences(errorId: string, limit = 10): Promise<ErrorOccurrence[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('errorId', '==', errorId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      ];
      
      const occurrencesQuery = query(
        collection(this.db, this.ERROR_OCCURRENCES_COLLECTION),
        ...constraints
      );
      
      const occurrencesSnapshot = await getDocs(occurrencesQuery);
      
      return occurrencesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ErrorOccurrence[];
    } catch (error) {
      console.error('Error getting error occurrences:', error);
      throw error;
    }
  }
  
  /**
   * Get performance metrics
   * @param name Metric name
   * @param options Additional options
   */
  async getMetrics(
    name: string,
    options: {
      environment?: Environment;
      service?: string;
      component?: string;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    } = {}
  ): Promise<PerformanceMetric[]> {
    try {
      const constraints: QueryConstraint[] = [where('name', '==', name)];
      
      if (options.environment) {
        constraints.push(where('environment', '==', options.environment));
      } else {
        constraints.push(where('environment', '==', this.currentEnvironment));
      }
      
      if (options.service) {
        constraints.push(where('service', '==', options.service));
      }
      
      if (options.component) {
        constraints.push(where('component', '==', options.component));
      }
      
      if (options.startTime) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(options.startTime)));
      }
      
      if (options.endTime) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(options.endTime)));
      }
      
      // Always order by timestamp
      constraints.push(orderBy('timestamp', 'asc'));
      
      // Apply limit
      constraints.push(limit(options.limit || 1000));
      
      const metricsQuery = query(collection(this.db, this.METRICS_COLLECTION), ...constraints);
      
      const metricsSnapshot = await getDocs(metricsQuery);
      
      return metricsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PerformanceMetric[];
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw error;
    }
  }
  
  /**
   * Add log entry to batch
   * @param logEntry Log entry to add
   * @private
   */
  private addToBatch(logEntry: Omit<LogEntry, 'id'>): void {
    // Add to batch
    this.batchedLogs.push(logEntry as LogEntry);
    
    // If batch size exceeds threshold, flush immediately
    if (this.batchedLogs.length >= this.MAX_BATCH_SIZE) {
      this.flushLogs();
      return;
    }
    
    // Schedule flush if not already scheduled
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushLogs();
      }, this.BATCH_INTERVAL);
    }
  }
  
  /**
   * Flush batched logs to Firestore
   * @private
   */
  private async flushLogs(): Promise<void> {
    // Clear timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    // If no logs to flush, return
    if (this.batchedLogs.length === 0) {
      return;
    }
    
    // Get logs to flush
    const logs = [...this.batchedLogs];
    this.batchedLogs = [];
    
    try {
      // Call Cloud Function to batch save logs
      const batchSaveLogsFunction = httpsCallable<{logs: Omit<LogEntry, 'id'>[]}, {success: boolean}>(
        this.functions, 
        'batchSaveLogs'
      );
      
      await batchSaveLogsFunction({ logs });
    } catch (error) {
      console.error('Error flushing logs:', error);
      
      // Put logs back in the batch
      this.batchedLogs = [...logs, ...this.batchedLogs];
      
      // Schedule another flush attempt
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.flushLogs();
        }, this.BATCH_INTERVAL * 2);
      }
    }
  }
  
  /**
   * Log to console in non-production environments
   * @private
   */
  private logToConsole(message: string, level: LogLevel, metadata: any): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, metadata);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, metadata);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, metadata);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, metadata);
        break;
      case LogLevel.FATAL:
        console.error(prefix, message, metadata);
        break;
      default:
        console.log(prefix, message, metadata);
    }
  }
  
  /**
   * Handle uncaught errors
   * @private
   */
  private handleUncaughtError(event: ErrorEvent): void {
    const error = event.error || new Error(event.message);
    this.reportError(error, {
      severity: ErrorSeverity.HIGH,
      url: event.filename,
      data: {
        lineNumber: event.lineno,
        columnNumber: event.colno
      }
    });
  }
  
  /**
   * Handle unhandled promise rejections
   * @private
   */
  private handlePromiseRejection(event: PromiseRejectionEvent): void {
    const error = event.reason instanceof Error ? 
      event.reason : 
      new Error(String(event.reason));
    
    this.reportError(error, {
      severity: ErrorSeverity.MEDIUM,
      data: {
        type: 'unhandledrejection'
      }
    });
  }
  
  /**
   * Get current session ID
   * @private
   */
  private getSessionId(): string | undefined {
    if (typeof sessionStorage !== 'undefined') {
      let sessionId = sessionStorage.getItem('logging_session_id');
      
      if (!sessionId) {
        sessionId = this.generateSessionId();
        sessionStorage.setItem('logging_session_id', sessionId);
      }
      
      return sessionId;
    }
    
    return undefined;
  }
  
  /**
   * Generate a session ID
   * @private
   */
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Find similar error
   * @private
   */
  private async findSimilarError(message: string, environment: Environment): Promise<ErrorReport | null> {
    try {
      const constraints: QueryConstraint[] = [
        where('message', '==', message),
        where('environment', '==', environment),
        where('status', 'not-in', [ErrorStatus.RESOLVED, ErrorStatus.IGNORED]),
        limit(1)
      ];
      
      const exactMatchQuery = query(
        collection(this.db, this.ERRORS_COLLECTION),
        ...constraints
      );
      
      const exactMatchSnapshot = await getDocs(exactMatchQuery);
      
      if (!exactMatchSnapshot.empty) {
        return {
          id: exactMatchSnapshot.docs[0].id,
          ...exactMatchSnapshot.docs[0].data()
        } as ErrorReport;
      }
      
      // If no exact match, we might implement a more sophisticated matching algorithm
      // For now, return null
      return null;
    } catch (error) {
      console.error('Error finding similar error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const loggingService = new LoggingService(); 