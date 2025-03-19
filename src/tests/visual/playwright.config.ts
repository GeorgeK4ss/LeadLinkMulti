import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: '../../visual-test-results/html-report' }],
    ['json', { outputFile: '../../visual-test-results/results.json' }]
  ],
  outputDir: '../../visual-test-results/',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'on-first-retry' : 'off',
  },
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 800 }
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 800 }
      },
    },
    // Tablets
    {
      name: 'iPad Pro',
      use: {
        ...devices['iPad Pro 11'],
      },
    },
    {
      name: 'iPad',
      use: {
        ...devices['iPad (gen 7)'],
      },
    },
    // Mobile devices
    {
      name: 'iPhone 12',
      use: {
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'iPhone SE',
      use: {
        ...devices['iPhone SE'],
      },
    },
    {
      name: 'Galaxy S8',
      use: {
        ...devices['Galaxy S8'],
      },
    },
  ],
};

export default config; 