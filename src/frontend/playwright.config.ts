import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5175', channel: 'chrome', headless: true, reducedMotion: 'reduce' },
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: true },
});
