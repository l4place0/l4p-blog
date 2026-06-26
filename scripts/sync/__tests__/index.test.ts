import { describe, it, expect } from 'vitest';
import { parseArgs } from '../index.js';

describe('parseArgs', () => {
  it('空参数应返回空 options', () => {
    const options = parseArgs([]);

    expect(options).toEqual({});
    expect(options.manifest).toBeUndefined();
    expect(options.dryRun).toBeUndefined();
    expect(options.json).toBeUndefined();
    expect(options.force).toBeUndefined();
    expect(options.post).toBeUndefined();
    expect(options.platform).toBeUndefined();
  });

  it('--manifest 应设置 manifest: true', () => {
    const options = parseArgs(['--manifest']);

    expect(options.manifest).toBe(true);
  });

  it('--dry-run 应设置 dryRun: true', () => {
    const options = parseArgs(['--dry-run']);

    expect(options.dryRun).toBe(true);
  });

  it('--json 应设置 json: true', () => {
    const options = parseArgs(['--json']);

    expect(options.json).toBe(true);
  });

  it('--force 应设置 force: true', () => {
    const options = parseArgs(['--force']);

    expect(options.force).toBe(true);
  });

  it('--post=hello-world 应设置 post: "hello-world"', () => {
    const options = parseArgs(['--post=hello-world']);

    expect(options.post).toBe('hello-world');
  });

  it('--platform=zhihu 应设置 platform: "zhihu"', () => {
    const options = parseArgs(['--platform=zhihu']);

    expect(options.platform).toBe('zhihu');
  });

  it('应正确解析多个参数组合 (--dry-run --json --post=slug)', () => {
    const options = parseArgs(['--dry-run', '--json', '--post=slug']);

    expect(options.dryRun).toBe(true);
    expect(options.json).toBe(true);
    expect(options.post).toBe('slug');
    expect(options.manifest).toBeUndefined();
    expect(options.force).toBeUndefined();
    expect(options.platform).toBeUndefined();
  });

  it('应同时设置多个标志 (--manifest --json)', () => {
    const options = parseArgs(['--manifest', '--json']);

    expect(options.manifest).toBe(true);
    expect(options.json).toBe(true);
    expect(options.dryRun).toBeUndefined();
    expect(options.force).toBeUndefined();
  });
});
