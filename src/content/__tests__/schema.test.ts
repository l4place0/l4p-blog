import { describe, it, expect } from 'vitest';
import { blogSchema, projectsSchema } from '../schemas';

describe('blog schema', () => {
  const validBlogPost = {
    title: '测试文章',
    description: '这是一篇测试文章的描述',
    pubDate: new Date('2026-06-25'),
    category: '技术',
    tags: ['astro', '博客'],
    featured: false,
    draft: false,
    author: 'l4p',
    lang: 'zh',
  };

  it('应该接受合法的 blog frontmatter', () => {
    const result = blogSchema.safeParse(validBlogPost);
    expect(result.success).toBe(true);
  });

  it('应该拒绝缺少 title 的 frontmatter', () => {
    const { title, ...noTitle } = validBlogPost;
    const result = blogSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('应该拒绝缺少 description 的 frontmatter', () => {
    const { description, ...noDesc } = validBlogPost;
    const result = blogSchema.safeParse(noDesc);
    expect(result.success).toBe(false);
  });

  it('应该拒绝非法 category 值', () => {
    const result = blogSchema.safeParse({ ...validBlogPost, category: '不存在的分类' });
    expect(result.success).toBe(false);
  });

  it('应该为可选字段提供默认值', () => {
    const minimal = {
      title: '最小文章',
      description: '描述',
      pubDate: new Date('2026-06-25'),
      category: '随笔',
    };
    const result = blogSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.featured).toBe(false);
      expect(result.data.draft).toBe(false);
      expect(result.data.author).toBe('l4p');
      expect(result.data.lang).toBe('zh');
    }
  });

  it('应该接受合法的 category 枚举值', () => {
    const categories = ['随笔', '技术', '读书', '生活', '设计'];
    for (const category of categories) {
      const result = blogSchema.safeParse({ ...validBlogPost, category });
      expect(result.success).toBe(true);
    }
  });

  it('应该接受合法的 lang 枚举值', () => {
    for (const lang of ['zh', 'en']) {
      const result = blogSchema.safeParse({ ...validBlogPost, lang });
      expect(result.success).toBe(true);
    }
  });
});

describe('projects schema', () => {
  const validProject = {
    title: '测试项目',
    description: '一个测试项目的描述',
    pubDate: new Date('2026-06-25'),
    tech: ['TypeScript', 'Astro'],
    featured: false,
    status: 'active',
  };

  it('应该接受合法的 project frontmatter', () => {
    const result = projectsSchema.safeParse(validProject);
    expect(result.success).toBe(true);
  });

  it('应该拒绝缺少 title 的 frontmatter', () => {
    const { title, ...noTitle } = validProject;
    const result = projectsSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('应该为可选字段提供默认值', () => {
    const minimal = {
      title: '最小项目',
      description: '描述',
      pubDate: new Date('2026-06-25'),
    };
    const result = projectsSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tech).toEqual([]);
      expect(result.data.featured).toBe(false);
      expect(result.data.status).toBe('active');
    }
  });

  it('应该接受合法的 status 枚举值', () => {
    for (const status of ['active', 'archived', 'wip']) {
      const result = projectsSchema.safeParse({ ...validProject, status });
      expect(result.success).toBe(true);
    }
  });

  it('应该拒绝非法的 status 值', () => {
    const result = projectsSchema.safeParse({ ...validProject, status: 'invalid' });
    expect(result.success).toBe(false);
  });
});
