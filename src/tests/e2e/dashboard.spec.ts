import { test, expect, Page, BrowserContext } from '@playwright/test';
import { authenticate } from './setup';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Authenticate before each test
    await authenticate(page);
    // Navigate to dashboard page
    await page.goto('http://localhost:3000/dashboard');
  });

  test('should display dashboard components correctly', async ({ page }: { page: Page }) => {
    // Check if the dashboard title is visible
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // Verify key dashboard elements
    await expect(page.locator('[data-testid="dashboard-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-leads"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
  });

  test('should allow switching between different views', async ({ page }: { page: Page }) => {
    // Find and click on the leads view button
    await page.click('button:has-text("Leads")');
    await expect(page.locator('h2:has-text("Lead Overview")')).toBeVisible();
    
    // Find and click on the customers view button
    await page.click('button:has-text("Customers")');
    await expect(page.locator('h2:has-text("Customer Overview")')).toBeVisible();
    
    // Switch back to main dashboard
    await page.click('button:has-text("Dashboard")');
    await expect(page.locator('[data-testid="dashboard-summary"]')).toBeVisible();
  });

  test('should display KPI metrics with correct data', async ({ page }: { page: Page }) => {
    // Verify KPI metrics are present
    const kpiElements = await page.locator('[data-testid="kpi-card"]').all();
    expect(kpiElements.length).toBeGreaterThan(0);
    
    // Check specific KPIs by their titles
    await expect(page.locator('[data-testid="kpi-card"]:has-text("Total Leads")')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-card"]:has-text("Conversion Rate")')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-card"]:has-text("Active Customers")')).toBeVisible();
  });

  test('should filter dashboard data correctly', async ({ page }: { page: Page }) => {
    // Find and click on the filter button
    await page.click('[data-testid="filter-button"]');
    
    // Select a date range (last 7 days)
    await page.click('[data-testid="date-range-select"]');
    await page.click('text=Last 7 Days');
    
    // Apply filter
    await page.click('[data-testid="apply-filter"]');
    
    // Verify the loading state appears
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Verify the filter badge is visible after loading
    await expect(page.locator('[data-testid="active-filter-badge"]:has-text("Last 7 Days")')).toBeVisible();
    
    // Verify data has been updated
    await expect(page.locator('[data-testid="dashboard-summary"]')).toBeVisible();
  });

  test('should handle offline mode correctly', async ({ page, context }: { page: Page, context: BrowserContext }) => {
    // Load dashboard to ensure data is cached
    await page.reload();
    await expect(page.locator('[data-testid="dashboard-summary"]')).toBeVisible();
    
    // Go offline
    await context.setOffline(true);
    
    // Reload the page to trigger offline behavior
    await page.reload();
    
    // Verify offline indicator is shown
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Verify cached data is still displayed
    await expect(page.locator('[data-testid="dashboard-summary"]')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
    
    // Reload and check if offline indicator is gone
    await page.reload();
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should adapt layout for mobile view', async ({ page }: { page: Page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if the mobile menu button is visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    
    // Check if navigation items are visible in mobile menu
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Leads')).toBeVisible();
    await expect(page.locator('text=Customers')).toBeVisible();
    
    // Verify responsive layout changes
    // Dashboard cards should be stacked in mobile view
    const dashboardCards = await page.locator('[data-testid="dashboard-card"]').all();
    for (const card of dashboardCards) {
      // Check that each card takes full width
      const boundingBox = await card.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(360); // Nearly full width of 375px viewport
      }
    }
  });
}); 