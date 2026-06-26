#!/usr/bin/env tsx
/**
 * 多平台同步 CLI 入口
 *
 * 用法：
 *   tsx scripts/sync/index.ts                    # 同步所有文章到所有平台
 *   tsx scripts/sync/index.ts --manifest         # 查看同步清单
 *   tsx scripts/sync/index.ts --post=slug        # 同步指定文章
 *   tsx scripts/sync/index.ts --platform=zhihu   # 同步到指定平台
 *   tsx scripts/sync/index.ts --dry-run          # 预览模式
 *   tsx scripts/sync/index.ts --json             # JSON 输出
 *   tsx scripts/sync/index.ts --force            # 强制重新同步
 */

import { runSync, generateManifest } from './core.js';
import type { SyncOptions } from './types.js';
import { zhihuAdapter } from './adapters/zhihu.js';
import { juejinAdapter } from './adapters/juejin.js';

const adapters = [zhihuAdapter, juejinAdapter];

/**
 * 解析命令行参数
 */
export function parseArgs(args: string[]): SyncOptions {
  const options: SyncOptions = {};

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--manifest') options.manifest = true;
    else if (arg === '--force') options.force = true;
    else if (arg.startsWith('--post=')) options.post = arg.split('=')[1];
    else if (arg.startsWith('--platform=')) options.platform = arg.split('=')[1];
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));

if (options.manifest) {
  const manifest = generateManifest(adapters);

  if (options.json) {
    console.log(JSON.stringify(manifest, null, 2));
  } else {
    if (manifest.posts.length === 0) {
      console.log('未找到文章');
      process.exit(0);
    }

    for (const post of manifest.posts) {
      console.log(`\n  ${post.title} (${post.slug})`);
      for (const p of post.platforms) {
        const status = p.syndicated ? `[已同步 ${p.date}]` : '[未同步]';
        console.log(`    ${p.name}: ${status}`);
      }
    }
  }
} else {
  const results = runSync(adapters, options);

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    if (results.length === 0) {
      console.log('未找到需要同步的文章');
      process.exit(0);
    }

    for (const r of results) {
      const icon = r.status === 'synced' ? '[OK]' : r.status === 'skipped' ? '[SKIP]' : '[ERR]';
      const detail = r.status === 'synced' ? ` -> ${r.outputPath}` : r.status === 'error' ? ` (${r.error})` : '';
      console.log(`${icon} [${r.platform}] ${r.slug}${detail}`);
    }

    const synced = results.filter(r => r.status === 'synced').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const errors = results.filter(r => r.status === 'error').length;
    console.log(`\n完成: ${synced} 同步, ${skipped} 跳过, ${errors} 失败`);
  }
}
