import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Go to login page before each test
    await page.goto('http://localhost:3000/login');
  });

  test('should show login form', async ({ page }: { page: Page }) => {
    // Check if login form is visible
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should validate login form', async ({ page }: { page: Page }) => {
    // Submit empty form and check for validation messages
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
    
    // Enter invalid email
    await page.fill('[data-testid="email-input"]', 'notanemail');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    
    // Enter valid email but no password
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should handle wrong credentials', async ({ page }: { page: Page }) => {
    // Enter incorrect email and password
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Verify error message appears
    await expect(page.locator('[data-testid="auth-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-error-message"]')).toContainText('Invalid credentials');
    
    // Verify we're still on the login page
    await expect(page).toHaveURL(/\/login$/);
  });

  test('should perform successful login', async ({ page }: { page: Page }) => {
    // Enter correct credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Verify redirect to dashboard after successful login
    await page.waitForNavigation();
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Verify dashboard page is loaded
    await expect(page.locator('[data-testid="dashboard-summary"]')).toBeVisible();
    
    // Verify user info is visible in the header
    await expect(page.locator('[data-testid="user-profile-button"]')).toBeVisible();
  });

  test('should allow password reset request', async ({ page }: { page: Page }) => {
    // Click on forgot password link
    await page.click('[data-testid="forgot-password-link"]');
    
    // Verify we're on the forgot password page
    await expect(page).toHaveURL(/\/forgot-password$/);
    
    // Enter email for password reset
    await page.fill('[data-testid="reset-email-input"]', 'test@example.com');
    await page.click('[data-testid="submit-reset-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="reset-success-message"]')).toBeVisible();
  });

  test('should handle registration flow', async ({ page }: { page: Page }) => {
    // Click on register link
    await page.click('[data-testid="register-link"]');
    
    // Verify we're on the registration page
    await expect(page).toHaveURL(/\/register$/);
    
    // Generate a unique email for testing
    const uniqueEmail = `test${Date.now()}@example.com`;
    
    // Fill registration form
    await page.fill('[data-testid="register-name-input"]', 'Test User');
    await page.fill('[data-testid="register-email-input"]', uniqueEmail);
    await page.fill('[data-testid="register-password-input"]', 'TestPassword123');
    await page.fill('[data-testid="register-confirm-password-input"]', 'TestPassword123');
    await page.click('[data-testid="accept-terms-checkbox"]');
    
    // Submit registration
    await page.click('[data-testid="register-submit-button"]');
    
    // Verify success message or redirect to dashboard
    try {
      // Check if there's a verification message (if email verification is required)
      await expect(page.locator('[data-testid="verification-message"]')).toBeVisible({timeout: 5000});
    } catch (error) {
      // Otherwise, we should be redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard$/);
    }
  });

  test('should adapt for mobile view', async ({ page }: { page: Page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify login form is properly displayed on mobile
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // Verify responsive behavior
    const formElement = await page.locator('[data-testid="login-form"]');
    const boundingBox = await formElement.boundingBox();
    
    // Form should take nearly the full width on mobile
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(350);
    }
    
    // Verify the social login buttons stack on mobile
    const socialButtons = await page.locator('[data-testid="social-login-button"]').all();
    for (let i = 0; i < socialButtons.length - 1; i++) {
      const currentButton = await socialButtons[i].boundingBox();
      const nextButton = await socialButtons[i + 1].boundingBox();
      
      if (currentButton && nextButton) {
        // Verify vertical stacking (next button is below current)
        expect(nextButton.y).toBeGreaterThan(currentButton.y);
      }
    }
  });
});