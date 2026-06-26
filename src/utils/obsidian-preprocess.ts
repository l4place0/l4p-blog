/**
 * Obsidian 语法预处理器
 * 将 Obsidian 特有语法转换为标准 Markdown/MDX
 */

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp)$/i;

/**
 * Wikilinks: [[target]] -> [target](target)
 *            [[target|alias]] -> [alias](target)
 * 不处理以 ! 开头的嵌入（由 handleEmbeds 处理）
 */
export function handleWikilinks(content: string): string {
  // Negative lookbehind to skip ![[ which is an embed
  return content.replace(/(?<!!)\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_match, target, alias) => {
    const display = alias ?? target;
    return `[${display}](${target})`;
  });
}

/**
 * 嵌入: ![[image.png]] -> ![image](/attachments/image.png)
 *        ![[page]] -> [page](page)（非图片嵌入转为链接）
 */
export function handleEmbeds(content: string): string {
  return content.replace(/!\[\[([^\]]+?)\]\]/g, (_match, target) => {
    if (IMAGE_EXTENSIONS.test(target)) {
      const alt = target.replace(/\.[^.]+$/, '');
      const encoded = `/attachments/${encodeURIComponent(target)}`;
      return `![${alt}](${encoded})`;
    }
    // Non-image embed -> plain link
    return `[${target}](${target})`;
  });
}

/**
 * Callouts:
 *   > [!note] Title
 *   > content
 * 转换为带 emoji 的粗体标题
 */
export function handleCallouts(content: string): string {
  const calloutMap: Record<string, string> = {
    note: '📝',
    tip: '💡',
    warning: '⚠️',
    danger: '🚨',
    info: 'ℹ️',
    quote: '💬',
  };

  const lines = content.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const match = lines[i].match(/^>\s*\[!([a-z]+)\]\s*(.*)$/i);
    if (match) {
      const type = match[1].toLowerCase();
      const title = match[2] || type.charAt(0).toUpperCase() + type.slice(1);
      const emoji = calloutMap[type] ?? '📌';
      result.push(`> **${emoji} ${title}**`);
      i++;
      // Consume continuation lines starting with >
      while (i < lines.length && lines[i].startsWith('>')) {
        result.push(lines[i]);
        i++;
      }
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join('\n');
}

/**
 * 高亮: ==text== -> <mark>text</mark>
 * == 两侧不能有空格（避免匹配 a == b 这样的比较运算符）
 * 不处理代码块中的高亮
 */
export function handleHighlights(content: string): string {
  // Split by code fences to avoid transforming inside code blocks
  const parts = content.split(/(```[\s\S]*?```|`[^`\n]+`)/g);

  return parts
    .map((part, index) => {
      // Odd indices are code blocks — leave untouched
      if (index % 2 !== 0) return part;
      // == 两侧不能有空格，内容不能跨行且不能包含 ==
      return part.replace(/==(\S(?:[^=\n]*?\S)?)==/g, '<mark>$1</mark>');
    })
    .join('');
}

/**
 * 主函数：依次应用所有转换
 */
export function preprocessObsidian(content: string): string {
  let result = content;
  result = handleEmbeds(result);     // 先处理嵌入，避免 wikilink 正则干扰
  result = handleWikilinks(result);
  result = handleCallouts(result);
  result = handleHighlights(result);
  return result;
}
