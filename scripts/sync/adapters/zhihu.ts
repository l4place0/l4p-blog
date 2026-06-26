import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { PlatformAdapter, Post } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../../dist-sync/zhihu');

export const zhihuAdapter: PlatformAdapter = {
  name: 'zhihu',

  transform(post: Post): string {
    // TODO: 实现知乎格式转换
    // 知乎使用标准 Markdown，但不支持某些 GFM 扩展
    const frontmatter = [
      '---',
      `title: "${post.title}"`,
      `description: "${post.description}"`,
      '---',
      '',
    ].join('\n');

    return frontmatter + post.content;
  },

  generateMetadata(post: Post): Record<string, any> {
    return {
      title: post.title,
      description: post.description,
    };
  },

  outputPath(post: Post): string {
    return join(OUTPUT_DIR, `${post.slug}.md`);
  },
};
