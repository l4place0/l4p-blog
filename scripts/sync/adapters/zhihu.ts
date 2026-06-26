import type { PlatformAdapter, Post } from '../types.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../../dist-sync/zhihu');

export const zhihuAdapter: PlatformAdapter = {
  name: 'zhihu',

  transform(post: Post): string {
    let content = post.content;

    // 1. 移除 MDX 特有语法（JSX 组件标签）
    content = removeJsxComponents(content);

    // 2. 知乎 Markdown 适配
    content = adaptForZhihu(content);

    // 3. 生成知乎格式的 frontmatter
    const metadata = this.generateMetadata(post);
    const frontmatter = buildFrontmatter(metadata);

    return `${frontmatter}\n\n${content}`;
  },

  generateMetadata(post: Post): Record<string, any> {
    return {
      title: post.title,
      description: post.description,
      // 知乎文章标签（从 tags 字段提取）
      tags: post.frontmatter.tags || [],
      // 知乎分类（映射博客 category）
      category: mapCategory(post.frontmatter.category),
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

// 知乎特定的内容适配
function adaptForZhihu(content: string): string {
  // 知乎支持的标准 Markdown 语法已经足够
  // 这里做一些微调
  return content;
}

// 构建 frontmatter 字符串
function buildFrontmatter(data: Record<string, any>): string {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map(v => `'${v}'`).join(', ')}]`);
    } else if (typeof value === 'string') {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

// 博客分类 → 知乎分类映射
function mapCategory(category: string): string {
  const map: Record<string, string> = {
    '技术': '技术',
    '随笔': '生活',
    '读书': '人文',
    '生活': '生活',
    '设计': '设计',
  };
  return map[category] || '其他';
}
