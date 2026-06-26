import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
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

  it('所有文章必填 frontmatter 字段完整', () => {
    const files = readdirSync(blogDir).filter(f => f.endsWith('.mdx'));
    for (const file of files) {
      const content = readFileSync(join(blogDir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      expect(fm.title, `${file}: 缺少 title`).toBeTruthy();
      expect(fm.description, `${file}: 缺少 description`).toBeTruthy();
      expect(fm.pubDate, `${file}: 缺少 pubDate`).toBeTruthy();
      expect(fm.category, `${file}: 缺少 category`).toBeTruthy();
    }
  });

  it('pubDate 不是未来日期（可能是笔误）', () => {
    const files = readdirSync(blogDir).filter(f => f.endsWith('.mdx'));
    const now = new Date();
    for (const file of files) {
      const content = readFileSync(join(blogDir, file), 'utf-8');
      const fm = parseFrontmatter(content);
      if (fm.pubDate) {
        const date = new Date(fm.pubDate);
        // 允许 1 天的误差（时区问题）
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        expect(
          date.getTime(),
          `${file}: pubDate ${fm.pubDate} 是未来日期`
        ).toBeLessThanOrEqual(tomorrow.getTime());
      }
    }
  });

  it('附件目录中没有被完全孤立的文件', () => {
    const attachmentsDir = resolve(process.cwd(), 'src/content/attachments');
    if (!existsSync(attachmentsDir)) return;

    const attachments = readdirSync(attachmentsDir).filter(
      f => !f.startsWith('.') && f !== 'README.md'
    );
    if (attachments.length === 0) return; // 没有附件，跳过

    // 读取所有文章内容
    const files = readdirSync(blogDir).filter(f => f.endsWith('.mdx'));
    const allContent = files
      .map(f => readFileSync(join(blogDir, f), 'utf-8'))
      .join('\n');

    for (const attachment of attachments) {
      // 检查附件是否在某篇文章中被引用
      const isReferenced = allContent.includes(attachment) ||
                           allContent.includes(encodeURI(attachment));
      expect(isReferenced, `孤立附件: ${attachment} 未被任何文章引用`).toBe(true);
    }
  });
});
