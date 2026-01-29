/**
 * Structured Logger
 * =================
 * Server-side structured logging using pino.
 * Provides consistent log format, levels, and context.
 *
 * USAGE:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Payment failed', { error, orderId });
 *
 * LOG LEVELS (in order of severity):
 *   fatal > error > warn > info > debug > trace
 *
 * RULES:
 *   - NEVER log sensitive data (passwords, API keys, full card numbers)
 *   - ALWAYS include relevant context (userId, transactionId, etc.)
 *   - Use appropriate level (don't use error for warnings)
 */

import pino, { type Logger as PinoLogger } from 'pino';

// ============================================================
// TYPES
// ============================================================

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogContext {
  userId?: string;
  requestId?: string;
  transactionId?: string;
  operation?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export interface Logger {
  fatal: (message: string, context?: LogContext) => void;
  error: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  trace: (message: string, context?: LogContext) => void;
  child: (bindings: LogContext) => Logger;
}

// ============================================================
// CONFIGURATION
// ============================================================

function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL as LogLevel | undefined;
  const validLevels: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

  if (level && validLevels.includes(level)) return level;
  return process.env.NODE_ENV === 'development' ? 'debug' : 'info';
}

const REDACTED_FIELDS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
  'credit_card',
  'cardNumber',
  'card_number',
  'cvv',
  'ssn',
  'tin',
];

function redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const shouldRedact = REDACTED_FIELDS.some((field) =>
      lowerKey.includes(field.toLowerCase())
    );

    if (shouldRedact) {
      redacted[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

// ============================================================
// LOGGER CREATION
// ============================================================

const isServer = typeof window === 'undefined';

function createLogger(): PinoLogger {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return pino({
    level: getLogLevel(),
    base: {
      env: process.env.NODE_ENV,
      service: 'kompleet',
      version: process.env.npm_package_version || '0.0.0',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,service,version,env',
          },
        }
      : undefined,
    redact: {
      paths: REDACTED_FIELDS.map((field) => `*.${field}`),
      censor: '[REDACTED]',
    },
    serializers: {
      error: pino.stdSerializers.err,
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  });
}

function createNoopLogger(): Logger {
  const noop = (): void => {};
  return {
    fatal: noop,
    error: noop,
    warn: noop,
    info: noop,
    debug: noop,
    trace: noop,
    child: () => createNoopLogger(),
  };
}

function wrapLogger(pinoInstance: PinoLogger): Logger {
  return {
    fatal: (message, context) => pinoInstance.fatal(redactSensitiveData(context ?? {}), message),
    error: (message, context) => pinoInstance.error(redactSensitiveData(context ?? {}), message),
    warn: (message, context) => pinoInstance.warn(redactSensitiveData(context ?? {}), message),
    info: (message, context) => pinoInstance.info(redactSensitiveData(context ?? {}), message),
    debug: (message, context) => pinoInstance.debug(redactSensitiveData(context ?? {}), message),
    trace: (message, context) => pinoInstance.trace(redactSensitiveData(context ?? {}), message),
    child: (bindings) => wrapLogger(pinoInstance.child(redactSensitiveData(bindings))),
  };
}

export const logger: Logger = isServer
  ? wrapLogger(createLogger())
  : createNoopLogger();

// ============================================================
// HELPERS
// ============================================================

export function createRequestLogger(request: Request, additionalContext?: LogContext): Logger {
  return logger.child({
    requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
    method: request.method,
    url: new URL(request.url).pathname,
    ...additionalContext,
  });
}

export function createUserLogger(userId: string, additionalContext?: LogContext): Logger {
  return logger.child({ userId, ...additionalContext });
}
