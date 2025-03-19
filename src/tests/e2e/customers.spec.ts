import { test, expect, Page, BrowserContext } from '@playwright/test';
import { authenticate } from './setup';

test.describe('Customers Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Authenticate before each test
    await authenticate(page);
    // Navigate to customers page
    await page.goto('http://localhost:3000/customers');
  });

  test('should display customers list correctly', async ({ page }: { page: Page }) => {
    // Check if the customers title is visible
    await expect(page.locator('h1:has-text("Customers")')).toBeVisible();
    
    // Verify customers table is loaded
    await expect(page.locator('[data-testid="customers-table"]')).toBeVisible();
    
    // Verify that we have at least one customer in the table
    const customerRows = await page.locator('[data-testid="customer-row"]').all();
    expect(customerRows.length).toBeGreaterThan(0);
  });

  test('should allow filtering and searching customers', async ({ page }: { page: Page }) => {
    // Open filter section
    await page.click('[data-testid="filter-button"]');
    
    // Apply a status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Active');
    
    // Apply filter
    await page.click('[data-testid="apply-filter"]');
    
    // Verify the loading state appears
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Verify the filter badge is visible after loading
    await expect(page.locator('[data-testid="active-filter-badge"]:has-text("Active")')).toBeVisible();
    
    // Try searching for a specific customer
    await page.fill('[data-testid="search-input"]', 'Johnson');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verify search results contain the searched term
    await expect(page.locator('[data-testid="customer-row"]:has-text("Johnson")')).toBeVisible();
  });

  test('should allow viewing customer details', async ({ page }: { page: Page }) => {
    // Click on the first customer in the list
    await page.click('[data-testid="customer-row"]');
    
    // Verify we are on the customer details page
    await expect(page).toHaveURL(/\/customers\/[\w-]+$/);
    
    // Verify the customer details components are visible
    await expect(page.locator('[data-testid="customer-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-actions"]')).toBeVisible();
    
    // Check the tabs for different sections
    await expect(page.locator('[data-testid="info-tab"]')).toBeVisible();
    await page.click('[data-testid="transactions-tab"]');
    await expect(page.locator('[data-testid="transactions-content"]')).toBeVisible();
    await page.click('[data-testid="documents-tab"]');
    await expect(page.locator('[data-testid="documents-content"]')).toBeVisible();
    await page.click('[data-testid="notes-tab"]');
    await expect(page.locator('[data-testid="notes-content"]')).toBeVisible();
  });

  test('should allow adding notes to customer', async ({ page }: { page: Page }) => {
    // Navigate to a customer details page
    await page.click('[data-testid="customer-row"]');
    await expect(page).toHaveURL(/\/customers\/[\w-]+$/);
    
    // Go to notes tab
    await page.click('[data-testid="notes-tab"]');
    
    // Click add note button
    await page.click('[data-testid="add-note-button"]');
    
    // Fill in the note form
    const noteText = `Playwright test note ${new Date().toISOString()}`;
    await page.fill('[data-testid="note-content"]', noteText);
    
    // Save the note
    await page.click('[data-testid="save-note-button"]');
    
    // Verify the note is visible in the list
    await expect(page.locator(`[data-testid="note-item"]:has-text("${noteText}")`)).toBeVisible();
  });

  test('should adapt layout for mobile view', async ({ page }: { page: Page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify the mobile view is active
    await expect(page.locator('[data-testid="mobile-customers-list"]')).toBeVisible();
    
    // Verify customer cards are visible instead of table rows
    await expect(page.locator('[data-testid="customer-card"]')).toBeVisible();
    
    // Test mobile filtering
    await page.click('[data-testid="mobile-filter-button"]');
    await expect(page.locator('[data-testid="mobile-filter-drawer"]')).toBeVisible();
    
    // Open customer details in mobile view
    await page.click('[data-testid="customer-card"]');
    await expect(page).toHaveURL(/\/customers\/[\w-]+$/);
    
    // Check mobile tabs navigation
    await expect(page.locator('[data-testid="mobile-tabs-navigation"]')).toBeVisible();
    await page.click('[data-testid="mobile-tab-item-notes"]');
    await expect(page.locator('[data-testid="notes-content"]')).toBeVisible();
  });
}); 