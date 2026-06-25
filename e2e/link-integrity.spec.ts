import { test, expect } from '@playwright/test';
import { goto, BASE } from './helpers';

test.describe('链接完整性', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  test('首页所有内部链接应该返回 200', async ({ page: p, request }) => {
    await goto(p, '/');
    const links = await p.locator('a[href^="/"]').all();
    const hrefs = new Set<string>();

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.add(href);
    }

    for (const href of hrefs) {
      const fullUrl = href.startsWith(BASE) ? href : `${BASE}${href}`;
      const res = await request.get(fullUrl);
      expect(res.status(), `链接 ${href} 应该返回 200`).toBeLessThan(400);
    }
  });

  test('博客列表页所有文章链接应该可达', async ({ page: p, request }) => {
    await goto(p, '/blog/');
    const links = await p.locator('.article-card a').all();

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) {
        const fullUrl = href.startsWith(BASE) ? href : `${BASE}${href}`;
        const res = await request.get(fullUrl);
        expect(res.status(), `文章链接 ${href} 应该返回 200`).toBeLessThan(400);
      }
    }
  });

  test('RSS 链接应该在页面中可发现', async ({ page: p }) => {
    await goto(p, '/');
    const rssLink = p.locator('link[rel="alternate"][type="application/rss+xml"]');
    await expect(rssLink).toHaveCount(1);
  });
});
