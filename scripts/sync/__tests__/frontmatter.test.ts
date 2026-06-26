/** 同步状态管理 — frontmatter.ts 测试 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── 内存状态存储 ──────────────────────────────────────────────
// 模块通过 import.meta.url 计算 STATE_FILE，路径固定且不可注入。
// 使用 vi.mock('fs') 拦截所有文件操作，以内存对象代替磁盘 I/O。

/** 模拟磁盘上的 .sync-state.json，null 表示文件不存在 */
let diskState: Record<string, Record<string, string>> | null = null;

vi.mock('fs', () => ({
  existsSync: vi.fn(() => diskState !== null),
  readFileSync: vi.fn(() => JSON.stringify(diskState)),
  writeFileSync: vi.fn((_path: string, content: string) => {
    // saveState 写入 JSON.stringify(state, null, 2) + '\n'，需要处理尾部换行
    diskState = JSON.parse(content.trimEnd());
  }),
}));

// mock 完成后再导入被测模块
import { isSynced, markSynced, getSyncStatus, getAllSyncState, formatStatus } from '../formatters/frontmatter.js';

describe('同步状态管理 frontmatter.ts', () => {
  beforeEach(() => {
    // 每个测试前重置内存状态
    diskState = null;
    vi.clearAllMocks();
  });

  // ── isSynced ──────────────────────────────────────────────────

  describe('isSynced', () => {
    it('无状态文件时应返回 false', () => {
      expect(isSynced('my-post', 'zhihu')).toBe(false);
    });

    it('未同步的文章应返回 false', () => {
      diskState = { 'other-post': { zhihu: '2026-01-01' } };
      expect(isSynced('my-post', 'zhihu')).toBe(false);
    });

    it('已同步的文章应返回 true', () => {
      diskState = { 'my-post': { zhihu: '2026-01-15' } };
      expect(isSynced('my-post', 'zhihu')).toBe(true);
    });

    it('已同步到 A 平台但查 B 平台应返回 false', () => {
      diskState = { 'my-post': { zhihu: '2026-01-15' } };
      expect(isSynced('my-post', 'juejin')).toBe(false);
    });
  });

  // ── markSynced ────────────────────────────────────────────────

  describe('markSynced', () => {
    it('应创建状态文件（如果不存在）', () => {
      markSynced('new-post', 'zhihu');
      expect(diskState).not.toBeNull();
      expect(diskState!['new-post']).toBeDefined();
      expect(diskState!['new-post']['zhihu']).toBeTruthy();
    });

    it('应记录 slug + platform + date', () => {
      markSynced('my-post', 'zhihu');
      const entry = diskState!['my-post']['zhihu'];
      // 日期格式为 YYYY-MM-DD
      expect(entry).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('多次 mark 不同平台应累积记录', () => {
      markSynced('my-post', 'zhihu');
      markSynced('my-post', 'juejin');
      expect(diskState!['my-post']['zhihu']).toBeTruthy();
      expect(diskState!['my-post']['juejin']).toBeTruthy();
    });

    it('重复 mark 同一平台应更新日期', () => {
      diskState = { 'my-post': { zhihu: '2026-01-01' } };
      markSynced('my-post', 'zhihu');
      // 日期应被更新为今天（不再是 2026-01-01）
      const today = new Date().toISOString().split('T')[0];
      expect(diskState!['my-post']['zhihu']).toBe(today);
    });
  });

  // ── getSyncStatus ─────────────────────────────────────────────

  describe('getSyncStatus', () => {
    it('无状态时应返回空对象', () => {
      expect(getSyncStatus('any-post')).toEqual({});
    });

    it('应返回指定 slug 的平台日期映射', () => {
      diskState = { 'my-post': { zhihu: '2026-03-01', juejin: '2026-03-02' } };
      const status = getSyncStatus('my-post');
      expect(status).toEqual({ zhihu: '2026-03-01', juejin: '2026-03-02' });
    });

    it('不存在的 slug 应返回空对象', () => {
      diskState = { 'other-post': { zhihu: '2026-01-01' } };
      expect(getSyncStatus('missing-post')).toEqual({});
    });
  });

  // ── getAllSyncState ────────────────────────────────────────────

  describe('getAllSyncState', () => {
    it('无状态文件时应返回空对象', () => {
      expect(getAllSyncState()).toEqual({});
    });

    it('应返回完整的状态对象', () => {
      diskState = {
        'post-a': { zhihu: '2026-01-01' },
        'post-b': { juejin: '2026-02-01', zhihu: '2026-02-02' },
      };
      const state = getAllSyncState();
      expect(state).toEqual(diskState);
    });
  });

  // ── formatStatus ──────────────────────────────────────────────

  describe('formatStatus', () => {
    it('空状态应返回 "未同步"', () => {
      expect(formatStatus({})).toBe('未同步');
    });

    it('单平台应返回 "platform: date"', () => {
      expect(formatStatus({ zhihu: '2026-01-01' })).toBe('zhihu: 2026-01-01');
    });

    it('多平台应返回逗号分隔的状态', () => {
      const result = formatStatus({ zhihu: '2026-01-01', juejin: '2026-02-01' });
      // formatStatus 用 ", " 连接
      expect(result).toContain('zhihu: 2026-01-01');
      expect(result).toContain('juejin: 2026-02-01');
      expect(result).toBe('zhihu: 2026-01-01, juejin: 2026-02-01');
    });
  });
});
