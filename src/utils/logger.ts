import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';
import { AppError, handleError, type ErrorResponse } from './error.js';

/**
 * Sensitive field names that should be redacted in logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'apiKey',
  'api_key',
  'apikey',
  'LINEAR_API_KEY',
  'linearApiKey',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'privateKey',
  'private_key',
  'authorization',
  'cookie',
  'session'
];

/**
 * Redact sensitive data from log objects
 * @param data - Object that may contain sensitive data
 * @returns Redacted copy of the object
 */
function redactSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive && typeof value === 'string') {
      // Show first 4 characters, redact the rest
      redacted[key] = value.length > 4
        ? `${value.substring(0, 4)}${'*'.repeat(Math.min(value.length - 4, 20))}`
        : '****';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Logger class that wraps pino logger
 */
export class Logger {
  private static instance: Logger;
  private logger: PinoLogger;

  private constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          destination: 2,
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  /**
   * Get singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log at trace level
   */
  public trace(message: string, data?: object): void {
    this.logger.trace(data ? redactSensitiveData(data) : {}, message);
  }

  /**
   * Log at debug level
   */
  public debug(message: string, data?: object): void {
    this.logger.debug(data ? redactSensitiveData(data) : {}, message);
  }

  /**
   * Log at info level
   */
  public info(message: string, data?: object): void {
    this.logger.info(data ? redactSensitiveData(data) : {}, message);
  }

  /**
   * Log at warn level
   */
  public warn(message: string, data?: object): void {
    this.logger.warn(data ? redactSensitiveData(data) : {}, message);
  }

  /**
   * Log at error level
   */
  public error(message: string | Error, data?: object): void {
    if (message instanceof Error) {
      const errorResponse = handleError(message);
      const logData = {
        ...data,
        error: {
          name: message.name,
          statusCode: errorResponse.statusCode,
          code: errorResponse.code,
          stack: message.stack,
          details: errorResponse.details
        }
      };
      this.logger.error(redactSensitiveData(logData), message.message);
    } else {
      this.logger.error(data ? redactSensitiveData(data) : {}, message);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export error handling utilities
export { AppError, handleError, type ErrorResponse };

// Export redaction utility for testing
export { redactSensitiveData };
