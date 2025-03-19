import { test, expect, Page, BrowserContext } from '@playwright/test';
import { authenticate } from './setup';

test.describe('Leads Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Authenticate before each test
    await authenticate(page);
    // Navigate to leads page
    await page.goto('http://localhost:3000/leads');
  });

  test('should display leads list correctly', async ({ page }: { page: Page }) => {
    // Check if the leads title is visible
    await expect(page.locator('h1:has-text("Leads")')).toBeVisible();
    
    // Verify leads table is loaded
    await expect(page.locator('[data-testid="leads-table"]')).toBeVisible();
    
    // Verify that we have at least one lead in the table
    const leadRows = await page.locator('[data-testid="lead-row"]').all();
    expect(leadRows.length).toBeGreaterThan(0);
  });

  test('should allow filtering and searching leads', async ({ page }: { page: Page }) => {
    // Open filter section
    await page.click('[data-testid="filter-button"]');
    
    // Apply a status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('text=New Lead');
    
    // Apply filter
    await page.click('[data-testid="apply-filter"]');
    
    // Verify the loading state appears
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Verify the filter badge is visible after loading
    await expect(page.locator('[data-testid="active-filter-badge"]:has-text("New Lead")')).toBeVisible();
    
    // Try searching for a specific lead
    await page.fill('[data-testid="search-input"]', 'Smith');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verify search results contain the searched term
    await expect(page.locator('[data-testid="lead-row"]:has-text("Smith")')).toBeVisible();
  });

  test('should allow viewing lead details', async ({ page }: { page: Page }) => {
    // Click on the first lead in the list
    await page.click('[data-testid="lead-row"]');
    
    // Verify we are on the lead details page
    await expect(page).toHaveURL(/\/leads\/[\w-]+$/);
    
    // Verify the lead details components are visible
    await expect(page.locator('[data-testid="lead-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="lead-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="lead-actions"]')).toBeVisible();
  });

  test('should allow creating a new lead', async ({ page }: { page: Page }) => {
    // Click on new lead button
    await page.click('[data-testid="new-lead-button"]');
    
    // Verify we are on the new lead page
    await expect(page).toHaveURL(/\/leads\/new$/);
    
    // Fill out the form with test data
    await page.fill('[data-testid="lead-name-input"]', 'Playwright Test Lead');
    await page.fill('[data-testid="lead-email-input"]', 'playwright@example.com');
    await page.fill('[data-testid="lead-phone-input"]', '555-123-4567');
    await page.selectOption('[data-testid="lead-source-select"]', 'Website');
    
    // Submit the form
    await page.click('[data-testid="submit-lead-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Verify we are redirected back to leads list
    await expect(page).toHaveURL(/\/leads$/);
    
    // Verify our new lead is in the list
    await page.fill('[data-testid="search-input"]', 'Playwright Test Lead');
    await page.press('[data-testid="search-input"]', 'Enter');
    await expect(page.locator('[data-testid="lead-row"]:has-text("Playwright Test Lead")')).toBeVisible();
  });

  test('should adapt layout for mobile view', async ({ page }: { page: Page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify the mobile view is active
    await expect(page.locator('[data-testid="mobile-leads-list"]')).toBeVisible();
    
    // Verify lead cards are visible instead of table rows
    await expect(page.locator('[data-testid="lead-card"]')).toBeVisible();
    
    // Test mobile filtering
    await page.click('[data-testid="mobile-filter-button"]');
    await expect(page.locator('[data-testid="mobile-filter-drawer"]')).toBeVisible();
    
    // Apply a filter
    await page.click('[data-testid="mobile-status-filter"]');
    await page.click('text=New Lead');
    await page.click('[data-testid="apply-mobile-filter"]');
    
    // Verify filter was applied
    await expect(page.locator('[data-testid="mobile-filter-badge"]')).toBeVisible();
  });
}); 