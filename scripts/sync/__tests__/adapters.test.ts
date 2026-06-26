import { describe, it, expect } from 'vitest';
import { zhihuAdapter } from '../adapters/zhihu.js';
import { juejinAdapter } from '../adapters/juejin.js';
import { createMockPost, CONTENT_WITH_JSX, CONTENT_WITH_BARE_CODEBLOCKS } from '../../../src/__tests__/_helpers.js';

// 提取 fixture 中 frontmatter 之后的正文部分（跳过首尾 --- 行）
function stripFixtureFrontmatter(raw: string): string {
  const lines = raw.split('\n');
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (start === -1) {
        start = i;
      } else {
        end = i;
        break;
      }
    }
  }
  if (start !== -1 && end !== -1) {
    return lines.slice(end + 1).join('\n').trim();
  }
  return raw;
}

const JSX_BODY = stripFixtureFrontmatter(CONTENT_WITH_JSX);
const BARE_CB_BODY = stripFixtureFrontmatter(CONTENT_WITH_BARE_CODEBLOCKS);

/* ------------------------------------------------------------------ */
/*  知乎适配器                                                          */
/* ------------------------------------------------------------------ */

describe('知乎适配器 zhihuAdapter', () => {
  describe('transform', () => {
    it('应移除 JSX 自闭合组件标签 <Component />', () => {
      const post = createMockPost({ content: JSX_BODY });
      const result = zhihuAdapter.transform(post);
      expect(result).not.toMatch(/<SomeComponent/);
    });

    it('应移除 JSX 开闭标签对 <Component>...</Component>', () => {
      const post = createMockPost({ content: JSX_BODY });
      const result = zhihuAdapter.transform(post);
      expect(result).not.toMatch(/<Callout/);
      expect(result).not.toMatch(/<\/Callout>/);
    });

    it('应移除 import 语句', () => {
      const post = createMockPost({ content: JSX_BODY });
      const result = zhihuAdapter.transform(post);
      expect(result).not.toMatch(/^import\s+/m);
    });

    it('应保留普通 Markdown 内容', () => {
      const post = createMockPost({ content: JSX_BODY });
      const result = zhihuAdapter.transform(post);
      expect(result).toContain('这是正文。');
      expect(result).toContain('普通段落。');
      expect(result).toContain('```typescript');
    });

    it('应生成知乎格式的 frontmatter（title, description, tags, category）', () => {
      const post = createMockPost({ content: JSX_BODY });
      const result = zhihuAdapter.transform(post);
      expect(result).toMatch(/^---\n/);
      expect(result).toContain('title: "测试文章"');
      expect(result).toContain('description: "这是一篇测试文章"');
      expect(result).toContain("tags: ['test']");
      expect(result).toContain('category: "技术"');
      expect(result).toContain('\n---\n');
    });
  });

  describe('generateMetadata', () => {
    it('应提取 title 和 description', () => {
      const post = createMockPost();
      const meta = zhihuAdapter.generateMetadata(post);
      expect(meta.title).toBe('测试文章');
      expect(meta.description).toBe('这是一篇测试文章');
    });

    it('应提取 tags 数组', () => {
      const post = createMockPost({ frontmatter: { tags: ['astro', 'blog', 'ssg'] } });
      const meta = zhihuAdapter.generateMetadata(post);
      expect(meta.tags).toEqual(['astro', 'blog', 'ssg']);
    });

    it('应映射分类: 技术 -> 技术', () => {
      const post = createMockPost({ frontmatter: { category: '技术' } });
      const meta = zhihuAdapter.generateMetadata(post);
      expect(meta.category).toBe('技术');
    });

    it('应映射分类: 读书 -> 人文', () => {
      const post = createMockPost({ frontmatter: { category: '读书' } });
      const meta = zhihuAdapter.generateMetadata(post);
      expect(meta.category).toBe('人文');
    });

    it('应映射分类: 随笔 -> 生活', () => {
      const post = createMockPost({ frontmatter: { category: '随笔' } });
      const meta = zhihuAdapter.generateMetadata(post);
      expect(meta.category).toBe('生活');
    });

    it('未知分类应 fallback 到 其他', () => {
      const post = createMockPost({ frontmatter: { category: '不存在的分类' } });
      const meta = zhihuAdapter.generateMetadata(post);
      expect(meta.category).toBe('其他');
    });
  });

  describe('outputPath', () => {
    it('应返回 dist-sync/zhihu/{slug}.md 路径', () => {
      const post = createMockPost({ slug: 'my-post' });
      const p = zhihuAdapter.outputPath(post);
      expect(p).toMatch(/dist-sync\/zhihu\/my-post\.md$/);
    });
  });
});

/* ------------------------------------------------------------------ */
/*  掘金适配器                                                          */
/* ------------------------------------------------------------------ */

describe('掘金适配器 juejinAdapter', () => {
  describe('transform', () => {
    it('应移除 JSX 组件（同知乎）', () => {
      const post = createMockPost({ content: JSX_BODY });
      const result = juejinAdapter.transform(post);
      expect(result).not.toMatch(/<SomeComponent/);
      expect(result).not.toMatch(/<Callout/);
      expect(result).not.toMatch(/^import\s+/m);
    });

    it('应为无语言标识的代码块添加 text', () => {
      const post = createMockPost({ content: BARE_CB_BODY });
      const result = juejinAdapter.transform(post);
      expect(result).toContain('```text');
    });

    it('不应修改已有语言标识的代码块', () => {
      const post = createMockPost({ content: BARE_CB_BODY });
      const result = juejinAdapter.transform(post);
      expect(result).toContain('```python');
    });

    it('应生成掘金格式的 frontmatter（theme, tags, categories, public）', () => {
      const post = createMockPost({ content: BARE_CB_BODY });
      const result = juejinAdapter.transform(post);
      expect(result).toMatch(/^---\n/);
      expect(result).toContain('theme: "smart"');
      expect(result).toContain("tags: ['test']");
      expect(result).toContain("categories: ['后端']");
      expect(result).toContain('public: true');
      expect(result).toContain('\n---\n');
    });
  });

  describe('generateMetadata', () => {
    it('应设置 theme: smart', () => {
      const post = createMockPost();
      const meta = juejinAdapter.generateMetadata(post);
      expect(meta.theme).toBe('smart');
    });

    it('应截断 tags 到最多 3 个', () => {
      const post = createMockPost({ frontmatter: { tags: ['a', 'b', 'c', 'd', 'e'] } });
      const meta = juejinAdapter.generateMetadata(post);
      expect(meta.tags).toHaveLength(3);
      expect(meta.tags).toEqual(['a', 'b', 'c']);
    });

    it('应设置 public: true', () => {
      const post = createMockPost();
      const meta = juejinAdapter.generateMetadata(post);
      expect(meta.public).toBe(true);
    });

    it('应映射分类: 技术 -> 后端', () => {
      const post = createMockPost({ frontmatter: { category: '技术' } });
      const meta = juejinAdapter.generateMetadata(post);
      expect(meta.categories).toEqual(['后端']);
    });

    it('应映射分类: 设计 -> 前端', () => {
      const post = createMockPost({ frontmatter: { category: '设计' } });
      const meta = juejinAdapter.generateMetadata(post);
      expect(meta.categories).toEqual(['前端']);
    });
  });

  describe('outputPath', () => {
    it('应返回 dist-sync/juejin/{slug}.md 路径', () => {
      const post = createMockPost({ slug: 'my-post' });
      const p = juejinAdapter.outputPath(post);
      expect(p).toMatch(/dist-sync\/juejin\/my-post\.md$/);
    });
  });
});
