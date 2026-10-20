import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', workers: 1, retries: 0, timeout: 30000,
  reporter: [['list']],
  use: { channel: 'msedge', headless: true, viewport: { width: 1440, height: 1000 }, baseURL: 'http://127.0.0.1:5176', screenshot: 'only-on-failure', launchOptions: { chromiumSandbox: true } },
  webServer: { command: 'npm run preview --workspace @skilltree/web -- --port 5176', url: 'http://127.0.0.1:5176', reuseExistingServer: false, timeout: 30000 }
});
