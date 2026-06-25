/** 阅读时长估算 — 中文 ~300字/分钟，英文 ~200词/分钟 */

const CHINESE_CHARS_PER_MIN = 300;
const ENGLISH_WORDS_PER_MIN = 200;

function countChineseChars(text: string): number {
  return (text.match(/[一-鿿]/g) || []).length;
}

function countEnglishWords(text: string): number {
  const withoutChinese = text.replace(/[一-鿿]/g, '');
  const words = withoutChinese.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

export function readingTime(content: string): string {
  if (!content.trim()) return '1 分钟';

  const chineseChars = countChineseChars(content);
  const englishWords = countEnglishWords(content);

  const minutes =
    chineseChars / CHINESE_CHARS_PER_MIN + englishWords / ENGLISH_WORDS_PER_MIN;

  return `${Math.max(1, Math.round(minutes))} 分钟`;
}
