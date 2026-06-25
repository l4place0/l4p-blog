import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { blogSchema, projectsSchema } from '../content/schemas';

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    // 去除 YAML 引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

describe('内容完整性', () => {
  const blogDir = resolve(process.cwd(), 'src/content/blog');
  const projectDir = resolve(process.cwd(), 'src/content/projects');

  it('所有博客文章的 frontmatter 应该合法', () => {
    const files = readdirSync(blogDir).filter(f => f.endsWith('.mdx'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(join(blogDir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      const result = blogSchema.safeParse({
        title: fm.title,
        description: fm.description,
        pubDate: fm.pubDate ? new Date(fm.pubDate) : undefined,
        category: fm.category,
        tags: fm.tags ? JSON.parse(fm.tags.replace(/'/g, '"')) : undefined,
        featured: fm.featured === 'true' ? true : fm.featured === 'false' ? false : undefined,
        draft: fm.draft === 'true' ? true : fm.draft === 'false' ? false : undefined,
        lang: fm.lang,
        author: fm.author,
      });
      expect(result.success, `${file} frontmatter 不合法: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    }
  });

  it('所有项目的 frontmatter 应该合法', () => {
    const files = readdirSync(projectDir).filter(f => f.endsWith('.mdx'));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(join(projectDir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      const result = projectsSchema.safeParse({
        title: fm.title,
        description: fm.description,
        pubDate: fm.pubDate ? new Date(fm.pubDate) : undefined,
        tech: fm.tech ? JSON.parse(fm.tech.replace(/'/g, '"')) : undefined,
        url: fm.url,
        repo: fm.repo,
        featured: fm.featured === 'true' ? true : fm.featured === 'false' ? false : undefined,
        status: fm.status,
      });
      expect(result.success, `${file} frontmatter 不合法: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    }
  });
});
