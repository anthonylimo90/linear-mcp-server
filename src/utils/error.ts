import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Application error class that can be used to throw errors with
 * a custom status code, error code, and message.
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code: string = String(ErrorCode.InternalError),
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Convert an error to a standardized error response object
 */
export function handleError(error: unknown): ErrorResponse {
  // If it's already an AppError, use its properties
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // If it's a standard Error, convert it to our format
  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: String(ErrorCode.InternalError),
      message: error.message,
    };
  }

  // For unknown error types
  return {
    statusCode: 500,
    code: String(ErrorCode.InternalError),
    message: typeof error === 'string' ? error : 'An unknown error occurred',
  };
}
