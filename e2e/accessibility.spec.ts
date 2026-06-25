import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { page } from './helpers';

const PAGES = ['/', '/blog/', '/about/', '/projects/'];

test.describe('可访问性', () => {
  test.beforeEach(async ({ page: p }) => {
    await p.emulateMedia({ colorScheme: 'light' });
  });

  for (const path of PAGES) {
    test(`${path} 应该无严重 WCAG 违规`, async ({ page: p }) => {
      await p.goto(page(path));
      await p.waitForLoadState('domcontentloaded');
      const results = await new AxeBuilder({ page: p })
        .disableRules(['color-contrast', 'link-in-text-block'])
        .analyze();

      expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0);
    });
  }

  test('应该所有图片有 alt 属性', async ({ page: p }) => {
    await p.goto(page('/'));
    await p.waitForLoadState('domcontentloaded');
    const images = p.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt');
    }
  });

  test('应该按钮有可访问名称', async ({ page: p }) => {
    await p.goto(page('/'));
    await p.waitForLoadState('domcontentloaded');
    const buttons = p.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const ariaLabel = await btn.getAttribute('aria-label');
      const text = await btn.textContent();
      // 至少有 aria-label 或文字内容
      expect(ariaLabel || text?.trim() || '').not.toBe('');
    }
  });
});
