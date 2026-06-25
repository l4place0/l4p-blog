import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('文章目录', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  test('应该在长文章中显示目录', async ({ page: p }) => {
    await goto(p, '/blog/hello-world.mdx/');
    const toc = p.locator('[data-component="TableOfContents"]');
    await expect(toc).toBeVisible();
  });

  test('应该目录默认展开', async ({ page: p }) => {
    await goto(p, '/blog/hello-world.mdx/');
    const details = p.locator('.toc-details');
    await expect(details).toHaveAttribute('open', '');
  });

  test('应该点击目录标题折叠/展开', async ({ page: p }) => {
    await goto(p, '/blog/hello-world.mdx/');
    const details = p.locator('.toc-details');
    const summary = p.locator('.toc-summary');

    await summary.click();
    await expect(details).not.toHaveAttribute('open', '');

    await summary.click();
    await expect(details).toHaveAttribute('open', '');
  });
});
