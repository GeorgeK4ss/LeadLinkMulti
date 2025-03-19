import { 
  getPerformance, 
  trace 
} from 'firebase/performance';
import { app } from './firebase/config';

let performance = null;
const activeTraces = new Map();

/**
 * Initializes Firebase Performance Monitoring if supported and enabled
 */
export function initializePerformance() {
  try {
    // Check if performance monitoring is enabled via environment variable
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING !== 'true') {
      console.log('Firebase Performance Monitoring is disabled via configuration');
      return null;
    }

    // Initialize performance
    const app = getApp();
    performance = getPerformance(app);
    
    console.log('Firebase Performance Monitoring initialized successfully');
    return performance;
  } catch (error) {
    console.error('Error initializing Firebase Performance Monitoring:', error);
    return null;
  }
}

/**
 * Starts a custom trace to measure a specific operation
 * @param {string} traceName - The name of the trace
 * @returns {Object} The trace object with start and stop methods
 */
export function startTrace(traceName) {
  if (!performance) {
    console.log('Performance monitoring not initialized, skipping trace');
    return {
      putAttribute: () => {},
      putMetric: () => {},
      start: () => {},
      stop: () => {},
    };
  }

  try {
    const currentTrace = trace(performance, traceName);
    currentTrace.start();
    activeTraces.set(traceName, currentTrace);
    
    return {
      putAttribute: (name, value) => {
        currentTrace.putAttribute(name, value);
      },
      putMetric: (name, value) => {
        currentTrace.putMetric(name, value);
      },
      incrementMetric: (name, incrementBy = 1) => {
        const current = currentTrace.getMetric(name) || 0;
        currentTrace.putMetric(name, current + incrementBy);
      },
      stop: () => {
        currentTrace.stop();
        activeTraces.delete(traceName);
      }
    };
  } catch (error) {
    console.error(`Error starting trace ${traceName}:`, error);
    return {
      putAttribute: () => {},
      putMetric: () => {},
      start: () => {},
      stop: () => {},
    };
  }
}

/**
 * Stops an active trace by name
 * @param {string} traceName - The name of the trace to stop
 */
export function stopTrace(traceName) {
  if (!performance || !activeTraces.has(traceName)) return;
  
  try {
    const currentTrace = activeTraces.get(traceName);
    currentTrace.stop();
    activeTraces.delete(traceName);
  } catch (error) {
    console.error(`Error stopping trace ${traceName}:`, error);
  }
}

/**
 * Creates a wrapped function that is traced for performance
 * @param {Function} fn - The function to wrap with performance tracing
 * @param {string} traceName - The name to use for the trace
 * @returns {Function} The wrapped function
 */
export function traceFunction(fn, traceName) {
  return async (...args) => {
    const functionTrace = startTrace(traceName);
    try {
      const result = await fn(...args);
      return result;
    } finally {
      functionTrace.stop();
    }
  };
}

// Common trace names
export const TraceNames = {
  LOAD_DATA: 'load_data',
  API_CALL: 'api_call',
  RENDER_COMPONENT: 'render_component',
  SEARCH_OPERATION: 'search_operation',
  DATABASE_WRITE: 'database_write',
  DATABASE_READ: 'database_read',
  FILE_UPLOAD: 'file_upload',
  FILE_DOWNLOAD: 'file_download',
  REPORT_GENERATION: 'report_generation',
  AUTH_OPERATION: 'auth_operation'
}; 