import { pino } from 'pino';
import type { Logger as PinoLogger } from 'pino';
import { AppError, handleError, type ErrorResponse } from './error.js';

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
    this.logger.trace(data || {}, message);
  }

  /**
   * Log at debug level
   */
  public debug(message: string, data?: object): void {
    this.logger.debug(data || {}, message);
  }

  /**
   * Log at info level
   */
  public info(message: string, data?: object): void {
    this.logger.info(data || {}, message);
  }

  /**
   * Log at warn level
   */
  public warn(message: string, data?: object): void {
    this.logger.warn(data || {}, message);
  }

  /**
   * Log at error level
   */
  public error(message: string | Error, data?: object): void {
    if (message instanceof Error) {
      const errorResponse = handleError(message);
      this.logger.error(
        {
          ...data,
          error: {
            name: message.name,
            statusCode: errorResponse.statusCode,
            code: errorResponse.code,
            stack: message.stack,
            details: errorResponse.details
          }
        },
        message.message
      );
    } else {
      this.logger.error(data || {}, message);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export error handling utilities
export { AppError, handleError, type ErrorResponse };
