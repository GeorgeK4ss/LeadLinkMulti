// Analytics helper for tracking events across the application

// Define event categories
export enum EventCategory {
  Auth = 'auth',
  User = 'user',
  Lead = 'lead',
  Customer = 'customer',
  Document = 'document',
  Navigation = 'navigation',
  Search = 'search',
  Settings = 'settings',
  System = 'system',
  Error = 'error',
}

// Define common event actions
export enum EventAction {
  // Auth events
  Login = 'login',
  Logout = 'logout',
  Register = 'register',
  PasswordReset = 'password_reset',
  
  // Content events
  View = 'view',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  
  // Engagement events
  Click = 'click',
  Submit = 'submit',
  Download = 'download',
  Upload = 'upload',
  Share = 'share',
  
  // Search events
  Search = 'search',
  Filter = 'filter',
  Sort = 'sort',
  
  // System events
  Error = 'error',
  Success = 'success',
  Warning = 'warning',
}

interface AnalyticsEvent {
  category: EventCategory;
  action: EventAction | string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
  [key: string]: any; // For custom properties
}

interface PageView {
  path: string;
  title?: string;
  [key: string]: any; // For custom properties
}

class Analytics {
  private enabled: boolean;
  
  constructor() {
    // Check if analytics are enabled and properly configured
    this.enabled = typeof window !== 'undefined' && 
      typeof window.gtag === 'function' &&
      process.env.NODE_ENV === 'production';
  }
  
  /**
   * Track a page view
   */
  trackPageView({ path, title, ...customProps }: PageView): void {
    if (!this.enabled) return;
    
    try {
      window.gtag('config', 'G-MEASUREMENT_ID', {
        page_path: path,
        page_title: title,
        ...customProps
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }
  
  /**
   * Track a custom event
   */
  trackEvent({ category, action, label, value, nonInteraction = false, ...customProps }: AnalyticsEvent): void {
    if (!this.enabled) return;
    
    try {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        non_interaction: nonInteraction,
        ...customProps
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
  
  /**
   * Track user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.enabled) return;
    
    try {
      window.gtag('set', 'user_properties', properties);
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }
  
  /**
   * Track exceptions/errors
   */
  trackException(description: string, fatal: boolean = false): void {
    if (!this.enabled) return;
    
    try {
      window.gtag('event', 'exception', {
        description,
        fatal
      });
    } catch (error) {
      console.error('Error tracking exception:', error);
    }
  }
  
  /**
   * Track conversion
   */
  trackConversion(conversionId: string, label: string, value?: number): void {
    if (!this.enabled) return;
    
    try {
      window.gtag('event', 'conversion', {
        send_to: `G-MEASUREMENT_ID/${conversionId}`,
        value: value,
        currency: 'USD',
        transaction_id: '',
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  }
}

// Declare global window type
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Export a singleton instance
export const analytics = new Analytics(); 