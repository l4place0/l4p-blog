import { test, expect } from '@playwright/test';
import { goto } from './helpers';

test.describe('搜索', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  test('应该点击搜索按钮打开搜索弹窗', async ({ page: p }) => {
    await goto(p, '/');
    const trigger = p.locator('[data-component="SearchDialog"]');
    const dialog = p.locator('#search-dialog');

    await expect(dialog).not.toBeVisible();
    await trigger.click();
    await expect(dialog).toBeVisible();
  });

  test('应该点击关闭按钮关闭弹窗', async ({ page: p }) => {
    await goto(p, '/');
    await p.locator('[data-component="SearchDialog"]').click();
    const dialog = p.locator('#search-dialog');
    await expect(dialog).toBeVisible();

    await p.locator('#search-close').click();
    await expect(dialog).not.toBeVisible();
  });

  test('应该输入关键词显示搜索结果', async ({ page: p }) => {
    await goto(p, '/');
    await p.locator('[data-component="SearchDialog"]').click();

    await p.locator('#search-input').fill('astro');
    await p.waitForFunction(() => {
      const results = document.getElementById('search-results');
      return results && results.children.length > 0;
    }, { timeout: 10000 });

    const results = p.locator('#search-results');
    await expect(results).not.toBeEmpty();
  });
});
