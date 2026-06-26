import { describe, it, expect } from 'vitest';
import { parseAICommand, formatAIResponse, ERROR_CODES } from '../ai-interface.js';

describe('AI 友好接口 ai-interface.ts', () => {
  // ---------------------------------------------------------------
  // parseAICommand
  // ---------------------------------------------------------------
  describe('parseAICommand', () => {
    it('空参数应默认返回 action: sync', () => {
      const cmd = parseAICommand([]);
      expect(cmd).toEqual({ action: 'sync' });
    });

    it('--manifest 应返回 action: manifest', () => {
      const cmd = parseAICommand(['--manifest']);
      expect(cmd).toEqual({ action: 'manifest' });
    });

    it('--status 应返回 action: status', () => {
      const cmd = parseAICommand(['--status']);
      expect(cmd).toEqual({ action: 'status' });
    });

    it('--dry-run 应设置 dryRun: true', () => {
      const cmd = parseAICommand(['--dry-run']);
      expect(cmd).toEqual({ action: 'sync', dryRun: true });
    });

    it('--force 应设置 force: true', () => {
      const cmd = parseAICommand(['--force']);
      expect(cmd).toEqual({ action: 'sync', force: true });
    });

    it('--post=hello-world 应正确提取 post 值', () => {
      const cmd = parseAICommand(['--post=hello-world']);
      expect(cmd).toEqual({ action: 'sync', post: 'hello-world' });
    });

    it('--platform=zhihu 应正确提取 platform 值', () => {
      const cmd = parseAICommand(['--platform=zhihu']);
      expect(cmd).toEqual({ action: 'sync', platform: 'zhihu' });
    });

    it('组合参数应正确解析', () => {
      const cmd = parseAICommand(['--dry-run', '--post=slug', '--platform=zhihu']);
      expect(cmd).toEqual({
        action: 'sync',
        dryRun: true,
        post: 'slug',
        platform: 'zhihu',
      });
    });

    it('--json-input 应解析 JSON 输入', () => {
      const cmd = parseAICommand(['--json-input', '{"action":"sync","post":"x"}']);
      expect(cmd).toEqual({ action: 'sync', post: 'x' });
    });
  });

  // ---------------------------------------------------------------
  // formatAIResponse
  // ---------------------------------------------------------------
  describe('formatAIResponse', () => {
    it('应返回合法 JSON 字符串', () => {
      const response = {
        success: true,
        action: 'sync',
        summary: { total: 1, synced: 1, skipped: 0, failed: 0 },
      };

      const output = formatAIResponse(response);
      const parsed = JSON.parse(output);

      expect(parsed).toEqual(response);
    });
  });

  // ---------------------------------------------------------------
  // ERROR_CODES
  // ---------------------------------------------------------------
  describe('ERROR_CODES', () => {
    it('应包含 POST_NOT_FOUND', () => {
      expect(ERROR_CODES.POST_NOT_FOUND).toBeDefined();
      expect(ERROR_CODES.POST_NOT_FOUND.code).toBe('POST_NOT_FOUND');
    });

    it('应包含 PLATFORM_NOT_FOUND', () => {
      expect(ERROR_CODES.PLATFORM_NOT_FOUND).toBeDefined();
      expect(ERROR_CODES.PLATFORM_NOT_FOUND.code).toBe('PLATFORM_NOT_FOUND');
    });

    it('应包含 ADAPTER_ERROR', () => {
      expect(ERROR_CODES.ADAPTER_ERROR).toBeDefined();
      expect(ERROR_CODES.ADAPTER_ERROR.code).toBe('ADAPTER_ERROR');
    });

    it('应包含 ALREADY_SYNCED', () => {
      expect(ERROR_CODES.ALREADY_SYNCED).toBeDefined();
      expect(ERROR_CODES.ALREADY_SYNCED.code).toBe('ALREADY_SYNCED');
    });
  });
});
