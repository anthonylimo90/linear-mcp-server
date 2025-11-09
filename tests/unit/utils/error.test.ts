import { describe, it, expect } from '@jest/globals';
import { AppError, handleError } from '../../../src/utils/error.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

describe('Error utilities', () => {
  describe('AppError', () => {
    it('should create error with all parameters', () => {
      const error = new AppError(
        'Test error',
        404,
        String(ErrorCode.InvalidRequest),
        { foo: 'bar' }
      );

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(String(ErrorCode.InvalidRequest));
      expect(error.details).toEqual({ foo: 'bar' });
      expect(error.name).toBe('AppError');
    });

    it('should create error with default status code and error code', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(String(ErrorCode.InternalError));
      expect(error.details).toBeUndefined();
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 403);

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe(String(ErrorCode.InternalError));
    });

    it('should create error with custom error code', () => {
      const error = new AppError('Test error', 400, String(ErrorCode.InvalidRequest));

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(String(ErrorCode.InvalidRequest));
    });
  });

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError(
        'Custom error',
        404,
        String(ErrorCode.InvalidRequest),
        { test: 'data' }
      );

      const result = handleError(appError);

      expect(result).toEqual({
        statusCode: 404,
        code: String(ErrorCode.InvalidRequest),
        message: 'Custom error',
        details: { test: 'data' },
      });
    });

    it('should handle standard Error correctly', () => {
      const error = new Error('Standard error');

      const result = handleError(error);

      expect(result).toEqual({
        statusCode: 500,
        code: String(ErrorCode.InternalError),
        message: 'Standard error',
      });
    });

    it('should handle string errors correctly', () => {
      const result = handleError('String error');

      expect(result).toEqual({
        statusCode: 500,
        code: String(ErrorCode.InternalError),
        message: 'String error',
      });
    });

    it('should handle unknown error types correctly', () => {
      const result = handleError({ unknown: 'object' });

      expect(result).toEqual({
        statusCode: 500,
        code: String(ErrorCode.InternalError),
        message: 'An unknown error occurred',
      });
    });

    it('should handle null correctly', () => {
      const result = handleError(null);

      expect(result).toEqual({
        statusCode: 500,
        code: String(ErrorCode.InternalError),
        message: 'An unknown error occurred',
      });
    });

    it('should handle undefined correctly', () => {
      const result = handleError(undefined);

      expect(result).toEqual({
        statusCode: 500,
        code: String(ErrorCode.InternalError),
        message: 'An unknown error occurred',
      });
    });

    it('should handle number errors correctly', () => {
      const result = handleError(42);

      expect(result).toEqual({
        statusCode: 500,
        code: String(ErrorCode.InternalError),
        message: 'An unknown error occurred',
      });
    });
  });
});
