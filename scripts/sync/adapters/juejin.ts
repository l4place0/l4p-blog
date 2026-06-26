import type { PlatformAdapter, Post } from '../types.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../../dist-sync/juejin');

export const juejinAdapter: PlatformAdapter = {
  name: 'juejin',

  transform(post: Post): string {
    let content = post.content;

    // 1. 移除 MDX 特有语法（JSX 组件标签）
    content = removeJsxComponents(content);

    // 2. 掘金 Markdown 适配
    content = adaptForJuejin(content);

    // 3. 生成掘金格式的 frontmatter
    const metadata = this.generateMetadata(post);
    const frontmatter = buildFrontmatter(metadata);

    return `${frontmatter}\n\n${content}`;
  },

  generateMetadata(post: Post): Record<string, any> {
    return {
      title: post.title,
      // 掘金文章主题
      theme: 'smart',
      // 掘金标签（最多 3 个）
      tags: (post.frontmatter.tags || []).slice(0, 3),
      // 掘金分类（映射博客 category）
      categories: [mapCategory(post.frontmatter.category)],
      // 是否公开
      public: true,
    };
  },

  outputPath(post: Post): string {
    return join(OUTPUT_DIR, `${post.slug}.md`);
  },
};

// 移除 JSX 组件标签（如 <Component prop="value" />）
function removeJsxComponents(content: string): string {
  // 移除自闭合标签
  content = content.replace(/<[A-Z][a-zA-Z]*\s[^>]*\/>/g, '');
  // 移除开闭标签对
  content = content.replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '');
  // 移除 import 语句
  content = content.replace(/^import\s+.*$/gm, '');
  // 移除空行（连续多个空行合并为一个）
  content = content.replace(/\n{3,}/g, '\n\n');
  return content;
}

// 掘金特定的内容适配
function adaptForJuejin(content: string): string {
  // 确保代码块有语言标识（掘金要求）
  // 逐行处理，用状态机区分开头 ``` 和闭合 ```
  const lines = content.split('\n');
  let inCodeBlock = false;
  const result: string[] = [];

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // 开头 ```：如果没有语言标识，添加 text
        const lang = line.slice(3).trim();
        if (!lang) {
          result.push('```text');
        } else {
          result.push(line);
        }
        inCodeBlock = true;
      } else {
        // 闭合 ```
        result.push(line);
        inCodeBlock = false;
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

// 构建 frontmatter 字符串
function buildFrontmatter(data: Record<string, any>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `'${v}'`).join(', ')}]`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: "${value}"`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// 博客分类 → 掘金分类映射
function mapCategory(category: string): string {
  const map: Record<string, string> = {
    '技术': '后端',
    '随笔': '生活',
    '读书': '其他',
    '生活': '生活',
    '设计': '前端',
  };
  return map[category] || '其他';
}
