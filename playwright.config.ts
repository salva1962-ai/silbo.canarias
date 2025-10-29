import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { outputFolder: 'e2e-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
    command: 'npm run dev -- --host',
    url: 'http://127.0.0.1:5173',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI
  }
})
