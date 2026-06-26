/**
 * 多平台同步 CLI 核心引擎
 *
 * 职责：
 * - 扫描 src/content/blog/ 获取所有 .mdx 文件
 * - 解析 frontmatter（简易 YAML 解析）
 * - 对 MDX 内容应用 Obsidian 预处理
 * - 调用 adapter 生成输出
 * - 追加同步状态到 frontmatter
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Post, PlatformAdapter, SyncOptions, SyncResult, SyncManifest } from './types.js';
import { preprocessObsidian } from '../../src/utils/obsidian-preprocess.js';
import { appendSyndicated, parseSyndicated } from './formatters/frontmatter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../../src/content/blog');
const OUTPUT_DIR = join(__dirname, '../../dist-sync');

/**
 * 解析简易 YAML frontmatter
 * 支持 key: value 和 key: [array] 格式
 */
function parseFrontmatter(content: string): { data: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const data: Record<string, any> = {};
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of match[1].split('\n')) {
    // 检查是否是数组续行（以 - 开头，前面有缩进）
    if (currentArray && line.match(/^\s+-\s+/)) {
      const item = line.replace(/^\s+-\s+/, '').trim();
      currentArray.push(item);
      continue;
    }

    // 新的 key: value 行
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      // 保存之前的数组
      if (currentKey && currentArray) {
        data[currentKey] = currentArray;
        currentArray = null;
      }

      const key = m[1];
      let val: any = m[2].trim();

      if (val === '') {
        // 空值可能是数组的开始
        currentKey = key;
        currentArray = [];
        continue;
      }

      // 处理内联数组格式 ['a', 'b'] 或 ["a", "b"]
      if (val.startsWith('[') && val.endsWith(']')) {
        try {
          val = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          // 保持原样
        }
      }
      // 处理布尔值
      else if (val === 'true') val = true;
      else if (val === 'false') val = false;
      // 处理数字
      else if (/^\d+$/.test(val)) val = parseInt(val, 10);
      // 去掉引号
      else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      data[key] = val;
      currentKey = null;
    }
  }

  // 保存最后一个数组
  if (currentKey && currentArray) {
    data[currentKey] = currentArray;
  }

  return { data, body: match[2] };
}

/**
 * 获取所有文章，可选按 slug 过滤
 */
export function getPosts(filter?: { slug?: string }): Post[] {
  if (!readdirSync(CONTENT_DIR).length) {
    return [];
  }

  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'));

  return files
    .map(file => {
      const slug = basename(file, '.mdx');
      if (filter?.slug && slug !== filter.slug) return null;

      const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8');
      const { data, body } = parseFrontmatter(raw);

      return {
        slug,
        title: data.title || slug,
        description: data.description || '',
        content: body,
        frontmatter: data,
        filePath: join(CONTENT_DIR, file),
      };
    })
    .filter((p): p is Post => p !== null);
}

/**
 * 执行同步
 */
export function runSync(adapters: PlatformAdapter[], options: SyncOptions = {}): SyncResult[] {
  const posts = getPosts(options.post ? { slug: options.post } : undefined);
  const results: SyncResult[] = [];

  if (posts.length === 0) {
    return results;
  }

  for (const post of posts) {
    // 应用 Obsidian 预处理
    const content = preprocessObsidian(post.content);
    const syncPost: Post = { ...post, content };

    for (const adapter of adapters) {
      // 过滤指定平台
      if (options.platform && adapter.name !== options.platform) continue;

      // 检查是否已同步（从原始文件内容解析）
      const rawContent = readFileSync(post.filePath, 'utf-8');
      const syndicatedStatus = parseSyndicated(rawContent);
      if (syndicatedStatus[adapter.name] && !options.force) {
        results.push({
          platform: adapter.name,
          slug: post.slug,
          status: 'skipped',
        });
        continue;
      }

      try {
        const output = adapter.transform(syncPost);
        const outPath = adapter.outputPath(syncPost);

        if (!options.dryRun) {
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, output, 'utf-8');
          // 追加同步状态到源文件 frontmatter
          appendSyndicated(post.filePath, adapter.name);
        }

        results.push({
          platform: adapter.name,
          slug: post.slug,
          status: 'synced',
          outputPath: outPath,
        });
      } catch (e: any) {
        results.push({
          platform: adapter.name,
          slug: post.slug,
          status: 'error',
          error: e.message,
        });
      }
    }
  }

  return results;
}

/**
 * 生成同步清单
 */
export function generateManifest(adapters: PlatformAdapter[]): SyncManifest {
  const posts = getPosts();

  return {
    posts: posts.map(post => {
      const rawContent = readFileSync(post.filePath, 'utf-8');
      const syndicatedStatus = parseSyndicated(rawContent);
      return {
        slug: post.slug,
        title: post.title,
        platforms: adapters.map(a => ({
          name: a.name,
          syndicated: !!syndicatedStatus[a.name],
          date: syndicatedStatus[a.name] || undefined,
        })),
      };
    }),
  };
}
