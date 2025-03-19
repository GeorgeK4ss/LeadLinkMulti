import { Page, BrowserContext, chromium, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { TEST_CONFIG } from './config';

/**
 * Global setup for end-to-end tests.
 * This runs once before all tests.
 */
export default async function globalSetup() {
  // Create a browser instance that will be shared for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set up auth state that can be reused for tests needing authentication
  await setupAuthState(page, context);

  // Close the browser
  await browser.close();
}

/**
 * Sets up authentication state for tests
 * @param page Playwright page object
 * @param context Playwright browser context
 */
async function setupAuthState(page: Page, context: BrowserContext): Promise<void> {
  // Navigate to login page
  await page.goto(`${TEST_CONFIG.baseUrl}/login`);
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', TEST_CONFIG.testUser.email);
  await page.fill('[data-testid="password-input"]', TEST_CONFIG.testUser.password);
  
  // Submit the form
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation to complete and dashboard to load
  await page.waitForNavigation();
  await page.waitForSelector('[data-testid="dashboard-summary"]');
  
  // Ensure the auth directory exists
  const authDir = path.join(process.cwd(), 'playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Save the authentication state to a file
  await context.storageState({ path: path.join(authDir, 'user.json') });
}

/**
 * Authenticates the user in the application for testing
 * @param page Playwright page object
 */
export async function authenticate(page: Page): Promise<void> {
  // Navigate to login page
  await page.goto(`${TEST_CONFIG.baseUrl}/login`);
  
  // Fill in credentials - using test user credentials
  await page.fill('[data-testid="email-input"]', TEST_CONFIG.testUser.email);
  await page.fill('[data-testid="password-input"]', TEST_CONFIG.testUser.password);
  
  // Submit the form
  await page.click('[data-testid="login-button"]');
  
  // Wait for navigation to complete and dashboard to load
  await page.waitForNavigation();
  await page.waitForSelector('[data-testid="dashboard-summary"]');
}

/**
 * Helper function to test offline behavior
 */
export async function simulateOffline(page: Page) {
  await page.context().setOffline(true);
}

/**
 * Helper function to restore online connectivity
 */
export async function simulateOnline(page: Page) {
  await page.context().setOffline(false);
} 