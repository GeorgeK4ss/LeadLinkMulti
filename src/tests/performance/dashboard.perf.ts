import { test, expect, Page } from '@playwright/test';
import { PERFORMANCE_CONFIG } from './performance-config';
import { authenticate } from '../e2e/setup';
import { measureCoreWebVitals, generatePerformanceReport } from './perf-utils';

test.describe('Dashboard Performance Tests', () => {
  let metrics: any;

  // Test dashboard load performance on desktop
  test('should load dashboard with acceptable performance on desktop', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize(PERFORMANCE_CONFIG.devices.desktop.viewport);
    
    // Apply network throttling
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', 
      PERFORMANCE_CONFIG.networkConditions['Fast 3G']);
    
    // Apply CPU throttling
    await client.send('Emulation.setCPUThrottlingRate', 
      { rate: PERFORMANCE_CONFIG.devices.desktop.throttling.cpu });

    // Authenticate and navigate to dashboard
    await authenticate(page);
    
    // Start performance measurement
    metrics = await measureCoreWebVitals(page, async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="dashboard-summary"]');
    });
    
    // Assert performance metrics against thresholds
    expect(metrics.FCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.FCP);
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.LCP);
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_CONFIG.thresholds.CLS);
    expect(metrics.TTFB).toBeLessThan(PERFORMANCE_CONFIG.thresholds.TTFB);
    
    // Generate and save performance report
    await generatePerformanceReport(page, metrics, 'dashboard-desktop');
  });

  // Test dashboard load performance on mobile
  test('should load dashboard with acceptable performance on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize(PERFORMANCE_CONFIG.devices.mobile.viewport);
    
    // Apply network throttling
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', 
      PERFORMANCE_CONFIG.networkConditions['Slow 3G']);
    
    // Apply CPU throttling
    await client.send('Emulation.setCPUThrottlingRate', 
      { rate: PERFORMANCE_CONFIG.devices.mobile.throttling.cpu });

    // Authenticate and navigate to dashboard
    await authenticate(page);
    
    // Start performance measurement
    metrics = await measureCoreWebVitals(page, async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="dashboard-summary"]');
    });
    
    // Mobile thresholds can be slightly higher
    const mobileThresholdMultiplier = 1.5;
    
    // Assert performance metrics against thresholds with mobile adjustment
    expect(metrics.FCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.FCP * mobileThresholdMultiplier);
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_CONFIG.thresholds.LCP * mobileThresholdMultiplier);
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_CONFIG.thresholds.CLS);
    expect(metrics.TTFB).toBeLessThan(PERFORMANCE_CONFIG.thresholds.TTFB * mobileThresholdMultiplier);
    
    // Generate and save performance report
    await generatePerformanceReport(page, metrics, 'dashboard-mobile');
  });

  // Test dashboard interaction performance
  test('should have acceptable interaction performance on dashboard', async ({ page }) => {
    // Set viewport to desktop size
    await page.setViewportSize(PERFORMANCE_CONFIG.devices.desktop.viewport);
    
    // Authenticate and navigate to dashboard
    await authenticate(page);
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-summary"]');
    
    // Ensure page is fully loaded
    await page.waitForLoadState('networkidle');
    
    // Measure time to perform common interactions
    const interactionTimes = [];
    
    // Measure filter interaction
    const filterStart = Date.now();
    await page.click('[data-testid="filter-button"]');
    await page.click('[data-testid="date-range-select"]');
    await page.click('text=Last 7 Days');
    await page.click('[data-testid="apply-filter"]');
    await page.waitForSelector('[data-testid="loading-indicator"]');
    await page.waitForSelector('[data-testid="active-filter-badge"]');
    interactionTimes.push(Date.now() - filterStart);
    
    // Measure tab switching
    const tabSwitchStart = Date.now();
    await page.click('button:has-text("Leads")');
    await page.waitForSelector('h2:has-text("Lead Overview")');
    interactionTimes.push(Date.now() - tabSwitchStart);
    
    // Calculate average interaction time
    const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
    
    // Assert interaction time is below threshold
    expect(avgInteractionTime).toBeLessThan(PERFORMANCE_CONFIG.thresholds.FID * 5);
  });

  // Test dashboard resource usage
  test('should use resources efficiently', async ({ page }) => {
    // Authenticate and navigate to dashboard
    await authenticate(page);
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-summary"]');
    
    // Ensure page is fully loaded
    await page.waitForLoadState('networkidle');
    
    // Get resource metrics through CDP
    const client = await page.context().newCDPSession(page);
    const performanceMetrics = await client.send('Performance.getMetrics');
    
    // Extract relevant metrics
    const metricsArray = performanceMetrics.metrics;
    const jsHeapUsage = metricsArray.find((m: {name: string}) => m.name === 'JSHeapUsedSize')?.value || 0;
    const totalDocuments = metricsArray.find((m: {name: string}) => m.name === 'Documents')?.value || 0;
    const nodes = metricsArray.find((m: {name: string}) => m.name === 'Nodes')?.value || 0;
    
    // Assert on resource metrics
    expect(jsHeapUsage).toBeLessThan(50 * 1024 * 1024); // 50MB max heap
    expect(totalDocuments).toBeLessThan(10); // Max 10 documents (main doc + iframes)
    expect(nodes).toBeLessThan(2000); // Max 2000 DOM nodes
  });
}); 