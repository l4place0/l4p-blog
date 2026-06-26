import { describe, it, expect } from 'vitest';
import remarkObsidian from '../remark-obsidian.js';

// --- AST 工厂函数 ---

function makeText(value: string) {
  return { type: 'text' as const, value };
}

function makeParagraph(...children: any[]) {
  return { type: 'paragraph' as const, children };
}

function makeBlockquote(...children: any[]) {
  return { type: 'blockquote' as const, children };
}

function makeRoot(...children: any[]) {
  return { type: 'root' as const, children };
}

// 插件入口便捷函数：构造 AST -> 调用插件 -> 返回修改后的 AST
function applyPlugin(tree: any) {
  const plugin = remarkObsidian();
  plugin(tree);
  return tree;
}

describe('remark-obsidian 插件', () => {
  // ---- callout 转换 ----

  describe('callout 转换', () => {
    it('应转换 > [!note] Title 为格式化标题', () => {
      const tree = applyPlugin(
        makeRoot(
          makeBlockquote(
            makeParagraph(makeText('[!note] My Title'))
          )
        )
      );
      const firstText = tree.children[0].children[0].children[0];
      expect(firstText.value).toBe('**\u{1F4DD} My Title**');
    });

    it('应支持所有 callout 类型 (note/tip/warning/danger/info/quote)', () => {
      const cases: [string, string][] = [
        ['note', '\u{1F4DD}'],
        ['tip', '\u{1F4A1}'],
        ['warning', '⚠️'],
        ['danger', '\u{1F6A8}'],
        ['info', 'ℹ️'],
        ['quote', '\u{1F4AC}'],
      ];

      for (const [type, emoji] of cases) {
        const tree = applyPlugin(
          makeRoot(
            makeBlockquote(
              makeParagraph(makeText(`[!${type}] Title`))
            )
          )
        );
        const text = tree.children[0].children[0].children[0];
        expect(text.value).toBe(`**${emoji} Title**`);
      }
    });

    it('未知类型应使用默认 emoji (📌)', () => {
      const tree = applyPlugin(
        makeRoot(
          makeBlockquote(
            makeParagraph(makeText('[!custom] Unknown Type'))
          )
        )
      );
      const text = tree.children[0].children[0].children[0];
      expect(text.value).toBe('**📌 Unknown Type**');
    });

    it('无标题的 callout 应使用类型名首字母大写作为标题', () => {
      const tree = applyPlugin(
        makeRoot(
          makeBlockquote(
            makeParagraph(makeText('[!note]'))
          )
        )
      );
      const text = tree.children[0].children[0].children[0];
      expect(text.value).toBe('**\u{1F4DD} Note**');
    });

    it('应保留 callout 的正文内容（后续子节点不变）', () => {
      const tree = applyPlugin(
        makeRoot(
          makeBlockquote(
            makeParagraph(makeText('[!tip] Hint')),
            makeParagraph(makeText('Some body text'))
          )
        )
      );
      // 标题被修改
      expect(tree.children[0].children[0].children[0].value).toBe('**\u{1F4A1} Hint**');
      // 正文保持不变
      expect(tree.children[0].children[1].children[0].value).toBe('Some body text');
    });

    it('应不修改非 blockquote 节点', () => {
      const tree = applyPlugin(
        makeRoot(
          makeParagraph(makeText('[!note] Not a callout'))
        )
      );
      expect(tree.children[0].children[0].value).toBe('[!note] Not a callout');
    });
  });

  // ---- text 节点处理 ----

  describe('text 节点处理', () => {
    it('应转换 wikilink [[target]] 为 [target](target)', () => {
      const tree = applyPlugin(
        makeRoot(makeParagraph(makeText('See [[My Page]] for details')))
      );
      const text = tree.children[0].children[0].value;
      expect(text).toBe('See [My Page](My Page) for details');
    });

    it('应转换 [[target|alias]] 为 [alias](target)', () => {
      const tree = applyPlugin(
        makeRoot(makeParagraph(makeText('See [[my-page|My Page]]')))
      );
      const text = tree.children[0].children[0].value;
      expect(text).toBe('See [My Page](my-page)');
    });

    it('应转换 ![[image.png]] 为 ![image](/attachments/image.png)', () => {
      const tree = applyPlugin(
        makeRoot(makeParagraph(makeText('![[photo.png]]')))
      );
      const text = tree.children[0].children[0].value;
      expect(text).toBe('![photo](/attachments/photo.png)');
    });

    it('应转换非图片嵌入 ![[page]] 为 [page](page)', () => {
      const tree = applyPlugin(
        makeRoot(makeParagraph(makeText('![[some-page]]')))
      );
      const text = tree.children[0].children[0].value;
      expect(text).toBe('[some-page](some-page)');
    });

    it('应转换 ==text== 为 <mark>text</mark>', () => {
      const tree = applyPlugin(
        makeRoot(makeParagraph(makeText('This is ==highlighted== text')))
      );
      const text = tree.children[0].children[0].value;
      expect(text).toBe('This is <mark>highlighted</mark> text');
    });

    it('不应修改不含 Obsidian 语法的普通文本', () => {
      const input = 'Just a normal sentence with no special syntax.';
      const tree = applyPlugin(
        makeRoot(makeParagraph(makeText(input)))
      );
      expect(tree.children[0].children[0].value).toBe(input);
    });
  });

  // ---- 递归处理 ----

  describe('递归处理', () => {
    it('应递归处理嵌套节点中的 text', () => {
      // 构造一个 blockquote 内嵌 paragraph 的结构（非 callout）
      const tree = applyPlugin(
        makeRoot(
          makeBlockquote(
            makeParagraph(makeText('Link to [[Target]] and ==highlight=='))
          )
        )
      );
      const text = tree.children[0].children[0].children[0].value;
      expect(text).toBe('Link to [Target](Target) and <mark>highlight</mark>');
    });

    it('不应修改非 text 类型的节点', () => {
      // inlineCode 节点不应被处理
      const tree = makeRoot(
        makeParagraph({ type: 'inlineCode', value: '[[not a link]]' })
      );
      applyPlugin(tree);
      expect(tree.children[0].children[0].value).toBe('[[not a link]]');
    });
  });

  // ---- 边界情况 ----

  describe('边界情况', () => {
    it('应处理空 AST（无 children）', () => {
      const tree = { type: 'root' as const };
      expect(() => applyPlugin(tree)).not.toThrow();
    });

    it('应处理无 text 节点的 AST', () => {
      const tree = makeRoot(
        makeParagraph({ type: 'strong', children: [{ type: 'text', value: 'bold' }] })
      );
      expect(() => applyPlugin(tree)).not.toThrow();
      // text 节点在 strong 内部，仍应被处理
      expect(tree.children[0].children[0].children[0].value).toBe('bold');
    });

    it('应处理空 blockquote', () => {
      const tree = makeRoot(makeBlockquote());
      expect(() => applyPlugin(tree)).not.toThrow();
    });

    it('应处理 blockquote 内无 paragraph 子节点', () => {
      // blockquote 直接包含非 paragraph 节点
      const tree = makeRoot(
        makeBlockquote({ type: 'thematicBreak' })
      );
      expect(() => applyPlugin(tree)).not.toThrow();
    });
  });
});
