/** 结构化日志工具 — AI 可直接解析 JSON 输出 */

export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

interface LogEntry {
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

interface LoggerConfig {
  level: LogLevel;
}

function shouldLog(current: LogLevel, threshold: LogLevel): boolean {
  return LOG_LEVELS[current] >= LOG_LEVELS[threshold];
}

function formatEntry(level: LogLevel, module: string, message: string, data?: unknown): string {
  const entry: LogEntry = {
    level,
    module,
    message,
    timestamp: new Date().toISOString(),
  };
  if (data !== undefined) entry.data = data;
  return JSON.stringify(entry);
}

export function createLogger(config: LoggerConfig) {
  return {
    debug(module: string, message: string, data?: unknown) {
      if (shouldLog('debug', config.level)) {
        console.log(formatEntry('debug', module, message, data));
      }
    },
    info(module: string, message: string, data?: unknown) {
      if (shouldLog('info', config.level)) {
        console.log(formatEntry('info', module, message, data));
      }
    },
    warn(module: string, message: string, data?: unknown) {
      if (shouldLog('warn', config.level)) {
        console.log(formatEntry('warn', module, message, data));
      }
    },
    error(module: string, message: string, data?: unknown) {
      if (shouldLog('error', config.level)) {
        console.log(formatEntry('error', module, message, data));
      }
    },
  };
}

const envLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
export const logger = createLogger({ level: envLevel });
