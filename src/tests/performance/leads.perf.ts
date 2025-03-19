import { test, expect, Page } from '@playwright/test';
import { PERFORMANCE_CONFIG } from './performance-config';
import { authenticate } from '../e2e/setup';
import { measureCoreWebVitals, generatePerformanceReport } from './perf-utils';

test.describe('Leads Page Performance Tests', () => {
  let metrics: any;

  // Test leads list load performance
  test('should load leads list with acceptable performance', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize(PERFORMANCE_CONFIG.devices.desktop.viewport);
    
    // Apply network throttling
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', 
      PERFORMANCE_CONFIG.networkConditions['Fast 3G']);
    
    // Authenticate and navigate to leads page
    await authenticate(page);
    
    // Start performance measurement
    metrics = await measureCoreWebVitals(page, async () => {
      await page.goto('/leads');
      await page.waitForSelector('[data-testid="leads-table"]');
    });
    
    // Assert performance metrics against thresholds
    expect(metrics.FCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.FCP);
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.LCP);
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_CONFIG.thresholds.CLS);
    
    // Generate and save performance report
    await generatePerformanceReport(page, metrics, 'leads-list-desktop');
  });

  // Test leads filtering performance
  test('should perform filtering with acceptable performance', async ({ page }) => {
    // Authenticate and navigate to leads page
    await authenticate(page);
    await page.goto('/leads');
    await page.waitForSelector('[data-testid="leads-table"]');
    
    // Ensure page is fully loaded
    await page.waitForLoadState('networkidle');
    
    // Measure filter performance
    const filterStart = Date.now();
    
    // Apply a status filter
    await page.click('[data-testid="filter-button"]');
    await page.click('[data-testid="status-filter"]');
    await page.click('text=New Lead');
    await page.click('[data-testid="apply-filter"]');
    
    // Wait for filtering to complete
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
    
    const filterEnd = Date.now();
    const filterDuration = filterEnd - filterStart;
    
    // Filter operation should complete within 2 seconds
    expect(filterDuration).toBeLessThan(2000);
    
    // Verify filter was applied correctly
    await expect(page.locator('[data-testid="active-filter-badge"]:has-text("New Lead")')).toBeVisible();
  });

  // Test leads search performance
  test('should perform search with acceptable performance', async ({ page }) => {
    // Authenticate and navigate to leads page
    await authenticate(page);
    await page.goto('/leads');
    await page.waitForSelector('[data-testid="leads-table"]');
    
    // Ensure page is fully loaded
    await page.waitForLoadState('networkidle');
    
    // Measure search performance
    const searchStart = Date.now();
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'Smith');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Wait for search to complete
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="loading-indicator"]', { state: 'hidden' });
    
    const searchEnd = Date.now();
    const searchDuration = searchEnd - searchStart;
    
    // Search operation should complete within 2 seconds
    expect(searchDuration).toBeLessThan(2000);
  });

  // Test leads page performance on mobile
  test('should perform well on mobile devices', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize(PERFORMANCE_CONFIG.devices.mobile.viewport);
    
    // Apply mobile network conditions
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', 
      PERFORMANCE_CONFIG.networkConditions['Slow 3G']);
    
    // Apply CPU throttling for mobile
    await client.send('Emulation.setCPUThrottlingRate', 
      { rate: PERFORMANCE_CONFIG.devices.mobile.throttling.cpu });
    
    // Authenticate and navigate to leads page
    await authenticate(page);
    
    // Start performance measurement
    metrics = await measureCoreWebVitals(page, async () => {
      await page.goto('/leads');
      await page.waitForSelector('[data-testid="mobile-leads-list"]');
    });
    
    // Mobile thresholds can be slightly higher
    const mobileThresholdMultiplier = 1.5;
    
    // Assert performance metrics against mobile thresholds
    expect(metrics.FCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.FCP * mobileThresholdMultiplier);
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.LCP * mobileThresholdMultiplier);
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_CONFIG.thresholds.CLS);
    
    // Generate and save performance report
    await generatePerformanceReport(page, metrics, 'leads-list-mobile');
  });

  // Test lead detail page load performance
  test('should load lead details with acceptable performance', async ({ page }) => {
    // Authenticate and navigate to leads page
    await authenticate(page);
    await page.goto('/leads');
    await page.waitForSelector('[data-testid="leads-table"]');
    
    // Navigate to the first lead in the list
    await page.click('[data-testid="lead-row"]');
    
    // Start performance measurement for lead detail page
    metrics = await measureCoreWebVitals(page, async () => {
      // Wait for lead details to load
      await page.waitForSelector('[data-testid="lead-details"]');
    });
    
    // Assert performance metrics for lead detail page
    expect(metrics.FCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.FCP);
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.LCP);
    
    // Generate and save performance report
    await generatePerformanceReport(page, metrics, 'lead-details');
  });
}); 