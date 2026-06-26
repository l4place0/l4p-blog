import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs 模块避免真实文件 I/O
vi.mock('fs', () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock 同步状态管理模块
vi.mock('../formatters/frontmatter.js', () => ({
  isSynced: vi.fn(),
  markSynced: vi.fn(),
  getSyncStatus: vi.fn(),
}));

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { getPosts, runSync, generateManifest } from '../core.js';
import { isSynced, markSynced, getSyncStatus } from '../formatters/frontmatter.js';

// --- 测试用 fixture 内容 ---

const MOCK_FM_CONTENT = `---
title: "测试文章"
description: "这是一篇测试文章"
pubDate: 2026-01-01
category: "技术"
tags: ["test", "blog"]
featured: false
---

## 标题

正文内容。
`;

const MOCK_FM_BOOL_NUM = `---
title: "类型测试"
featured: true
draft: false
priority: 42
---

内容。
`;

const MOCK_FM_QUOTED = `---
title: '单引号标题'
description: "双引号描述"
---

内容。
`;

const MOCK_FM_MULTILINE_ARRAY = `---
title: "多行数组"
tags:
  - tag-a
  - tag-b
  - tag-c
---

内容。
`;

// --- 测试套件 ---

describe('同步引擎 core.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // parseFrontmatter — 内部函数，通过 getPosts 间接测试
  // ---------------------------------------------------------------
  describe('parseFrontmatter (通过 getPosts 间接测试)', () => {
    it('应解析 key: value 格式', () => {
      vi.mocked(readdirSync).mockReturnValue(['test.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);

      const posts = getPosts();
      const fm = posts[0].frontmatter;

      expect(fm.title).toBe('测试文章');
      expect(fm.description).toBe('这是一篇测试文章');
      expect(fm.category).toBe('技术');
    });

    it('应解析内联数组 [a, b]', () => {
      vi.mocked(readdirSync).mockReturnValue(['test.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);

      const posts = getPosts();
      expect(posts[0].frontmatter.tags).toEqual(['test', 'blog']);
    });

    it('应处理无 frontmatter 的内容', () => {
      vi.mocked(readdirSync).mockReturnValue(['no-fm.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue('Just plain content\n');

      const posts = getPosts();

      expect(posts[0].frontmatter).toEqual({});
      expect(posts[0].content).toBe('Just plain content\n');
    });

    it('应解析布尔值和数字', () => {
      vi.mocked(readdirSync).mockReturnValue(['types.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_BOOL_NUM);

      const posts = getPosts();
      const fm = posts[0].frontmatter;

      expect(fm.featured).toBe(true);
      expect(fm.draft).toBe(false);
      expect(fm.priority).toBe(42);
    });

    it('应去掉单引号和双引号', () => {
      vi.mocked(readdirSync).mockReturnValue(['quoted.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_QUOTED);

      const posts = getPosts();
      const fm = posts[0].frontmatter;

      expect(fm.title).toBe('单引号标题');
      expect(fm.description).toBe('双引号描述');
    });

    it('应解析多行数组格式 (key: 后跟 - item 行)', () => {
      vi.mocked(readdirSync).mockReturnValue(['multi.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_MULTILINE_ARRAY);

      const posts = getPosts();
      expect(posts[0].frontmatter.tags).toEqual(['tag-a', 'tag-b', 'tag-c']);
    });
  });

  // ---------------------------------------------------------------
  // getPosts
  // ---------------------------------------------------------------
  describe('getPosts', () => {
    it('应扫描 content 目录返回 Post 对象数组', () => {
      vi.mocked(readdirSync).mockReturnValue(['post-a.mdx', 'post-b.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);

      const posts = getPosts();
      expect(posts).toHaveLength(2);
    });

    it('返回的 Post 应包含 slug, title, description, content, frontmatter, filePath', () => {
      vi.mocked(readdirSync).mockReturnValue(['test-post.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);

      const post = getPosts()[0];

      expect(post.slug).toBe('test-post');
      expect(post.title).toBe('测试文章');
      expect(post.description).toBe('这是一篇测试文章');
      expect(post.content).toContain('正文内容');
      expect(post.frontmatter).toBeDefined();
      expect(post.filePath).toContain('test-post.mdx');
    });

    it('应按 slug 过滤指定文章', () => {
      vi.mocked(readdirSync).mockReturnValue(['post-a.mdx', 'post-b.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);

      const posts = getPosts({ slug: 'post-a' });

      expect(posts).toHaveLength(1);
      expect(posts[0].slug).toBe('post-a');
    });

    it('不存在的 slug 应返回空数组', () => {
      vi.mocked(readdirSync).mockReturnValue(['post-a.mdx'] as any);

      const posts = getPosts({ slug: 'nonexistent' });
      expect(posts).toHaveLength(0);
    });

    it('空目录应返回空数组', () => {
      vi.mocked(readdirSync).mockReturnValue([] as any);

      const posts = getPosts();
      expect(posts).toHaveLength(0);
    });

    it('应忽略非 .mdx 文件', () => {
      vi.mocked(readdirSync).mockReturnValue(['post.mdx', 'readme.txt', 'data.json'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);

      const posts = getPosts();

      expect(posts).toHaveLength(1);
      expect(posts[0].slug).toBe('post');
    });
  });

  // ---------------------------------------------------------------
  // runSync
  // ---------------------------------------------------------------
  describe('runSync', () => {
    /** 构造 mock adapter，每次测试前重置 */
    function makeAdapter(overrides: Record<string, any> = {}) {
      return {
        name: 'test-platform',
        transform: vi.fn(() => 'transformed content'),
        generateMetadata: vi.fn(() => ({})),
        outputPath: vi.fn(() => '/mock/dist-sync/test-platform/test-post.md'),
        ...overrides,
      };
    }

    beforeEach(() => {
      // 默认：getPosts 返回一篇未同步文章
      vi.mocked(readdirSync).mockReturnValue(['test-post.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);
    });

    it('应对未同步文章调用 adapter.transform 并写入文件', () => {
      vi.mocked(isSynced).mockReturnValue(false);
      const adapter = makeAdapter();

      const results = runSync([adapter as any]);

      expect(adapter.transform).toHaveBeenCalledTimes(1);
      expect(mkdirSync).toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalled();
      expect(markSynced).toHaveBeenCalledWith('test-post', 'test-platform');
      expect(results[0].status).toBe('synced');
    });

    it('应跳过已同步且未 force 的文章', () => {
      vi.mocked(isSynced).mockReturnValue(true);
      const adapter = makeAdapter();

      const results = runSync([adapter as any]);

      expect(adapter.transform).not.toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
      expect(results[0].status).toBe('skipped');
    });

    it('force 选项应覆盖已同步状态重新同步', () => {
      vi.mocked(isSynced).mockReturnValue(true);
      const adapter = makeAdapter();

      const results = runSync([adapter as any], { force: true });

      expect(adapter.transform).toHaveBeenCalledTimes(1);
      expect(results[0].status).toBe('synced');
    });

    it('dryRun 模式不应写入文件也不记录同步状态', () => {
      vi.mocked(isSynced).mockReturnValue(false);
      const adapter = makeAdapter();

      const results = runSync([adapter as any], { dryRun: true });

      expect(adapter.transform).toHaveBeenCalled();
      expect(writeFileSync).not.toHaveBeenCalled();
      expect(markSynced).not.toHaveBeenCalled();
      expect(results[0].status).toBe('synced');
    });

    it('应捕获 adapter 异常并返回 error 状态', () => {
      vi.mocked(isSynced).mockReturnValue(false);
      const adapter = makeAdapter({
        transform: vi.fn(() => {
          throw new Error('transform failed');
        }),
      });

      const results = runSync([adapter as any]);

      expect(results[0].status).toBe('error');
      expect(results[0].error).toBe('transform failed');
    });

    it('应返回正确的 SyncResult 数组', () => {
      vi.mocked(isSynced).mockReturnValue(false);
      const adapter = makeAdapter();

      const results = runSync([adapter as any]);

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        platform: 'test-platform',
        slug: 'test-post',
        status: 'synced',
        outputPath: '/mock/dist-sync/test-platform/test-post.md',
      });
    });

    it('应按 platform 选项过滤适配器', () => {
      vi.mocked(isSynced).mockReturnValue(false);
      const adapterA = makeAdapter({ name: 'platform-a' });
      const adapterB = makeAdapter({ name: 'platform-b' });

      const results = runSync([adapterA as any, adapterB as any], { platform: 'platform-b' });

      expect(adapterA.transform).not.toHaveBeenCalled();
      expect(adapterB.transform).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].platform).toBe('platform-b');
    });

    it('应按 post 选项过滤文章', () => {
      vi.mocked(readdirSync).mockReturnValue(['post-a.mdx', 'post-b.mdx'] as any);
      vi.mocked(isSynced).mockReturnValue(false);
      const adapter = makeAdapter();

      const results = runSync([adapter as any], { post: 'post-a' });

      // adapter.transform 只应被调用一次（post-a）
      expect(adapter.transform).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe('post-a');
    });

    it('多篇文章 + 多适配器应返回所有组合结果', () => {
      vi.mocked(readdirSync).mockReturnValue(['post-a.mdx', 'post-b.mdx'] as any);
      vi.mocked(isSynced).mockReturnValue(false);
      const adapterA = makeAdapter({ name: 'platform-a' });
      const adapterB = makeAdapter({ name: 'platform-b' });

      const results = runSync([adapterA as any, adapterB as any]);

      // 2 篇文章 x 2 个平台 = 4 条结果
      expect(results).toHaveLength(4);
    });
  });

  // ---------------------------------------------------------------
  // generateManifest
  // ---------------------------------------------------------------
  describe('generateManifest', () => {
    it('应返回包含所有文章的清单', () => {
      vi.mocked(readdirSync).mockReturnValue(['post-a.mdx', 'post-b.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);
      vi.mocked(getSyncStatus).mockReturnValue({});

      const adapter = {
        name: 'test-platform',
        transform: vi.fn(),
        generateMetadata: vi.fn(),
        outputPath: vi.fn(),
      };

      const manifest = generateManifest([adapter as any]);

      expect(manifest.posts).toHaveLength(2);
    });

    it('每篇文章应包含所有平台的同步状态', () => {
      vi.mocked(readdirSync).mockReturnValue(['test-post.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);
      vi.mocked(getSyncStatus).mockReturnValue({ 'test-platform': '2026-01-01' });

      const adapter = {
        name: 'test-platform',
        transform: vi.fn(),
        generateMetadata: vi.fn(),
        outputPath: vi.fn(),
      };

      const manifest = generateManifest([adapter as any]);

      expect(manifest.posts[0].platforms).toHaveLength(1);
      expect(manifest.posts[0].platforms[0]).toMatchObject({
        name: 'test-platform',
        syndicated: true,
        date: '2026-01-01',
      });
    });

    it('未同步平台应显示 syndicated: false', () => {
      vi.mocked(readdirSync).mockReturnValue(['test-post.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);
      vi.mocked(getSyncStatus).mockReturnValue({});

      const adapter = {
        name: 'test-platform',
        transform: vi.fn(),
        generateMetadata: vi.fn(),
        outputPath: vi.fn(),
      };

      const manifest = generateManifest([adapter as any]);

      expect(manifest.posts[0].platforms[0]).toMatchObject({
        name: 'test-platform',
        syndicated: false,
        date: undefined,
      });
    });

    it('应支持多个平台并正确反映各自同步状态', () => {
      vi.mocked(readdirSync).mockReturnValue(['test-post.mdx'] as any);
      vi.mocked(readFileSync).mockReturnValue(MOCK_FM_CONTENT);
      // 只有 platform-a 已同步
      vi.mocked(getSyncStatus).mockReturnValue({ 'platform-a': '2026-06-01' });

      const adapterA = { name: 'platform-a', transform: vi.fn(), generateMetadata: vi.fn(), outputPath: vi.fn() };
      const adapterB = { name: 'platform-b', transform: vi.fn(), generateMetadata: vi.fn(), outputPath: vi.fn() };

      const manifest = generateManifest([adapterA as any, adapterB as any]);

      expect(manifest.posts[0].platforms).toHaveLength(2);
      expect(manifest.posts[0].platforms[0]).toMatchObject({ name: 'platform-a', syndicated: true });
      expect(manifest.posts[0].platforms[1]).toMatchObject({ name: 'platform-b', syndicated: false });
    });
  });
});
