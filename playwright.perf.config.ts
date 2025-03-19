import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/tests/performance',
  testMatch: '**/*.perf.ts',
  /* Run tests in files in parallel */
  fullyParallel: false, // Run performance tests sequentially for more consistent results
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry performance tests to reduce variance in results */
  retries: process.env.CI ? 1 : 0,
  /* Use a single worker for performance tests */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'performance-reports/results.json' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace but only when a test fails */
    trace: 'on-first-retry',
    
    /* Don't take screenshots by default for performance tests */
    screenshot: 'off',
    
    /* Don't record video for performance tests */
    video: 'off'
  },

  /* Timeout for performance tests */
  timeout: 60000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}); 