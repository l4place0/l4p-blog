import { describe, it, expect } from 'vitest';
import { formatDate, formatDateISO } from '../date';

describe('date', () => {
  describe('formatDate', () => {
    it('应该将 Date 格式化为中文日期字符串', () => {
      const date = new Date('2026-06-25');
      const result = formatDate(date);
      expect(result).toBe('2026年6月25日');
    });

    it('应该正确补零处理月份和日期', () => {
      const date = new Date('2026-01-05');
      const result = formatDate(date);
      expect(result).toBe('2026年1月5日');
    });
  });

  describe('formatDateISO', () => {
    it('应该将 Date 格式化为 ISO 日期字符串', () => {
      const date = new Date('2026-06-25');
      const result = formatDateISO(date);
      expect(result).toBe('2026-06-25');
    });

    it('应该补零到两位数', () => {
      const date = new Date('2026-01-05');
      const result = formatDateISO(date);
      expect(result).toBe('2026-01-05');
    });
  });
});
