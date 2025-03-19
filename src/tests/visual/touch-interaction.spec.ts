import { test, expect, Page } from '@playwright/test';

test.describe('Touch Interaction Components Visual Testing', () => {
  const touchExampleRoute = '/examples/touch';

  // Helper functions to simulate touch events
  async function simulateSwipe(page: Page, direction: 'left' | 'right' | 'up' | 'down') {
    // Find the swipe container
    const container = await page.locator('.bg-muted:has-text("Swipe Direction")').first();
    const boundingBox = await container.boundingBox();
    
    if (!boundingBox) {
      throw new Error('Cannot find swipe container');
    }
    
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;
    
    let startX = centerX;
    let startY = centerY;
    let endX = centerX;
    let endY = centerY;
    
    const swipeDistance = 100; // pixels
    
    switch (direction) {
      case 'left':
        startX = centerX + swipeDistance / 2;
        endX = centerX - swipeDistance / 2;
        break;
      case 'right':
        startX = centerX - swipeDistance / 2;
        endX = centerX + swipeDistance / 2;
        break;
      case 'up':
        startY = centerY + swipeDistance / 2;
        endY = centerY - swipeDistance / 2;
        break;
      case 'down':
        startY = centerY - swipeDistance / 2;
        endY = centerY + swipeDistance / 2;
        break;
    }
    
    await page.touchscreen.tap(startX, startY);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();
  }
  
  async function simulateLongPress(page: Page) {
    const container = await page.locator('.bg-muted:has-text("Long Press Detection")').first();
    const boundingBox = await container.boundingBox();
    
    if (!boundingBox) {
      throw new Error('Cannot find long press container');
    }
    
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;
    
    await page.touchscreen.tap(centerX, centerY);
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.waitForTimeout(600); // Wait longer than the 500ms threshold
    await page.mouse.up();
  }
  
  async function simulateDoubleTap(page: Page) {
    const container = await page.locator('.bg-muted:has-text("Double Tap Counter")').first();
    const boundingBox = await container.boundingBox();
    
    if (!boundingBox) {
      throw new Error('Cannot find double tap container');
    }
    
    const centerX = boundingBox.x + boundingBox.width / 2;
    const centerY = boundingBox.y + boundingBox.height / 2;
    
    // First tap
    await page.touchscreen.tap(centerX, centerY);
    await page.waitForTimeout(100);
    
    // Second tap
    await page.touchscreen.tap(centerX, centerY);
  }

  test('should render touch interaction examples correctly', async ({ page }) => {
    // Navigate to the touch examples page
    await page.goto(`http://localhost:3000${touchExampleRoute}`);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: `visual-test-results/touch-interaction-initial.png`,
      fullPage: true 
    });
    
    // Check if the page loaded correctly
    await expect(page.locator('h1:has-text("Touch-Friendly Interactions")')).toBeVisible();
    
    // Check for all the touch interaction examples
    await expect(page.locator('text=Swipe Gestures')).toBeVisible();
    await expect(page.locator('text=Pinch to Zoom')).toBeVisible();
    await expect(page.locator('text=Long Press')).toBeVisible();
    await expect(page.locator('text=Double Tap')).toBeVisible();
    await expect(page.locator('text=Combined Touch Interactions')).toBeVisible();
  });

  test('should respond to touch interactions on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to the page
    await page.goto(`http://localhost:3000${touchExampleRoute}`);
    await page.waitForLoadState('networkidle');
    
    // Take before-interaction screenshot
    await page.screenshot({ 
      path: `visual-test-results/touch-interaction-mobile-before.png`,
      fullPage: false 
    });
    
    // Test swipe gesture (left)
    await simulateSwipe(page, 'left');
    await page.waitForTimeout(500); // Wait for animation
    
    // Check if swipe was detected
    await expect(page.locator('text=Swiped left')).toBeVisible({ timeout: 2000 });
    
    // Take after-swipe screenshot
    await page.screenshot({ 
      path: `visual-test-results/touch-interaction-mobile-after-swipe.png`,
      fullPage: false 
    });
    
    // Test long press
    await simulateLongPress(page);
    await page.waitForTimeout(500); // Wait for animation
    
    // Take after-long-press screenshot
    await page.screenshot({ 
      path: `visual-test-results/touch-interaction-mobile-after-longpress.png`,
      fullPage: false 
    });
    
    // Test double tap
    await simulateDoubleTap(page);
    await page.waitForTimeout(500); // Wait for UI update
    
    // Take after-double-tap screenshot
    await page.screenshot({ 
      path: `visual-test-results/touch-interaction-mobile-after-doubletap.png`,
      fullPage: false 
    });
    
    // Reset all examples
    await page.locator('button:has-text("Reset All Examples")').click();
    await page.waitForTimeout(500);
    
    // Take final screenshot
    await page.screenshot({ 
      path: `visual-test-results/touch-interaction-mobile-reset.png`,
      fullPage: false 
    });
  });
}); 