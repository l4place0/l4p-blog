import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4321/l4p-blog/',
    locale: 'zh-CN',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npx pagefind --site dist && npm run preview',
    port: 4321,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
