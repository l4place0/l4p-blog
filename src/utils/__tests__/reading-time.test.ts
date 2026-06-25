import { describe, it, expect } from 'vitest';
import { readingTime } from '../reading-time';

describe('readingTime', () => {
  it('应该为纯中文内容计算阅读时间（约300字/分钟）', () => {
    const content = '这是一段中文测试内容。'.repeat(150); // ~1500 chars
    const result = readingTime(content);
    expect(result).toBe('5 分钟');
  });

  it('应该为纯英文内容计算阅读时间（约200词/分钟）', () => {
    const sentence = 'word '.repeat(200); // exactly 200 words
    const result = readingTime(sentence);
    expect(result).toBe('1 分钟');
  });

  it('应该为中英混合内容计算阅读时间', () => {
    const content = '这是中文内容 mixed with English words. '.repeat(100);
    const result = readingTime(content);
    expect(result).toMatch(/^\d+ 分钟$/);
  });

  it('应该为短内容返回 1 分钟', () => {
    const result = readingTime('短');
    expect(result).toBe('1 分钟');
  });

  it('应该为空内容返回 1 分钟', () => {
    const result = readingTime('');
    expect(result).toBe('1 分钟');
  });
});
