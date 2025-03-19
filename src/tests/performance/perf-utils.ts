import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for Core Web Vitals metrics
 */
export interface CoreWebVitals {
  FCP: number;  // First Contentful Paint in ms
  LCP: number;  // Largest Contentful Paint in ms
  CLS: number;  // Cumulative Layout Shift score
  FID?: number; // First Input Delay in ms (requires user interaction)
  TTI?: number; // Time to Interactive in ms
  TBT?: number; // Total Blocking Time in ms
  TTFB: number; // Time to First Byte in ms
}

// Additional type definitions for performance entries
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

/**
 * Measures Core Web Vitals during the execution of a callback
 * @param page Playwright page object
 * @param callback Function to execute during measurement
 * @returns Object containing Core Web Vitals metrics
 */
export async function measureCoreWebVitals(
  page: Page, 
  callback: () => Promise<void>
): Promise<CoreWebVitals> {
  // Inject performance measurement script
  await injectPerformanceObserver(page);
  
  // Record navigation start time
  const navigationStart = Date.now();
  
  // Execute the callback (navigation, interaction, etc.)
  await callback();
  
  // Get performance metrics from page
  const metrics = await collectPerformanceMetrics(page);
  
  // Calculate TTFB based on navigation time
  const responseStart = await page.evaluate(() => {
    return performance.timing.responseStart - performance.timing.navigationStart;
  });
  
  // Return combined metrics
  return {
    FCP: metrics.firstContentfulPaint,
    LCP: metrics.largestContentfulPaint,
    CLS: metrics.cumulativeLayoutShift,
    FID: metrics.firstInputDelay,
    TTI: metrics.timeToInteractive,
    TBT: metrics.totalBlockingTime,
    TTFB: responseStart
  };
}

/**
 * Injects Performance Observer scripts into the page
 * @param page Playwright page object
 */
async function injectPerformanceObserver(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Create a global object to store metrics
    window._performanceMetrics = {
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      timeToInteractive: 0,
      totalBlockingTime: 0
    };
    
    // Observe First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window._performanceMetrics.firstContentfulPaint = entry.startTime;
        }
      }
    }).observe({ type: 'paint', buffered: true });
    
    // Observe Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      window._performanceMetrics.largestContentfulPaint = lastEntry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // Observe Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let cumulativeLayoutShift = 0;
      for (const entry of entryList.getEntries()) {
        // Cast to expected layout shift entry type
        const layoutShiftEntry = entry as unknown as { value: number, hadRecentInput: boolean };
        if (!layoutShiftEntry.hadRecentInput) {
          cumulativeLayoutShift += layoutShiftEntry.value;
        }
      }
      window._performanceMetrics.cumulativeLayoutShift = cumulativeLayoutShift;
    }).observe({ type: 'layout-shift', buffered: true });
    
    // Observe First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        // Cast to expected first input entry type
        const firstInputEntry = entry as unknown as { processingStart: number, startTime: number };
        window._performanceMetrics.firstInputDelay = firstInputEntry.processingStart - firstInputEntry.startTime;
        break; // Only use the first input
      }
    }).observe({ type: 'first-input', buffered: true });
  });
}

/**
 * Collects performance metrics from the page
 * @param page Playwright page object
 * @returns Object containing performance metrics
 */
async function collectPerformanceMetrics(page: Page): Promise<any> {
  return await page.evaluate(() => {
    return window._performanceMetrics;
  });
}

/**
 * Generates a performance report and saves it to disk
 * @param page Playwright page object
 * @param metrics Performance metrics to include in the report
 * @param testName Name of the test for the report filename
 */
export async function generatePerformanceReport(
  page: Page, 
  metrics: CoreWebVitals, 
  testName: string
): Promise<void> {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(process.cwd(), 'performance-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Collect additional page metrics
  const pageMetrics = await page.evaluate(() => {
    return {
      domNodes: document.querySelectorAll('*').length,
      resourceCount: performance.getEntriesByType('resource').length,
      jsEventListeners: window.getEventListeners ? 
        Object.keys(window.getEventListeners(document as unknown as Element)).length : 
        'N/A',
      windowOnHandlers: Object.keys(window).filter(key => key.startsWith('on')).length
    };
  });
  
  // Create report object
  const report = {
    testName,
    timestamp: new Date().toISOString(),
    url: page.url(),
    metrics: {
      coreWebVitals: metrics,
      pageDetails: pageMetrics
    }
  };
  
  // Write report to file
  const reportPath = path.join(reportsDir, `${testName}-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

/**
 * Ensure TypeScript knows about global _performanceMetrics
 */
declare global {
  interface Window {
    _performanceMetrics: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      cumulativeLayoutShift: number;
      firstInputDelay: number;
      timeToInteractive: number;
      totalBlockingTime: number;
    };
    getEventListeners?: (element: Element) => Record<string, any[]>;
  }
} 