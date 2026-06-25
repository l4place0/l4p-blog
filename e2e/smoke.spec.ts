import { test, expect } from '@playwright/test';

const LIVE_URL = 'https://l4place0.github.io/l4p-blog';

test.describe('线上冒烟测试', () => {
  test.use({ baseURL: LIVE_URL });

  test('首页应该返回 200', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
  });

  test('CSS 资源应该加载成功', async ({ request }) => {
    const res = await request.get('/');
    const html = await res.text();
    const cssMatch = html.match(/href="(\/l4p-blog\/_astro\/[^"]+\.css)"/);
    expect(cssMatch).toBeTruthy();
    const cssRes = await request.get(cssMatch![1]);
    expect(cssRes.status()).toBe(200);
  });

  test('博客文章应该可达', async ({ request }) => {
    const res = await request.get('/blog/hello-world.mdx/');
    expect(res.status()).toBe(200);
  });

  test('RSS 应该有效', async ({ request }) => {
    const res = await request.get('/rss.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<channel>');
  });

  test('暗色模式脚本应该存在', async ({ request }) => {
    const res = await request.get('/');
    const html = await res.text();
    expect(html).toContain('data-theme');
  });
});
