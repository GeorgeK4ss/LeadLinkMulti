"use client";

import { useState, useCallback } from "react";
import { errorService } from "@/lib/error/error-service";

interface ErrorState {
  error: Error | null;
  message: string | null;
}

interface UseErrorHandlerOptions {
  context?: string;
  defaultMessage?: string;
  onError?: (error: Error) => void;
}

/**
 * React hook for handling errors in components
 * 
 * @param options Configuration options
 * @returns Object with error state and utility functions
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { 
    context, 
    defaultMessage = "An unexpected error occurred", 
    onError 
  } = options;
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    message: null,
  });

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setErrorState({ error: null, message: null });
  }, []);

  /**
   * Set an error manually
   */
  const setError = useCallback((error: Error | string) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    
    setErrorState({
      error: errorObj,
      message: errorObj.message || defaultMessage,
    });
    
    // Log the error with the error service
    errorService.captureError(errorObj, { context });
    
    // Call onError callback if provided
    if (onError) {
      onError(errorObj);
    }
    
    return errorObj;
  }, [context, defaultMessage, onError]);

  /**
   * Handle an error from a try/catch block
   */
  const handleError = useCallback((error: unknown) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return setError(errorObj);
  }, [setError]);

  /**
   * Create a wrapped version of an async function with error handling
   */
  const wrapAsync = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (err) {
        handleError(err);
        throw err;
      }
    };
  }, [handleError]);

  /**
   * Safe execution of an async function with automatic error handling
   */
  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | undefined> => {
    clearError();
    
    try {
      return await asyncFn();
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new Error(errorMessage || String(err));
      
      setError(error);
      return undefined;
    }
  }, [clearError, setError]);

  return {
    error: errorState.error,
    errorMessage: errorState.message,
    hasError: errorState.error !== null,
    setError,
    handleError,
    clearError,
    wrapAsync,
    executeAsync,
  };
}

/**
 * Example usage:
 * 
 * const MyComponent = () => {
 *   const { 
 *     error, 
 *     errorMessage, 
 *     hasError, 
 *     clearError, 
 *     handleError,
 *     executeAsync 
 *   } = useErrorHandler({ 
 *     context: 'UserProfile',
 *     defaultMessage: 'Failed to load user profile'
 *   });
 * 
 *   const fetchUserData = async () => {
 *     // This will automatically handle errors
 *     const userData = await executeAsync(
 *       async () => {
 *         const response = await fetch('/api/user');
 *         if (!response.ok) throw new Error('Failed to fetch user');
 *         return response.json();
 *       },
 *       'Could not load user data'
 *     );
 * 
 *     if (userData) {
 *       // Process data on success
 *     }
 *   };
 * 
 *   // Display error in UI if there is one
 *   return (
 *     <div>
 *       {hasError && (
 *         <Alert variant="destructive">
 *           <AlertDescription>{errorMessage}</AlertDescription>
 *         </Alert>
 *       )}
 *       <Button onClick={fetchUserData}>Load Data</Button>
 *     </div>
 *   );
 * };
 */ 