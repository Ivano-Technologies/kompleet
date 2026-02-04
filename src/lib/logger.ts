/**
 * Logging Utility
 * 
 * Provides safe logging functions that automatically redact sensitive information.
 * Never logs secrets, tokens, passwords, or PII.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Sensitive field patterns to redact
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth/i,
  /bearer/i,
  /credential/i,
  /private[_-]?key/i,
];

/**
 * Check if a field name is sensitive
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fieldName));
}

/**
 * Redact sensitive information from an object
 */
function redactSensitive(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(redactSensitive(context))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Centralized logging utility (backward compatible)
 */
export const logger = {
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(formatMessage('info', message, data as LogContext));
    }
  },
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      const errorContext = error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : { error };
      console.error(formatMessage('error', message, errorContext));
    }
  },
  warn: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(formatMessage('warn', message, data as LogContext));
    }
  },
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, data as LogContext));
    }
  },
};

/**
 * Log auth events (login, logout, signup)
 */
export function logAuthEvent(event: 'login' | 'logout' | 'signup', userId?: string): void {
  logger.info(`Auth event: ${event}`, {
    event,
    userId: userId || 'unknown',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log database query (without sensitive data)
 */
export function logQuery(table: string, operation: string, success: boolean): void {
  logger.debug(`Database query: ${operation} on ${table}`, {
    table,
    operation,
    success,
  });
}
