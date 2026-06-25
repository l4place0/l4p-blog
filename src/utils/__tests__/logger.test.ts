import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, LOG_LEVELS } from '../logger';

describe('logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('应该输出 JSON 格式的 info 日志', () => {
    const logger = createLogger({ level: 'info' });
    logger.info('test-module', 'hello', { key: 'value' });

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.level).toBe('info');
    expect(output.module).toBe('test-module');
    expect(output.message).toBe('hello');
    expect(output.data).toEqual({ key: 'value' });
    expect(output.timestamp).toBeDefined();
  });

  it('应该输出 warn 级别日志', () => {
    const logger = createLogger({ level: 'info' });
    logger.warn('mod', 'warning');

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.level).toBe('warn');
  });

  it('应该输出 error 级别日志', () => {
    const logger = createLogger({ level: 'info' });
    logger.error('mod', 'fail', { code: 500 });

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.level).toBe('error');
    expect(output.data).toEqual({ code: 500 });
  });

  it('应该在 debug 级别下输出 debug 日志', () => {
    const logger = createLogger({ level: 'debug' });
    logger.debug('mod', 'trace');

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.level).toBe('debug');
  });

  it('应该在 info 级别下不输出 debug 日志', () => {
    const logger = createLogger({ level: 'info' });
    logger.debug('mod', 'should not appear');

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('应该在 warn 级别下不输出 info 和 debug 日志', () => {
    const logger = createLogger({ level: 'warn' });
    logger.debug('mod', 'no');
    logger.info('mod', 'no');

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('应该在 error 级别下只输出 error 日志', () => {
    const logger = createLogger({ level: 'error' });
    logger.debug('mod', 'no');
    logger.info('mod', 'no');
    logger.warn('mod', 'no');
    logger.error('mod', 'yes');

    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('应该支持不传 data 参数', () => {
    const logger = createLogger({ level: 'info' });
    logger.info('mod', 'no data');

    const output = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(output.data).toBeUndefined();
  });

  it('应该暴露 LOG_LEVELS 常量', () => {
    expect(LOG_LEVELS).toEqual({
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    });
  });
});
