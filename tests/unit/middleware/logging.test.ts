import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { requestLogger, errorLogger } from '../../../src/middleware/logging.js';
import type { Request, Response } from 'express';

describe('Logging middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockRequest = {
      method: 'POST',
      url: '/api/test',
      body: { test: 'data' },
      query: {},
      params: {},
    };

    mockResponse = {
      statusCode: 200,
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('requestLogger', () => {
    it('should log incoming request', () => {
      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should override response.send to log response', () => {
      // Arrange
      const originalSend = jest.fn();
      mockResponse.send = originalSend;

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.send).not.toBe(originalSend);
      expect(typeof mockResponse.send).toBe('function');
    });

    it('should call original send function when response is sent', () => {
      // Arrange
      const originalSend = jest.fn().mockReturnThis();
      mockResponse.send = originalSend;

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      const responseBody = { result: 'success' };
      mockResponse.send!(responseBody as any);

      // Assert
      expect(originalSend).toHaveBeenCalledWith(responseBody);
    });

    it('should not log body for GET requests', () => {
      // Arrange
      mockRequest.method = 'GET';
      mockRequest.body = { test: 'should not be logged' };

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with query parameters', () => {
      // Arrange
      mockRequest.query = { search: 'test', limit: '10' };

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests with route params', () => {
      // Arrange
      mockRequest.params = { id: '123', action: 'update' };

      // Act
      requestLogger(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('errorLogger', () => {
    it('should log error and call next', () => {
      // Arrange
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      // Act
      errorLogger(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should log error with request details', () => {
      // Arrange
      const error = new Error('Test error');
      mockRequest.method = 'POST';
      mockRequest.url = '/api/test';
      mockRequest.params = { id: '123' };
      mockRequest.query = { filter: 'active' };
      mockRequest.body = { data: 'test' };

      // Act
      errorLogger(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle errors without stack trace', () => {
      // Arrange
      const error = new Error('Test error');
      delete error.stack;

      // Act
      errorLogger(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle errors in production mode', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const error = new Error('Production error');
      error.stack = 'This should not be logged in production';

      // Act
      errorLogger(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });
});
