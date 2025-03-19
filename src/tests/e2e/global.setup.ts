import { test as setup } from '@playwright/test';
import { TEST_CONFIG } from './config';
import * as fs from 'fs';
import * as path from 'path';

// This test runs as part of the 'setup' project and is responsible for authentication
setup('authenticate', async ({ page }) => {
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
  await page.context().storageState({ path: path.join(authDir, 'user.json') });
}); 