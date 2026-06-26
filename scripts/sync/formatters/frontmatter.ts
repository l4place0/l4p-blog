/** 同步状态管理 — 使用独立 JSON 文件追踪 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(__dirname, '../.sync-state.json');

export interface SyncState {
  [slug: string]: {
    [platform: string]: string; // platform -> ISO date
  };
}

function loadState(): SyncState {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveState(state: SyncState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

/**
 * 检查文章是否已同步到指定平台
 */
export function isSynced(slug: string, platform: string): boolean {
  const state = loadState();
  return !!state[slug]?.[platform];
}

/**
 * 记录同步状态
 */
export function markSynced(slug: string, platform: string): void {
  const state = loadState();
  if (!state[slug]) state[slug] = {};
  state[slug][platform] = new Date().toISOString().split('T')[0];
  saveState(state);
}

/**
 * 获取文章的同步状态
 */
export function getSyncStatus(slug: string): Record<string, string> {
  const state = loadState();
  return state[slug] || {};
}

/**
 * 获取所有同步状态
 */
export function getAllSyncState(): SyncState {
  return loadState();
}

/**
 * 格式化状态为人类可读字符串
 */
export function formatStatus(status: Record<string, string>): string {
  if (Object.keys(status).length === 0) return '未同步';
  return Object.entries(status)
    .map(([platform, date]) => `${platform}: ${date}`)
    .join(', ');
}
