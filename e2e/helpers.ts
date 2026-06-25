/** 测试辅助工具 */

/** Astro base path — 所有页面导航必须包含此前缀 */
export const BASE = '/l4p-blog';

/** 带 base path 的页面路径 */
export function page(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
