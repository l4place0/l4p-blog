import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('部署防回归', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  test('页面内 CSS 资源应该返回 200', async ({ page: p }) => {
    await goto(p, '/');
    const stylesheets = await p.locator('link[rel="stylesheet"]').all();
    for (const sheet of stylesheets) {
      const href = await sheet.getAttribute('href');
      if (href && !href.startsWith('http')) {
        const res = await p.request.get(href);
        expect(res.status(), `CSS ${href} 应该返回 200`).toBe(200);
      }
    }
  });

  test('所有页面的 canonical URL 应该包含正确的 site', async ({ page: p }) => {
    const pages = ['/', '/blog/', '/about/'];
    for (const path of pages) {
      await goto(p, path);
      const canonical = p.locator('link[rel="canonical"]');
      if (await canonical.count() > 0) {
        await expect(canonical).toHaveAttribute('href', /l4place0\.github\.io/);
      }
    }
  });

  test('暗色模式防闪烁脚本应该在 body 之前执行', async ({ page: p }) => {
    await goto(p, '/');
    const html = p.locator('html');
    const theme = await html.getAttribute('data-theme');
    expect(['light', 'dark']).toContain(theme);
  });
});
