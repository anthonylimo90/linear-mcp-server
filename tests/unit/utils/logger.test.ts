import { describe, it, expect, beforeEach } from '@jest/globals';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { Logger, redactSensitiveData, AppError, handleError } from '../../../src/utils/logger.js';

// Helper type for redacted objects in tests
type RedactedObject = Record<string, unknown>;

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    // Get the singleton instance
    logger = Logger.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('logging methods', () => {
    it('should log at trace level', () => {
      // Should not throw
      expect(() => logger.trace('Test trace message')).not.toThrow();
      expect(() => logger.trace('Test trace message', { key: 'value' })).not.toThrow();
    });

    it('should log at debug level', () => {
      expect(() => logger.debug('Test debug message')).not.toThrow();
      expect(() => logger.debug('Test debug message', { key: 'value' })).not.toThrow();
    });

    it('should log at info level', () => {
      expect(() => logger.info('Test info message')).not.toThrow();
      expect(() => logger.info('Test info message', { key: 'value' })).not.toThrow();
    });

    it('should log at warn level', () => {
      expect(() => logger.warn('Test warn message')).not.toThrow();
      expect(() => logger.warn('Test warn message', { key: 'value' })).not.toThrow();
    });

    it('should log at error level with string message', () => {
      expect(() => logger.error('Test error message')).not.toThrow();
      expect(() => logger.error('Test error message', { key: 'value' })).not.toThrow();
    });

    it('should log at error level with Error object', () => {
      const error = new Error('Test error');
      expect(() => logger.error(error)).not.toThrow();
      expect(() => logger.error(error, { additionalData: 'test' })).not.toThrow();
    });

    it('should log at error level with AppError object', () => {
      const appError = new AppError('App error message', 400, 'TEST_ERROR');
      expect(() => logger.error(appError)).not.toThrow();
      expect(() => logger.error(appError, { context: 'test' })).not.toThrow();
    });
  });
});

describe('redactSensitiveData', () => {
  describe('non-object inputs', () => {
    it('should return null as-is', () => {
      expect(redactSensitiveData(null)).toBeNull();
    });

    it('should return undefined as-is', () => {
      expect(redactSensitiveData(undefined)).toBeUndefined();
    });

    it('should return strings as-is', () => {
      expect(redactSensitiveData('hello')).toBe('hello');
    });

    it('should return numbers as-is', () => {
      expect(redactSensitiveData(42)).toBe(42);
    });

    it('should return booleans as-is', () => {
      expect(redactSensitiveData(true)).toBe(true);
      expect(redactSensitiveData(false)).toBe(false);
    });
  });

  describe('array inputs', () => {
    it('should process arrays and redact sensitive data in each item', () => {
      const input = [
        { name: 'item1', apiKey: 'secret123456' },
        { name: 'item2', password: 'pass123456' },
      ];
      const result = redactSensitiveData(input) as RedactedObject[];

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('item1');
      // "secret123456" (12 chars): 4 visible + min(8, 20) = 8 stars
      expect(result[0].apiKey).toBe('secr********');
      expect(result[1].name).toBe('item2');
      // "pass123456" (10 chars): 4 visible + min(6, 20) = 6 stars
      expect(result[1].password).toBe('pass******');
    });

    it('should handle empty arrays', () => {
      expect(redactSensitiveData([])).toEqual([]);
    });

    it('should handle arrays with non-object items', () => {
      const input = ['a', 'b', 'c'];
      expect(redactSensitiveData(input)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('object inputs', () => {
    it('should redact password fields', () => {
      const input = { username: 'user', password: 'secretpassword' };
      const result = redactSensitiveData(input) as RedactedObject;

      expect(result.username).toBe('user');
      // "secretpassword" (14 chars): 4 visible + min(10, 20) = 10 stars
      expect(result.password).toBe('secr**********');
    });

    it('should redact apiKey fields', () => {
      const input = { apiKey: 'lin_api_12345678' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "lin_api_12345678" (16 chars): 4 visible + min(12, 20) = 12 stars
      expect(result.apiKey).toBe('lin_************');
    });

    it('should redact api_key fields', () => {
      const input = { api_key: 'my_secret_key_123' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "my_secret_key_123" (17 chars): 4 visible + min(13, 20) = 13 stars
      expect(result.api_key).toBe('my_s*************');
    });

    it('should redact LINEAR_API_KEY fields', () => {
      const input = { LINEAR_API_KEY: 'lin_api_abcdefgh' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "lin_api_abcdefgh" (16 chars): 4 visible + min(12, 20) = 12 stars
      expect(result.LINEAR_API_KEY).toBe('lin_************');
    });

    it('should redact token fields', () => {
      const input = { token: 'bearer_token_value' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "bearer_token_value" (18 chars): 4 visible + min(14, 20) = 14 stars
      expect(result.token).toBe('bear**************');
    });

    it('should redact accessToken fields', () => {
      const input = { accessToken: 'access_token_12345' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "access_token_12345" (18 chars): 4 visible + min(14, 20) = 14 stars
      expect(result.accessToken).toBe('acce**************');
    });

    it('should redact refreshToken fields', () => {
      const input = { refreshToken: 'refresh_token_value' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "refresh_token_value" (19 chars): 4 visible + min(15, 20) = 15 stars
      expect(result.refreshToken).toBe('refr***************');
    });

    it('should redact secret fields', () => {
      const input = { secret: 'my_secret_value' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "my_secret_value" (15 chars): 4 visible + min(11, 20) = 11 stars
      expect(result.secret).toBe('my_s***********');
    });

    it('should redact privateKey fields', () => {
      const input = { privateKey: 'private_key_content' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "private_key_content" (19 chars): 4 visible + min(15, 20) = 15 stars
      expect(result.privateKey).toBe('priv***************');
    });

    it('should redact authorization fields', () => {
      const input = { authorization: 'Bearer xyz123456' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "Bearer xyz123456" (16 chars): 4 visible + min(12, 20) = 12 stars
      expect(result.authorization).toBe('Bear************');
    });

    it('should redact cookie fields', () => {
      const input = { cookie: 'session=abc123' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "session=abc123" (14 chars): 4 visible + min(10, 20) = 10 stars
      expect(result.cookie).toBe('sess**********');
    });

    it('should redact session fields', () => {
      const input = { session: 'session_data_here' };
      const result = redactSensitiveData(input) as RedactedObject;

      // "session_data_here" (17 chars): 4 visible + min(13, 20) = 13 stars
      expect(result.session).toBe('sess*************');
    });

    it('should handle case-insensitive field matching', () => {
      const input = {
        PASSWORD: 'uppercasepassword',
        ApiKey: 'mixedCaseKey12345',
        linearapikey: 'lowercasekey12345',
      };
      const result = redactSensitiveData(input) as RedactedObject;

      // "uppercasepassword" (17 chars): 4 visible + min(13, 20) = 13 stars
      expect(result.PASSWORD).toBe('uppe*************');
      // "mixedCaseKey12345" (17 chars): 4 visible + min(13, 20) = 13 stars
      expect(result.ApiKey).toBe('mixe*************');
      // "lowercasekey12345" (17 chars): 4 visible + min(13, 20) = 13 stars
      expect(result.linearapikey).toBe('lowe*************');
    });

    it('should handle fields containing sensitive keywords', () => {
      const input = {
        myApiKeyValue: 'some_api_key_here',
        userPassword: 'user_password_123',
      };
      const result = redactSensitiveData(input) as RedactedObject;

      expect(result.myApiKeyValue).toBe('some*************');
      expect(result.userPassword).toBe('user*************');
    });

    it('should handle short sensitive values (≤4 characters)', () => {
      const input = {
        apiKey: '1234',
        password: 'abc',
        token: 'xy',
        secret: 'z',
      };
      const result = redactSensitiveData(input) as RedactedObject;

      expect(result.apiKey).toBe('****');
      expect(result.password).toBe('****');
      expect(result.token).toBe('****');
      expect(result.secret).toBe('****');
    });

    it('should handle exactly 5 character sensitive values', () => {
      const input = { apiKey: '12345' };
      const result = redactSensitiveData(input) as RedactedObject;

      expect(result.apiKey).toBe('1234*');
    });

    it('should handle nested objects', () => {
      const input = {
        config: {
          apiKey: 'nested_api_key123',
          server: {
            password: 'deep_nested_pass',
          },
        },
      };
      const result = redactSensitiveData(input) as {
        config: { apiKey: string; server: { password: string } };
      };

      // "nested_api_key123" (17 chars): 4 visible + min(13, 20) = 13 stars
      expect(result.config.apiKey).toBe('nest*************');
      // "deep_nested_pass" (16 chars): 4 visible + min(12, 20) = 12 stars
      expect(result.config.server.password).toBe('deep************');
    });

    it('should preserve non-sensitive fields', () => {
      const input = {
        name: 'Test User',
        email: 'user@example.com',
        age: 30,
        active: true,
        apiKey: 'secret_key_12345',
      };
      const result = redactSensitiveData(input) as RedactedObject;

      expect(result.name).toBe('Test User');
      expect(result.email).toBe('user@example.com');
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      // "secret_key_12345" (16 chars): 4 visible + min(12, 20) = 12 stars
      expect(result.apiKey).toBe('secr************');
    });

    it('should handle null values in objects', () => {
      const input = {
        apiKey: null,
        password: 'test_password_123',
      };
      const result = redactSensitiveData(input) as RedactedObject;

      expect(result.apiKey).toBeNull();
      // "test_password_123" (17 chars): 4 visible + min(13, 20) = 13 stars
      expect(result.password).toBe('test*************');
    });

    it('should handle non-string sensitive values', () => {
      const input = {
        apiKey: 12345,
        password: true,
        token: { nested: 'value' },
      };
      const result = redactSensitiveData(input) as RedactedObject;

      // Non-string sensitive values are not redacted but processed recursively if objects
      expect(result.apiKey).toBe(12345);
      expect(result.password).toBe(true);
      expect(result.token).toEqual({ nested: 'value' });
    });
  });
});

describe('handleError', () => {
  it('should handle AppError instances', () => {
    const error = new AppError('Test error', 400, 'TEST_CODE');
    const result = handleError(error);

    expect(result.statusCode).toBe(400);
    expect(result.message).toBe('Test error');
    expect(result.code).toBe('TEST_CODE');
  });

  it('should handle AppError with details', () => {
    const error = new AppError('Error with details', 422, 'VALIDATION_ERROR', {
      field: 'email',
      reason: 'invalid format',
    });
    const result = handleError(error);

    expect(result.statusCode).toBe(422);
    expect(result.message).toBe('Error with details');
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.details).toEqual({ field: 'email', reason: 'invalid format' });
  });

  it('should handle generic Error instances', () => {
    const error = new Error('Generic error');
    const result = handleError(error);

    expect(result.statusCode).toBe(500);
    expect(result.message).toBe('Generic error');
    // Uses ErrorCode.InternalError from MCP SDK
    expect(result.code).toBe(String(ErrorCode.InternalError));
  });

  it('should handle unknown error types', () => {
    const result = handleError('string error');

    expect(result.statusCode).toBe(500);
    // For string errors, the message is the string itself
    expect(result.message).toBe('string error');
    expect(result.code).toBe(String(ErrorCode.InternalError));
  });

  it('should handle null/undefined errors', () => {
    const nullResult = handleError(null);
    const undefinedResult = handleError(undefined);

    expect(nullResult.statusCode).toBe(500);
    expect(nullResult.message).toBe('An unknown error occurred');
    expect(nullResult.code).toBe(String(ErrorCode.InternalError));
    expect(undefinedResult.statusCode).toBe(500);
    expect(undefinedResult.message).toBe('An unknown error occurred');
    expect(undefinedResult.code).toBe(String(ErrorCode.InternalError));
  });
});

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError('Test message', 404, 'NOT_FOUND', { id: '123' });

    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toEqual({ id: '123' });
    expect(error.name).toBe('AppError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should create error without details', () => {
    const error = new AppError('Simple error', 500, 'SERVER_ERROR');

    expect(error.message).toBe('Simple error');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('SERVER_ERROR');
    expect(error.details).toBeUndefined();
  });

  it('should have proper stack trace', () => {
    const error = new AppError('Stack trace test', 400, 'TEST');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });
});
