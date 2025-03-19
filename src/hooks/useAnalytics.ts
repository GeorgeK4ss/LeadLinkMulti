import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { analytics, EventCategory, EventAction } from '@/lib/analytics';

/**
 * Custom hook to use analytics within components
 */
export function useAnalytics() {
  const router = useRouter();
  
  // Track page views automatically
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      analytics.trackPageView({
        path: url,
        title: document.title,
      });
    };
    
    // Track initial page load
    handleRouteChange(router.asPath);
    
    // Track route changes
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
  return {
    // Main analytics methods
    trackEvent: analytics.trackEvent.bind(analytics),
    trackException: analytics.trackException.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
    
    // Helper methods for common event tracking
    trackLeadAction(action: EventAction, leadId: string, extraProps = {}) {
      analytics.trackEvent({
        category: EventCategory.Lead,
        action,
        label: leadId,
        ...extraProps
      });
    },
    
    trackCustomerAction(action: EventAction, customerId: string, extraProps = {}) {
      analytics.trackEvent({
        category: EventCategory.Customer,
        action,
        label: customerId,
        ...extraProps
      });
    },
    
    trackDocumentAction(action: EventAction, documentId: string, extraProps = {}) {
      analytics.trackEvent({
        category: EventCategory.Document,
        action,
        label: documentId,
        ...extraProps
      });
    },
    
    trackNavigation(destination: string, extraProps = {}) {
      analytics.trackEvent({
        category: EventCategory.Navigation,
        action: EventAction.Click,
        label: destination,
        ...extraProps
      });
    },
    
    trackSearch(query: string, resultsCount: number, extraProps = {}) {
      analytics.trackEvent({
        category: EventCategory.Search,
        action: EventAction.Search,
        label: query,
        value: resultsCount,
        ...extraProps
      });
    },
    
    trackError(errorMessage: string, isFatal = false, extraProps = {}) {
      analytics.trackEvent({
        category: EventCategory.Error,
        action: EventAction.Error,
        label: errorMessage,
        nonInteraction: true,
        ...extraProps
      });
      analytics.trackException(errorMessage, isFatal);
    },
  };
} 