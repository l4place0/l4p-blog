import { describe, it, expect } from 'vitest';
import config from './blog.config';
import { blogSchema } from './src/content/schemas';

describe('blog.config 全局配置', () => {
  it('应导出 author 字段', () => {
    expect(config.author).toBeDefined();
    expect(typeof config.author).toBe('string');
  });

  it('author 应为 l4p', () => {
    expect(config.author).toBe('l4p');
  });

  it('应导出 lang 字段', () => {
    expect(config.lang).toBeDefined();
    expect(['zh', 'en']).toContain(config.lang);
  });

  it('lang 应为 zh', () => {
    expect(config.lang).toBe('zh');
  });

  it('应导出 postsPerPage 字段', () => {
    expect(config.postsPerPage).toBeDefined();
    expect(typeof config.postsPerPage).toBe('number');
    expect(config.postsPerPage).toBeGreaterThan(0);
  });

  it('postsPerPage 应为 10', () => {
    expect(config.postsPerPage).toBe(10);
  });

  it('配置应为 readonly (as const)', () => {
    expect(typeof config).toBe('object');
  });
});

describe('schema 默认值传播', () => {
  /** 只提供必填字段，让可选/default 字段走默认值 */
  const requiredFields = {
    title: 'Test Post',
    description: 'A test description',
    pubDate: new Date('2025-01-01'),
    category: '技术' as const,
  };

  it('blogSchema 的 author 默认值应等于 config.author', () => {
    const parsed = blogSchema.parse(requiredFields);
    expect(parsed.author).toBe(config.author);
  });

  it('blogSchema 的 lang 默认值应等于 config.lang', () => {
    const parsed = blogSchema.parse(requiredFields);
    expect(parsed.lang).toBe(config.lang);
  });

  it('blogSchema 的 tags 默认值应为空数组', () => {
    const parsed = blogSchema.parse(requiredFields);
    expect(parsed.tags).toEqual([]);
  });

  it('blogSchema 的 featured 默认值应为 false', () => {
    const parsed = blogSchema.parse(requiredFields);
    expect(parsed.featured).toBe(false);
  });

  it('blogSchema 的 draft 默认值应为 false', () => {
    const parsed = blogSchema.parse(requiredFields);
    expect(parsed.draft).toBe(false);
  });
});
