/**
 * Error Service for centralized error handling
 * This service can be extended to send errors to monitoring services like Sentry
 */

type ErrorMetadata = Record<string, any>;
type ErrorSeverity = "low" | "medium" | "high" | "critical";

interface ErrorOptions {
  severity?: ErrorSeverity;
  metadata?: ErrorMetadata;
  userId?: string;
  context?: string;
}

class ErrorService {
  private static instance: ErrorService;
  
  private constructor() {
    // Initialize error listeners
    this.setupGlobalHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Setup global unhandled error and promise rejection handlers
   */
  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          severity: 'high',
          context: 'window.onerror',
          metadata: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
        
        // Don't prevent default handling
        return false;
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason));
          
        this.captureError(error, {
          severity: 'high',
          context: 'unhandledrejection',
          metadata: {
            reason: event.reason,
          }
        });
      });
    }
  }

  /**
   * Log an error to the console with additional context
   */
  private logError(error: Error, options?: ErrorOptions): void {
    const { severity = 'medium', context, metadata } = options || {};
    
    console.group(`[ERROR] ${severity.toUpperCase()}: ${error.message}`);
    console.error(error);
    
    if (context) {
      console.info(`Context: ${context}`);
    }
    
    if (metadata) {
      console.info('Metadata:', metadata);
    }
    
    console.groupEnd();
  }
  
  /**
   * Capture and process an error
   */
  public captureError(error: Error, options?: ErrorOptions): void {
    // Log error to console
    this.logError(error, options);
    
    // Here you would typically send the error to a monitoring service like Sentry
    this.sendToMonitoringService(error, options);
  }
  
  /**
   * Send error to external monitoring service (like Sentry)
   * This is a placeholder that should be implemented with actual service
   */
  private sendToMonitoringService(error: Error, options?: ErrorOptions): void {
    // This is where you would integrate with Sentry, LogRocket, etc.
    // For now, we'll just log that we would send it
    if (process.env.NODE_ENV === 'production') {
      // Example integration point with monitoring service
      // Sentry.captureException(error, { 
      //   extra: options?.metadata,
      //   tags: { 
      //     severity: options?.severity,
      //     context: options?.context
      //   },
      //   user: options?.userId ? { id: options.userId } : undefined
      // });
    }
  }
  
  /**
   * Create an error object with consistent formatting
   */
  public createError(message: string, originalError?: Error): Error {
    const error = new Error(message);
    
    if (originalError) {
      error.stack = `${error.stack}\nCaused by: ${originalError.stack}`;
    }
    
    return error;
  }
  
  /**
   * Handle API errors consistently
   */
  public handleApiError(error: any, context?: string): Error {
    let message = "An unexpected error occurred";
    let metadata: ErrorMetadata = {};
    
    if (error.response) {
      // The request was made and the server responded with an error status
      message = error.response.data?.message || `API Error: ${error.response.status}`;
      metadata = {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else if (error.request) {
      // The request was made but no response was received
      message = "No response received from server";
      metadata = {
        request: error.request,
      };
    } else {
      // Something happened in setting up the request
      message = error.message || message;
    }
    
    const enhancedError = this.createError(message, error);
    
    this.captureError(enhancedError, {
      severity: 'high',
      context: context || 'api',
      metadata,
    });
    
    return enhancedError;
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();

/**
 * Utility function to wrap async functions with error handling
 */
export function withErrorHandling<T>(
  fn: (...args: any[]) => Promise<T>,
  options: {
    context?: string;
    onError?: (error: Error) => void;
  } = {}
): (...args: any[]) => Promise<T> {
  return async (...args: any[]): Promise<T> => {
    try {
      return await fn(...args);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errorService.captureError(error, {
        context: options.context,
      });
      
      if (options.onError) {
        options.onError(error);
      }
      
      throw error;
    }
  };
}

/**
 * Example usage:
 * 
 * // Capture a specific error
 * try {
 *   // Some code that might throw
 * } catch (err) {
 *   errorService.captureError(err instanceof Error ? err : new Error(String(err)), {
 *     severity: 'high',
 *     context: 'userProfile',
 *     metadata: { userId: currentUser.id }
 *   });
 * }
 * 
 * // Wrap an async function with error handling
 * const fetchUserSafe = withErrorHandling(fetchUser, { 
 *   context: 'user-fetch', 
 *   onError: () => setUserLoadFailed(true) 
 * });
 */ 