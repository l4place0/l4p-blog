import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { PlatformAdapter, Post } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../../dist-sync/juejin');

export const juejinAdapter: PlatformAdapter = {
  name: 'juejin',

  transform(post: Post): string {
    // TODO: 实现掘金格式转换
    // 掘金使用标准 Markdown，支持部分扩展语法
    const frontmatter = [
      '---',
      `title: "${post.title}"`,
      `description: "${post.description}"`,
      // 掘金需要的额外字段
      `tags: []`,
      `categories: []`,
      '---',
      '',
    ].join('\n');

    return frontmatter + post.content;
  },

  generateMetadata(post: Post): Record<string, any> {
    return {
      title: post.title,
      description: post.description,
      tags: post.frontmatter.tags || [],
      categories: post.frontmatter.categories || [],
    };
  },

  outputPath(post: Post): string {
    return join(OUTPUT_DIR, `${post.slug}.md`);
  },
};
