import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();

describe('已知问题防回归', () => {
  it('astro.config 不应该有重复的 base 字段', () => {
    const config = readFileSync(resolve(ROOT, 'astro.config.mjs'), 'utf-8');
    const baseMatches = config.match(/^\s*base\s*:/gm);
    expect(baseMatches, 'astro.config.mjs 应该只有一个 base 字段').toHaveLength(1);
  });

  it('schemas.ts 应该从 zod 导入而非 astro:content', () => {
    const schemas = readFileSync(resolve(ROOT, 'src/content/schemas.ts'), 'utf-8');
    expect(schemas).toContain("from 'zod'");
    expect(schemas).not.toContain("from 'astro:content'");
  });

  it('config.ts 应该引用 schemas.ts 而非直接定义 schema', () => {
    const config = readFileSync(resolve(ROOT, 'src/content/config.ts'), 'utf-8');
    expect(config).toContain('./schemas');
    expect(config).not.toContain('z.object');
  });

  it('所有交互组件应该有 data-component 属性', () => {
    const components = [
      'src/components/DarkModeToggle.astro',
      'src/components/SearchDialog.astro',
      'src/components/TableOfContents.astro',
      'src/components/CommentSection.astro',
      'src/components/Header.astro',
    ];
    for (const comp of components) {
      const content = readFileSync(resolve(ROOT, comp), 'utf-8');
      expect(content, `${comp} 应该有 data-component`).toContain('data-component=');
    }
  });
});
