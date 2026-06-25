import { test, expect } from '@playwright/test';
import { goto } from './helpers';

const PAGES = ['/', '/blog/', '/about/', '/projects/'];

test.describe('设计 Token 一致性', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  for (const path of PAGES) {
    test(`${path} 应该应用复古文艺字体`, async ({ page: p }) => {
      await goto(p, path);
      const fontFamily = await p.locator('body').evaluate(el =>
        getComputedStyle(el).getPropertyValue('--font-serif').trim()
      );
      expect(fontFamily).toContain('Lora');
    });

    test(`${path} 应该正确应用暖色羊皮纸配色`, async ({ page: p }) => {
      await goto(p, path);
      await expect(p.locator('body')).toHaveCSS('background-color', 'rgb(245, 240, 232)');
      await expect(p.locator('body')).toHaveCSS('color', 'rgb(61, 50, 41)');
    });
  }

  test('暗色模式应该切换全部设计 token', async ({ page: p }) => {
    await goto(p, '/');
    await p.locator('[data-component="DarkModeToggle"]').click();

    await expect(p.locator('body')).toHaveCSS('background-color', 'rgb(26, 22, 18)');
    await expect(p.locator('body')).toHaveCSS('color', 'rgb(212, 201, 184)');
  });

  test('标题应该使用正确的 CSS 变量', async ({ page: p }) => {
    await goto(p, '/');
    const displayFont = await p.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim()
    );
    expect(displayFont).toContain('Playfair Display');
  });

  test('文章内容区域应该有正确的最大宽度', async ({ page: p }) => {
    await goto(p, '/blog/hello-world.mdx/');
    const prose = p.locator('.prose');
    await expect(prose).toHaveCSS('max-width', '672px');
  });
});
