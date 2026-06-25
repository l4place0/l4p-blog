import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const DIST = resolve(process.cwd(), 'dist');

describe('构建产物完整性', () => {
  it('dist 目录应该存在', () => {
    expect(existsSync(DIST)).toBe(true);
  });

  it('应该包含 .nojekyll 文件', () => {
    expect(existsSync(resolve(DIST, '.nojekyll'))).toBe(true);
  });

  it('应该生成 index.html', () => {
    expect(existsSync(resolve(DIST, 'index.html'))).toBe(true);
  });

  it('应该生成 sitemap', () => {
    expect(existsSync(resolve(DIST, 'sitemap-index.xml'))).toBe(true);
  });

  it('应该生成 RSS', () => {
    const rssPath = resolve(DIST, 'rss.xml');
    expect(existsSync(rssPath)).toBe(true);
    const content = readFileSync(rssPath, 'utf-8');
    expect(content).toContain('<channel>');
  });

  it('应该生成博客列表页', () => {
    expect(existsSync(resolve(DIST, 'blog/index.html'))).toBe(true);
  });

  it('应该生成关于页面', () => {
    expect(existsSync(resolve(DIST, 'about/index.html'))).toBe(true);
  });

  it('应该生成作品集页面', () => {
    expect(existsSync(resolve(DIST, 'projects/index.html'))).toBe(true);
  });

  it('应该生成搜索页面', () => {
    expect(existsSync(resolve(DIST, 'search/index.html'))).toBe(true);
  });

  it('应该生成 404 页面', () => {
    expect(existsSync(resolve(DIST, '404.html'))).toBe(true);
  });

  it('应该 CSS 资源路径包含 base 前缀', () => {
    const html = readFileSync(resolve(DIST, 'index.html'), 'utf-8');
    expect(html).toContain('/l4p-blog/_astro/');
  });

  it('应该 Pagefind 索引已生成', () => {
    expect(existsSync(resolve(DIST, 'pagefind/pagefind.js'))).toBe(true);
  });
});
