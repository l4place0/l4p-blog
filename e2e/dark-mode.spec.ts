import { test, expect } from '@playwright/test';
import { page } from './helpers';

test.describe('暗色模式', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  test('应该点击按钮切换暗色/亮色模式', async ({ page: p }) => {
    await p.goto(page('/'));
    await p.waitForLoadState('domcontentloaded');
    const html = p.locator('html');
    const toggle = p.locator('[data-component="DarkModeToggle"]');

    await expect(html).toHaveAttribute('data-theme', 'light');

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('应该刷新后保持暗色模式偏好', async ({ page: p }) => {
    await p.goto(page('/'));
    await p.waitForLoadState('domcontentloaded');
    const toggle = p.locator('[data-component="DarkModeToggle"]');

    await toggle.click();
    await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark');

    await p.reload();
    await p.waitForLoadState('domcontentloaded');
    await expect(p.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('暗色模式应该改变背景色', async ({ page: p }) => {
    await p.goto(page('/'));
    await p.waitForLoadState('domcontentloaded');
    const toggle = p.locator('[data-component="DarkModeToggle"]');

    // 亮色模式
    await expect(p.locator('body')).toHaveCSS('background-color', 'rgb(245, 240, 232)');

    // 切换到暗色
    await toggle.click();
    await expect(p.locator('body')).toHaveCSS('background-color', 'rgb(26, 22, 18)');
  });
});
