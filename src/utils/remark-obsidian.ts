/**
 * remark 插件：在 Markdown AST 转换阶段应用 Obsidian 语法处理
 *
 * 处理范围：
 * - Wikilinks: [[target|alias]] -> [alias](target)
 * - Embeds:    ![[image.png]] -> ![image](/attachments/image.png)
 * - Highlights: ==text== -> <mark>text</mark>
 * - Callouts:  > [!note] Title -> > **emoji Title**  (blockquotes 层面)
 */
import type { Root, Content, Blockquote, Paragraph, Text } from 'mdast';
import { handleWikilinks, handleEmbeds, handleHighlights } from './obsidian-preprocess';

const CALLOUT_RE = /^\[!([a-z]+)\]\s*(.*)$/i;
const CALLOUT_MAP: Record<string, string> = {
  note: '\u{1F4DD}',
  tip: '\u{1F4A1}',
  warning: '⚠️',
  danger: '\u{1F6A8}',
  info: 'ℹ️',
  quote: '\u{1F4AC}',
};

/** 递归遍历 AST，对 text 节点应用 inline 转换 */
function processInlineNodes(node: Content | Root): void {
  if ('children' in node) {
    for (const child of (node as any).children as Content[]) {
      processInlineNodes(child);
    }
  }
  if (node.type === 'text') {
    const text = node as Text;
    text.value = handleHighlights(handleEmbeds(handleWikilinks(text.value)));
  }
}

/** 处理 blockquote 中的 callout 语法 */
function processCallouts(tree: Root): void {
  if (!('children' in tree)) return;

  for (const node of tree.children) {
    if (node.type !== 'blockquote') continue;
    const bq = node as Blockquote;
    if (bq.children.length === 0) continue;

    const firstChild = bq.children[0];
    if (firstChild.type !== 'paragraph' || firstChild.children.length === 0) continue;

    const firstText = firstChild.children[0];
    if (firstText.type !== 'text') continue;

    const match = firstText.value.match(CALLOUT_RE);
    if (!match) continue;

    const calloutType = match[1].toLowerCase();
    const title = match[2] || calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
    const emoji = CALLOUT_MAP[calloutType] ?? '\u{1F4CC}';

    // 替换第一行文本为格式化标题
    firstText.value = `**${emoji} ${title}**`;
  }
}

/**
 * remark 插件入口
 */
export default function remarkObsidian() {
  return (tree: Root) => {
    processCallouts(tree);
    processInlineNodes(tree);
  };
}
