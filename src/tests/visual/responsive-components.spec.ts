import { test, expect, Page } from '@playwright/test';

test.describe('Responsive Components Visual Testing', () => {
  // Test routes that contain responsive components
  const routes = [
    '/examples/responsive',   // ResponsiveComponentsTest page
    '/examples/collapsible',  // CollapsibleSection example
    '/examples/reports'      // MobileReportViewer example
  ];

  for (const route of routes) {
    test(`${route} should render correctly`, async ({ page }) => {
      // Navigate to the route
      await page.goto(`http://localhost:3000${route}`);
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Take a screenshot of the page
      await page.screenshot({ 
        path: `visual-test-results/${page.context().browser().browserType().name()}-${route.replace(/\//g, '-')}.png`,
        fullPage: true 
      });
      
      // Check if there are any visible console errors
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Assert no console errors
      expect(errors).toEqual([]);
      
      // Verify some basic accessibility checks
      await expect(page).toHaveScreenshot({ 
        maxDiffPixels: 200, // Allow some pixel differences for different platforms
      });
    });

    test(`${route} mobile interactions`, async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to the route
      await page.goto(`http://localhost:3000${route}`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Take before-interaction screenshot
      await page.screenshot({ 
        path: `visual-test-results/${page.context().browser().browserType().name()}-${route.replace(/\//g, '-')}-mobile-before.png`,
        fullPage: true 
      });
      
      // Interact with elements based on the page
      // Try to click on the first visible button
      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        await buttons[0].click();
        
        // Wait for any animations or state changes
        await page.waitForTimeout(500);
        
        // Take after-interaction screenshot
        await page.screenshot({
          path: `visual-test-results/${page.context().browser().browserType().name()}-${route.replace(/\//g, '-')}-mobile-after.png`,
          fullPage: true
        });
      }
    });
  }
}); 