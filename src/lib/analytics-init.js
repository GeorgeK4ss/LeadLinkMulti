import { 
  getAnalytics, 
  isSupported, 
  logEvent, 
  setUserId, 
  setUserProperties 
} from 'firebase/analytics';
import { app } from './firebase/config';

let analytics = null;

/**
 * Initializes Firebase Analytics if supported and enabled
 */
export async function initializeAnalytics() {
  try {
    // Check if analytics is enabled via environment variable
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      console.log('Firebase Analytics is disabled via configuration');
      return null;
    }

    // Check if analytics is supported in this environment
    const isAnalyticsSupported = await isSupported();
    
    if (!isAnalyticsSupported) {
      console.log('Firebase Analytics is not supported in this environment');
      return null;
    }

    // Initialize analytics
    analytics = getAnalytics(app);
    
    console.log('Firebase Analytics initialized successfully');
    return analytics;
  } catch (error) {
    console.error('Error initializing Firebase Analytics:', error);
    return null;
  }
}

/**
 * Tracks a custom event in Firebase Analytics
 * @param {string} eventName - The name of the event to track
 * @param {Object} eventParams - Parameters to include with the event
 */
export function trackEvent(eventName, eventParams = {}) {
  if (!analytics) {
    console.log('Analytics not initialized, skipping event tracking');
    return;
  }

  try {
    logEvent(analytics, eventName, {
      timestamp: new Date().toISOString(),
      ...eventParams
    });
  } catch (error) {
    console.error(`Error tracking event ${eventName}:`, error);
  }
}

/**
 * Sets the user ID for Firebase Analytics
 * @param {string} userId - The user ID to set
 */
export function setAnalyticsUserId(userId) {
  if (!analytics || !userId) return;

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error('Error setting analytics user ID:', error);
  }
}

/**
 * Sets user properties for Firebase Analytics
 * @param {Object} properties - The user properties to set
 */
export function setAnalyticsUserProperties(properties) {
  if (!analytics || !properties) return;

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error('Error setting analytics user properties:', error);
  }
}

/**
 * Tracks a page view in Firebase Analytics
 * @param {string} pagePath - The path of the page being viewed
 * @param {string} pageTitle - The title of the page being viewed
 */
export function trackPageView(pagePath, pageTitle) {
  if (!analytics) return;

  try {
    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

// Standard events to track
export const AnalyticsEvents = {
  LOGIN: 'login',
  SIGN_UP: 'sign_up',
  LEAD_CREATED: 'lead_created',
  LEAD_UPDATED: 'lead_updated',
  LEAD_CONVERTED: 'lead_converted',
  SEARCH: 'search',
  REPORT_GENERATED: 'report_generated',
  FILE_DOWNLOAD: 'file_download',
  FILE_UPLOAD: 'file_upload',
  FEATURE_USED: 'feature_used',
  ERROR_OCCURRED: 'error_occurred',
  SUBSCRIPTION_CHANGED: 'subscription_changed'
}; 