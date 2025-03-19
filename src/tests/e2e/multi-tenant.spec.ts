import { test, expect, Page } from '@playwright/test';
import { authenticate } from './setup';
import { TEST_CONFIG, generateUniqueId } from './config';

// Test file for multi-tenant isolation testing
test.describe('Multi-Tenant Isolation', () => {
  let tenantId1: string;
  let tenantId2: string;

  test.beforeAll(async () => {
    // Generate unique tenant IDs for testing
    tenantId1 = `test-tenant-${generateUniqueId()}`;
    tenantId2 = `test-tenant-${generateUniqueId()}`;
  });

  test.beforeEach(async ({ page }: { page: Page }) => {
    // Authenticate before each test
    await authenticate(page);
  });

  test('should create tenants and verify isolation', async ({ page }: { page: Page }) => {
    // Navigate to tenant management page
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/tenants`);
    
    // Create first tenant
    await page.click('[data-testid="create-tenant-button"]');
    await page.fill('[data-testid="tenant-name-input"]', `Test Tenant 1 ${generateUniqueId()}`);
    await page.fill('[data-testid="tenant-id-input"]', tenantId1);
    await page.selectOption('[data-testid="tenant-plan-select"]', 'business');
    await page.click('[data-testid="submit-tenant-button"]');
    
    // Verify tenant was created
    await expect(page.locator(`[data-testid="tenant-row-${tenantId1}"]`)).toBeVisible();
    
    // Create second tenant
    await page.click('[data-testid="create-tenant-button"]');
    await page.fill('[data-testid="tenant-name-input"]', `Test Tenant 2 ${generateUniqueId()}`);
    await page.fill('[data-testid="tenant-id-input"]', tenantId2);
    await page.selectOption('[data-testid="tenant-plan-select"]', 'business');
    await page.click('[data-testid="submit-tenant-button"]');
    
    // Verify second tenant was created
    await expect(page.locator(`[data-testid="tenant-row-${tenantId2}"]`)).toBeVisible();
  });

  test('should create data in tenant 1 and verify it is not visible in tenant 2', async ({ page }: { page: Page }) => {
    // Create a unique lead for testing
    const uniqueLeadName = `Test Lead ${generateUniqueId()}`;
    
    // Navigate to tenant 1 leads
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId1}/leads`);
    
    // Create a new lead in tenant 1
    await page.click('[data-testid="new-lead-button"]');
    await page.fill('[data-testid="lead-name-input"]', uniqueLeadName);
    await page.fill('[data-testid="lead-email-input"]', `${generateUniqueId()}@example.com`);
    await page.fill('[data-testid="lead-phone-input"]', `555-${Math.floor(1000 + Math.random() * 9000)}`);
    await page.selectOption('[data-testid="lead-source-select"]', 'Website');
    await page.click('[data-testid="submit-lead-button"]');
    
    // Verify success and lead created in tenant 1
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await page.fill('[data-testid="search-input"]', uniqueLeadName);
    await page.press('[data-testid="search-input"]', 'Enter');
    await expect(page.locator(`text=${uniqueLeadName}`)).toBeVisible();
    
    // Navigate to tenant 2 leads
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId2}/leads`);
    
    // Search for the lead in tenant 2 (should not be found)
    await page.fill('[data-testid="search-input"]', uniqueLeadName);
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Verify lead is not visible in tenant 2
    await expect(page.locator(`text=${uniqueLeadName}`)).not.toBeVisible();
  });

  test('should verify API calls respect tenant isolation', async ({ page }: { page: Page }) => {
    // Create a unique customer for testing
    const uniqueCustomerName = `Test Customer ${generateUniqueId()}`;
    
    // Navigate to tenant 1 customers
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId1}/customers`);
    
    // Create a new customer in tenant 1
    await page.click('[data-testid="new-customer-button"]');
    await page.fill('[data-testid="customer-name-input"]', uniqueCustomerName);
    await page.fill('[data-testid="customer-email-input"]', `${generateUniqueId()}@example.com`);
    await page.click('[data-testid="submit-customer-button"]');
    
    // Verify customer was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Intercept API calls to verify tenant ID is included
    await page.route('**/api/customers**', route => {
      const url = route.request().url();
      expect(url).toContain(`tenantId=${tenantId1}`);
      route.continue();
    });
    
    // Load customer list to trigger API call
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId1}/customers`);
    
    // Change to tenant 2 context and verify different tenant ID is used
    await page.route('**/api/customers**', route => {
      const url = route.request().url();
      expect(url).toContain(`tenantId=${tenantId2}`);
      route.continue();
    });
    
    // Load tenant 2 customers to trigger API call
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId2}/customers`);
  });

  test('should verify tenant-specific settings are isolated', async ({ page }: { page: Page }) => {
    // Create a unique setting name for tenant 1
    const settingName = `Setting ${generateUniqueId()}`;
    const settingValue1 = `Value for Tenant 1 - ${generateUniqueId()}`;
    const settingValue2 = `Value for Tenant 2 - ${generateUniqueId()}`;
    
    // Navigate to tenant 1 settings
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId1}/settings`);
    
    // Create setting in tenant 1
    await page.click('[data-testid="add-setting-button"]');
    await page.fill('[data-testid="setting-name-input"]', settingName);
    await page.fill('[data-testid="setting-value-input"]', settingValue1);
    await page.click('[data-testid="save-setting-button"]');
    
    // Verify setting was saved
    await expect(page.locator(`[data-testid="setting-row"]:has-text("${settingName}")`)).toBeVisible();
    await expect(page.locator(`[data-testid="setting-value"]:has-text("${settingValue1}")`)).toBeVisible();
    
    // Navigate to tenant 2 settings
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId2}/settings`);
    
    // Create same named setting in tenant 2 with different value
    await page.click('[data-testid="add-setting-button"]');
    await page.fill('[data-testid="setting-name-input"]', settingName);
    await page.fill('[data-testid="setting-value-input"]', settingValue2);
    await page.click('[data-testid="save-setting-button"]');
    
    // Verify setting was saved with different value
    await expect(page.locator(`[data-testid="setting-row"]:has-text("${settingName}")`)).toBeVisible();
    await expect(page.locator(`[data-testid="setting-value"]:has-text("${settingValue2}")`)).toBeVisible();
    
    // Go back to tenant 1 and verify original value is preserved
    await page.goto(`${TEST_CONFIG.baseUrl}/tenants/${tenantId1}/settings`);
    await expect(page.locator(`[data-testid="setting-value"]:has-text("${settingValue1}")`)).toBeVisible();
  });

  test.afterAll(async ({ browser }) => {
    // Clean up created test tenants
    const page = await browser.newPage();
    await authenticate(page);
    
    // Navigate to tenant management page
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/tenants`);
    
    // Delete tenant 1
    await page.click(`[data-testid="tenant-row-${tenantId1}"] [data-testid="delete-tenant-button"]`);
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Delete tenant 2
    await page.click(`[data-testid="tenant-row-${tenantId2}"] [data-testid="delete-tenant-button"]`);
    await page.click('[data-testid="confirm-delete-button"]');
    
    await page.close();
  });
}); 