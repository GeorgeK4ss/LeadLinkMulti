/**
 * Configuration file for e2e tests
 * Contains common settings and test data
 */

export const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:5000/api',
  
  // Test user credentials
  testUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  
  // Test data
  testData: {
    leads: {
      new: {
        name: 'Playwright Test Lead',
        email: 'playwright@example.com',
        phone: '555-123-4567',
        source: 'Website'
      }
    },
    customers: {
      active: {
        name: 'Playwright Test Customer',
        email: 'customer@example.com',
        phone: '555-987-6543',
        status: 'Active'
      }
    }
  },
  
  // Test timeouts
  timeouts: {
    navigation: 5000,
    element: 3000,
    animation: 500
  },
  
  // Viewport sizes for responsive testing
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 }
  }
};

/**
 * Generate a unique identifier for test data
 * @returns String with timestamp to make the test data unique
 */
export function generateUniqueId(): string {
  return `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Get a unique test email
 * @returns Unique email address for testing
 */
export function getUniqueTestEmail(): string {
  return `test-${generateUniqueId()}@example.com`;
}

/**
 * Get test selectors with consistent naming
 * @returns Object with test selectors
 */
export const selectors = {
  // Authentication selectors
  auth: {
    loginForm: '[data-testid="login-form"]',
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    registerLink: '[data-testid="register-link"]',
    forgotPasswordLink: '[data-testid="forgot-password-link"]',
    errorMessage: '[data-testid="auth-error-message"]'
  },
  
  // Dashboard selectors
  dashboard: {
    summary: '[data-testid="dashboard-summary"]',
    recentLeads: '[data-testid="recent-leads"]',
    recentActivities: '[data-testid="recent-activities"]',
    kpiCard: '[data-testid="kpi-card"]'
  },
  
  // Leads selectors
  leads: {
    table: '[data-testid="leads-table"]',
    row: '[data-testid="lead-row"]',
    mobileList: '[data-testid="mobile-leads-list"]',
    card: '[data-testid="lead-card"]',
    newButton: '[data-testid="new-lead-button"]',
    filterButton: '[data-testid="filter-button"]'
  },
  
  // Customers selectors
  customers: {
    table: '[data-testid="customers-table"]',
    row: '[data-testid="customer-row"]',
    mobileList: '[data-testid="mobile-customers-list"]',
    card: '[data-testid="customer-card"]',
    newButton: '[data-testid="new-customer-button"]',
    filterButton: '[data-testid="filter-button"]'
  },
  
  // Common UI elements
  common: {
    loadingIndicator: '[data-testid="loading-indicator"]',
    mobileMenuButton: '[data-testid="mobile-menu-button"]',
    offlineIndicator: '[data-testid="offline-indicator"]',
    successMessage: '[data-testid="success-message"]',
    errorMessage: '[data-testid="error-message"]'
  }
}; 