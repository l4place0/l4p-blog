/** AI 友好接口 — 结构化输入输出 */

export interface AICommand {
  action: 'manifest' | 'sync' | 'status';
  post?: string;
  platform?: string;
  dryRun?: boolean;
  force?: boolean;
}

export interface AIResponse {
  success: boolean;
  action: string;
  data?: any;
  errors?: Array<{
    code: string;
    message: string;
    suggestion: string;
  }>;
  summary: {
    total: number;
    synced: number;
    skipped: number;
    failed: number;
  };
}

// 解析 AI 命令（支持 JSON stdin 和 CLI 参数）
export function parseAICommand(args: string[]): AICommand {
  // 检查 --json-input 参数（从 stdin 读取 JSON）
  const jsonInputIdx = args.indexOf('--json-input');
  if (jsonInputIdx !== -1) {
    // 实际使用时从 stdin 读取，这里简化为从参数读
    return JSON.parse(args[jsonInputIdx + 1] || '{}');
  }

  // 从 CLI 参数构建
  const cmd: AICommand = { action: 'sync' };
  for (const arg of args) {
    if (arg === '--manifest') cmd.action = 'manifest';
    else if (arg === '--status') cmd.action = 'status';
    else if (arg === '--dry-run') cmd.dryRun = true;
    else if (arg === '--force') cmd.force = true;
    else if (arg.startsWith('--post=')) cmd.post = arg.split('=')[1];
    else if (arg.startsWith('--platform=')) cmd.platform = arg.split('=')[1];
  }
  return cmd;
}

// 格式化 AI 响应
export function formatAIResponse(response: AIResponse): string {
  return JSON.stringify(response, null, 2);
}

// 错误码定义
export const ERROR_CODES = {
  POST_NOT_FOUND: {
    code: 'POST_NOT_FOUND',
    message: '指定的文章不存在',
    suggestion: '使用 --manifest 查看可用的文章列表',
  },
  PLATFORM_NOT_FOUND: {
    code: 'PLATFORM_NOT_FOUND',
    message: '指定的平台不存在',
    suggestion: '使用 --manifest 查看支持的平台列表',
  },
  ADAPTER_ERROR: {
    code: 'ADAPTER_ERROR',
    message: '平台适配器执行失败',
    suggestion: '检查文章内容是否符合平台要求',
  },
  ALREADY_SYNCED: {
    code: 'ALREADY_SYNCED',
    message: '文章已同步到该平台',
    suggestion: '使用 --force 强制重新同步',
  },
} as const;
