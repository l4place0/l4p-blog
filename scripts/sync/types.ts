/** 多平台同步 CLI 类型定义 */

export interface Post {
  slug: string;
  title: string;
  description: string;
  content: string; // 原始 MDX 内容
  frontmatter: Record<string, any>;
  filePath: string; // 源文件绝对路径
}

export interface PlatformAdapter {
  name: string; // 'zhihu' | 'juejin' | ...
  transform(post: Post): string; // 内容转换：MDX -> 平台格式
  generateMetadata(post: Post): Record<string, any>; // 平台特定元数据
  outputPath(post: Post): string; // 输出文件路径
}

export interface SyncResult {
  platform: string;
  slug: string;
  status: 'synced' | 'skipped' | 'error';
  outputPath?: string;
  error?: string;
}

export interface SyncManifest {
  posts: Array<{
    slug: string;
    title: string;
    platforms: Array<{
      name: string;
      syndicated: boolean;
      date?: string;
    }>;
  }>;
}

export interface SyncOptions {
  post?: string; // 指定文章 slug
  platform?: string; // 指定平台
  dryRun?: boolean; // 预览模式
  json?: boolean; // JSON 输出
  manifest?: boolean; // 只输出清单
  force?: boolean; // 强制重新同步
}
