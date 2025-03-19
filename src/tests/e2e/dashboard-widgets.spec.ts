import { test, expect, Page } from '@playwright/test';
import { authenticate } from './setup';
import { TEST_CONFIG, generateUniqueId } from './config';

// Test file for the custom dashboard widgets functionality
test.describe('Custom Dashboard Widgets', () => {
  let tenantId: string;

  test.beforeAll(async () => {
    // Generate unique tenant ID for testing
    tenantId = `test-tenant-${generateUniqueId()}`;
  });

  test.beforeEach(async ({ page }: { page: Page }) => {
    // Authenticate before each test
    await authenticate(page);
    
    // Create test tenant if it doesn't exist yet (only on first test)
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/tenants`);
    
    // Check if tenant already exists
    const tenantExists = await page.locator(`[data-testid="tenant-row-${tenantId}"]`).count() > 0;
    
    if (!tenantExists) {
      // Create test tenant
      await page.click('[data-testid="create-tenant-button"]');
      await page.fill('[data-testid="tenant-name-input"]', `Widget Test Tenant ${generateUniqueId()}`);
      await page.fill('[data-testid="tenant-id-input"]', tenantId);
      await page.selectOption('[data-testid="tenant-plan-select"]', 'business');
      await page.click('[data-testid="submit-tenant-button"]');
      
      // Verify tenant was created
      await expect(page.locator(`[data-testid="tenant-row-${tenantId}"]`)).toBeVisible();
    }
    
    // Navigate to the tenant's dashboard
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId}/dashboard`);
  });

  test('should display default dashboard widgets', async ({ page }: { page: Page }) => {
    // Verify the default dashboard layout contains the expected widgets
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="tasks-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="lead-metrics-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-timeline-widget"]')).toBeVisible();
  });

  test('should be able to customize dashboard', async ({ page }: { page: Page }) => {
    // Click the customize button
    await page.click('[data-testid="customize-dashboard-button"]');
    
    // Verify edit mode is activated
    await expect(page.locator('[data-testid="dashboard-edit-mode"]')).toBeVisible();
    
    // Add a new widget
    await page.click('[data-testid="add-widget-button"]');
    await expect(page.locator('[data-testid="add-widget-dialog"]')).toBeVisible();
    await page.click('[data-testid="add-tasks-widget-button"]');
    
    // Verify new widget is added
    await expect(page.locator('[data-testid="tasks-widget"]').nth(1)).toBeVisible();
    
    // Remove a widget
    const widgets = await page.locator('[data-testid="widget-container"]').all();
    await page.locator('[data-testid="widget-container"]').first().hover();
    await page.click('[data-testid="remove-widget-button"]');
    
    // Verify widget count is reduced
    const newWidgetCount = await page.locator('[data-testid="widget-container"]').count();
    expect(newWidgetCount).toBe(widgets.length - 1);
    
    // Exit customize mode
    await page.click('[data-testid="done-customizing-button"]');
    
    // Verify edit mode is deactivated
    await expect(page.locator('[data-testid="dashboard-edit-mode"]')).not.toBeVisible();
  });

  test('should be able to resize widgets', async ({ page }: { page: Page }) => {
    // Enter customize mode
    await page.click('[data-testid="customize-dashboard-button"]');
    
    // Get the current width of the first widget
    const firstWidget = page.locator('[data-testid="widget-container"]').first();
    const initialWidth = await firstWidget.evaluate(el => el.getBoundingClientRect().width);
    
    // Open the widget settings menu
    await firstWidget.hover();
    await page.click('[data-testid="widget-settings-button"]');
    
    // Change width to full
    await page.click('[data-testid="widget-width-full"]');
    
    // Exit customize mode
    await page.click('[data-testid="done-customizing-button"]');
    
    // Verify the widget width has changed
    const newWidth = await firstWidget.evaluate(el => el.getBoundingClientRect().width);
    expect(newWidth).toBeGreaterThan(initialWidth);
  });

  test('should be able to drag and reorder widgets', async ({ page }: { page: Page }) => {
    // Enter customize mode
    await page.click('[data-testid="customize-dashboard-button"]');
    
    // Get the first two widgets
    const firstWidget = page.locator('[data-testid="widget-container"]').first();
    const secondWidget = page.locator('[data-testid="widget-container"]').nth(1);
    
    // Get the initial widget IDs
    const firstWidgetId = await firstWidget.getAttribute('data-widget-id');
    const secondWidgetId = await secondWidget.getAttribute('data-widget-id');
    
    // Drag the first widget to the position of the second
    await firstWidget.dragTo(secondWidget);
    
    // Get the new first and second widgets
    const newFirstWidget = page.locator('[data-testid="widget-container"]').first();
    const newSecondWidget = page.locator('[data-testid="widget-container"]').nth(1);
    
    // Get the new widget IDs
    const newFirstWidgetId = await newFirstWidget.getAttribute('data-widget-id');
    const newSecondWidgetId = await newSecondWidget.getAttribute('data-widget-id');
    
    // Verify the widgets have swapped positions
    expect(newFirstWidgetId).toBe(secondWidgetId);
    expect(newSecondWidgetId).toBe(firstWidgetId);
    
    // Exit customize mode
    await page.click('[data-testid="done-customizing-button"]');
  });

  test('should save widget configuration', async ({ page }: { page: Page }) => {
    // Enter customize mode
    await page.click('[data-testid="customize-dashboard-button"]');
    
    // Add a new widget
    await page.click('[data-testid="add-widget-button"]');
    await page.click('[data-testid="add-tasks-widget-button"]');
    
    // Exit customize mode
    await page.click('[data-testid="done-customizing-button"]');
    
    // Get the widget count
    const widgetCount = await page.locator('[data-testid="widget-container"]').count();
    
    // Reload the page
    await page.reload();
    
    // Verify the widget count is maintained
    await expect(page.locator('[data-testid="widget-container"]')).toHaveCount(widgetCount);
  });

  test.afterAll(async ({ browser }) => {
    // Clean up created test tenant
    const page = await browser.newPage();
    await authenticate(page);
    
    // Navigate to tenant management page
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/tenants`);
    
    // Delete the test tenant
    await page.click(`[data-testid="tenant-row-${tenantId}"] [data-testid="delete-tenant-button"]`);
    await page.click('[data-testid="confirm-delete-button"]');
    
    await page.close();
  });
}); 