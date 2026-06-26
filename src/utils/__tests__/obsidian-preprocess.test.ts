import { describe, it, expect } from 'vitest';
import {
  handleWikilinks,
  handleEmbeds,
  handleCallouts,
  handleHighlights,
  preprocessObsidian,
} from '../obsidian-preprocess';

describe('Obsidian 语法预处理器', () => {
  describe('handleWikilinks', () => {
    it('转换基本 wikilink', () => {
      expect(handleWikilinks('[[hello]]')).toBe('[hello](hello)');
    });

    it('转换带别名的 wikilink', () => {
      expect(handleWikilinks('[[hello|你好]]')).toBe('[你好](hello)');
    });

    it('不转换嵌入语法', () => {
      expect(handleWikilinks('![[image.png]]')).toBe('![[image.png]]');
    });

    it('处理多个 wikilink', () => {
      expect(handleWikilinks('[[a]] and [[b|B]]')).toBe('[a](a) and [B](b)');
    });
  });

  describe('handleEmbeds', () => {
    it('转换图片嵌入', () => {
      expect(handleEmbeds('![[image.png]]')).toBe('![image](/attachments/image.png)');
    });

    it('转换带空格的图片名', () => {
      expect(handleEmbeds('![[my image.png]]')).toBe('![my image](/attachments/my%20image.png)');
    });

    it('转换 jpg 图片', () => {
      expect(handleEmbeds('![[photo.jpg]]')).toBe('![photo](/attachments/photo.jpg)');
    });

    it('转换 jpeg 图片', () => {
      expect(handleEmbeds('![[photo.jpeg]]')).toBe('![photo](/attachments/photo.jpeg)');
    });

    it('转换 gif 图片', () => {
      expect(handleEmbeds('![[anim.gif]]')).toBe('![anim](/attachments/anim.gif)');
    });

    it('转换 svg 图片', () => {
      expect(handleEmbeds('![[icon.svg]]')).toBe('![icon](/attachments/icon.svg)');
    });

    it('转换 webp 图片', () => {
      expect(handleEmbeds('![[pic.webp]]')).toBe('![pic](/attachments/pic.webp)');
    });

    it('非图片嵌入转为链接', () => {
      expect(handleEmbeds('![[some-page]]')).toBe('[some-page](some-page)');
    });
  });

  describe('handleCallouts', () => {
    it('转换 note callout', () => {
      const input = '> [!note] Title\n> Some content';
      const result = handleCallouts(input);
      expect(result).toContain('**📝 Title**');
      expect(result).toContain('> Some content');
    });

    it('转换 warning callout', () => {
      const input = '> [!warning] 注意\n> 内容';
      const result = handleCallouts(input);
      expect(result).toContain('**⚠️ 注意**');
    });

    it('转换 tip callout', () => {
      const input = '> [!tip] 提示\n> 小技巧';
      const result = handleCallouts(input);
      expect(result).toContain('**💡 提示**');
    });

    it('转换 danger callout', () => {
      const input = '> [!danger] 危险\n> 注意';
      const result = handleCallouts(input);
      expect(result).toContain('**🚨 危险**');
    });

    it('转换 info callout', () => {
      const input = '> [!info] 信息\n> 详情';
      const result = handleCallouts(input);
      expect(result).toContain('**ℹ️ 信息**');
    });

    it('转换 quote callout', () => {
      const input = '> [!quote] 引用\n> 原文';
      const result = handleCallouts(input);
      expect(result).toContain('**💬 引用**');
    });

    it('无标题时使用类型名作为标题', () => {
      const input = '> [!note]\n> content';
      const result = handleCallouts(input);
      expect(result).toContain('**📝 Note**');
    });

    it('不影响普通引用块', () => {
      const input = '> 普通引用\n> 没有 callout';
      expect(handleCallouts(input)).toBe(input);
    });
  });

  describe('handleHighlights', () => {
    it('转换高亮文本', () => {
      expect(handleHighlights('==重要内容==')).toBe('<mark>重要内容</mark>');
    });

    it('不转换代码块中的等号', () => {
      expect(handleHighlights('a == b')).toBe('a == b');
    });

    it('不转换行内代码中的高亮', () => {
      expect(handleHighlights('`==test==`')).toBe('`==test==`');
    });

    it('不转换代码围栏中的高亮', () => {
      const input = '```\n==test==\n```';
      expect(handleHighlights(input)).toBe(input);
    });

    it('处理行内多个高亮', () => {
      expect(handleHighlights('==a== and ==b==')).toBe('<mark>a</mark> and <mark>b</mark>');
    });
  });

  describe('preprocessObsidian', () => {
    it('组合转换所有语法', () => {
      const input = '看看 [[wiki]] 和 ![[img.png]] 以及 ==高亮==';
      const result = preprocessObsidian(input);
      expect(result).toContain('[wiki](wiki)');
      expect(result).toContain('![img](/attachments/img.png)');
      expect(result).toContain('<mark>高亮</mark>');
    });

    it('处理带别名的 wikilink 和图片嵌入', () => {
      const input = '[[page|别名]] ![[photo.jpg]]';
      const result = preprocessObsidian(input);
      expect(result).toContain('[别名](page)');
      expect(result).toContain('![photo](/attachments/photo.jpg)');
    });

    it('处理 callout 与其他语法混合', () => {
      const input = '> [!tip] 小技巧\n> 看看 [[wiki]] 和 ==高亮==';
      const result = preprocessObsidian(input);
      expect(result).toContain('**💡 小技巧**');
      expect(result).toContain('[wiki](wiki)');
      expect(result).toContain('<mark>高亮</mark>');
    });

    it('不破坏普通 Markdown', () => {
      const input = '# 标题\n\n普通段落，[链接](url) 和 **粗体**。';
      expect(preprocessObsidian(input)).toBe(input);
    });
  });
});
