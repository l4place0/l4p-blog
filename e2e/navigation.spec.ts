import { test, expect } from '@playwright/test';
import { page, BASE } from './helpers';

test.describe('导航', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  test('应该高亮当前页面的导航链接', async ({ page: p }) => {
    await p.goto(page('/blog/'));
    await p.waitForLoadState('domcontentloaded');
    // 检查导航中"文章"链接的 href 包含 /blog
    const blogLink = p.locator('.nav-link', { hasText: '文章' });
    await expect(blogLink).toHaveAttribute('href', /\/blog/);
  });

  test('应该点击导航链接跳转到对应页面', async ({ page: p }) => {
    await p.goto(page('/'));
    await p.waitForLoadState('domcontentloaded');
    await p.locator('.nav-link', { hasText: '文章' }).click();
    await p.waitForLoadState('domcontentloaded');
    await expect(p).toHaveURL(/\/blog/);
  });

  test('应该点击 Logo 回到首页', async ({ page: p }) => {
    await p.goto(page('/blog/'));
    await p.waitForLoadState('domcontentloaded');
    await p.locator('.site-logo').click();
    await p.waitForLoadState('domcontentloaded');
    await expect(p).toHaveURL(new RegExp(`${BASE}/?$`));
  });
});
