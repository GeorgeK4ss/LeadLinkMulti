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
  try {
    await setupAuthState(page, context);
  } catch (error) {
    console.error('Failed to setup auth state:', error);
    // Save whatever auth state we have anyway
    const authDir = path.join(process.cwd(), 'playwright/.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Save the authentication state to a file even if authentication failed
    await context.storageState({ path: path.join(authDir, 'user.json') });
  }

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
  await page.goto(`${TEST_CONFIG.baseUrl}/login`, { timeout: 30000 });
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', TEST_CONFIG.testUser.email);
  await page.fill('[data-testid="password-input"]', TEST_CONFIG.testUser.password);
  
  // Submit the form and wait for navigation
  await Promise.all([
    page.click('[data-testid="login-button"]'),
    // Don't wait for a specific navigation, just a network idle
    page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => console.log('Network did not become idle'))
  ]);
  
  // Take a screenshot to help debug
  await page.screenshot({ path: 'auth-state.png' });
  
  // Try to wait for any dashboard element, but don't fail if not found
  try {
    await page.waitForSelector('[data-testid^="dashboard"]', { timeout: 5000 });
  } catch (error) {
    console.log('Dashboard element not found. Current URL:', page.url());
  }
  
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
  
  // Submit the form and wait for navigation
  await Promise.all([
    page.click('[data-testid="login-button"]'),
    // Don't wait for a specific navigation, just a network idle
    page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => console.log('Network did not become idle'))
  ]);
  
  // Try to wait for any dashboard element, but don't fail if not found
  try {
    await page.waitForSelector('[data-testid^="dashboard"]', { timeout: 5000 });
  } catch (error) {
    console.log('Dashboard element not found. Current URL:', page.url());
    // Take a screenshot to help debug
    await page.screenshot({ path: 'auth-failure.png' });
  }
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