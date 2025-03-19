/**
 * Configuration for performance tests
 * Defines thresholds and test parameters
 */

export const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds
  thresholds: {
    // First Contentful Paint threshold in milliseconds
    FCP: 1800,
    
    // Largest Contentful Paint threshold in milliseconds
    LCP: 2500,
    
    // Cumulative Layout Shift threshold
    CLS: 0.1,
    
    // First Input Delay threshold in milliseconds
    FID: 100,
    
    // Time to Interactive threshold in milliseconds
    TTI: 3500,
    
    // Total Blocking Time threshold in milliseconds
    TBT: 300,
    
    // Server Response Time threshold in milliseconds
    TTFB: 600
  },
  
  // Performance test scenarios
  scenarios: {
    // Dashboard load performance
    dashboardLoad: {
      description: 'Dashboard initial load performance',
      url: '/dashboard',
      waitFor: '[data-testid="dashboard-summary"]',
      metrics: ['FCP', 'LCP', 'CLS', 'TTFB']
    },
    
    // Lead list load performance
    leadListLoad: {
      description: 'Lead list load performance',
      url: '/leads',
      waitFor: '[data-testid="leads-table"]',
      metrics: ['FCP', 'LCP', 'TTI']
    },
    
    // Customer details load performance
    customerDetailsLoad: {
      description: 'Customer details page load performance',
      url: '/customers/test-customer-id',
      waitFor: '[data-testid="customer-details"]',
      metrics: ['FCP', 'LCP', 'TTI']
    },
    
    // Report generation performance
    reportGeneration: {
      description: 'Report generation performance',
      url: '/reports/generate',
      waitFor: '[data-testid="report-preview"]',
      metrics: ['FCP', 'TTI', 'TBT']
    }
  },
  
  // Device profiles for performance testing
  devices: {
    desktop: {
      viewport: { width: 1280, height: 800 },
      userAgent: 'desktop',
      throttling: {
        cpu: 1,
        network: 'Fast 3G'
      }
    },
    mobile: {
      viewport: { width: 375, height: 667 },
      userAgent: 'mobile',
      throttling: {
        cpu: 4,
        network: 'Slow 3G'
      }
    }
  },

  // Network conditions
  networkConditions: {
    'Fast 3G': {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8,
      uploadThroughput: 750 * 1024 / 8,
      latency: 40
    },
    'Slow 3G': {
      offline: false,
      downloadThroughput: 500 * 1024 / 8,
      uploadThroughput: 500 * 1024 / 8,
      latency: 300
    }
  }
}; 