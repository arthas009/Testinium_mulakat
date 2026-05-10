// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/** Folder name for this test run: e.g. "2026-05-10_18-35-17" */
const runTimestamp = new Date()
  .toISOString()
  .slice(0, 19)       // "2026-05-10T18:35:17"
  .replace('T', '_')  // "2026-05-10_18:35:17"
  .replaceAll(':', '-'); // "2026-05-10_18-35-17"

module.exports = defineConfig({
  testDir: './specs',
  timeout: 90000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,

  reporter: [
    ['html', { outputFolder: './playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    headless: false,
    viewport: { width: 1440, height: 900 },
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    actionTimeout: 20000,
    navigationTimeout: 30000,
    locale: 'tr-TR',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: `./test-results/${runTimestamp}`,
});
