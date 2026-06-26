/** Frontmatter 格式化器 -- 管理文章的 syndicated 状态 */

import { readFileSync, writeFileSync } from 'fs';

export interface SyndicatedStatus {
  [platform: string]: string; // platform -> date string
}

/**
 * 解析 frontmatter 中的 syndicated 字段
 */
export function parseSyndicated(content: string): SyndicatedStatus {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fmBlock = match[1];
  const syndicatedMatch = fmBlock.match(/syndicated:\s*\n((?:\s+\w+:.*\n?)*)/);
  if (!syndicatedMatch) return {};

  const status: SyndicatedStatus = {};
  const lines = syndicatedMatch[1].split('\n').filter(l => l.trim());
  for (const line of lines) {
    const m = line.match(/^\s+(\w+):\s*(.+)$/);
    if (m) status[m[1]] = m[2].trim();
  }
  return status;
}

/**
 * 在 frontmatter 中追加同步状态
 */
export function appendSyndicated(filePath: string, platform: string): void {
  const raw = readFileSync(filePath, 'utf-8');
  const date = new Date().toISOString().split('T')[0];

  if (raw.includes('syndicated:')) {
    // 已有 syndicated 字段，追加平台
    const updated = raw.replace(
      /(syndicated:\s*\n)((?:\s+\w+:.*\n?)*)/,
      `$1$2    ${platform}: ${date}\n`
    );
    writeFileSync(filePath, updated, 'utf-8');
  } else {
    // 没有 syndicated 字段，在 frontmatter 末尾添加
    const updated = raw.replace(
      /^(---\n[\s\S]*?)(---)/,
      `$1syndicated:\n    ${platform}: ${date}\n$2`
    );
    writeFileSync(filePath, updated, 'utf-8');
  }
}

/**
 * 检查文章是否已同步到指定平台
 */
export function isSynced(content: string, platform: string): boolean {
  const status = parseSyndicated(content);
  return !!status[platform];
}

/**
 * 格式化 syndicated 状态为人类可读字符串
 */
export function formatStatus(status: SyndicatedStatus): string {
  if (Object.keys(status).length === 0) return '未同步';
  return Object.entries(status)
    .map(([platform, date]) => `${platform}: ${date}`)
    .join(', ');
}
