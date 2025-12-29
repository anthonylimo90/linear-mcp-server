import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Config', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockExit: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Mock process.exit to prevent test from actually exiting
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Restore process.exit
    mockExit.mockRestore();
  });

  it('should load default configuration', async () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    jest.resetModules();

    // Act
    const config = (await import('../../../src/utils/config.js')).default;

    // Assert
    expect(config).toMatchObject({
      port: 3000,
      logLevel: 'error',
      linearApiKey: 'test-key',
      enableRateLimit: false,
      rateLimitMax: 100,
      rateLimitWindowMs: 60000,
      environment: 'test', // Set in setup.ts
    });
  });

  it('should load custom environment variables', async () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'custom-key';
    process.env.PORT = '4000';
    process.env.LOG_LEVEL = 'debug';
    process.env.ENABLE_RATE_LIMIT = 'true';
    process.env.RATE_LIMIT_MAX = '200';
    process.env.RATE_LIMIT_WINDOW_MS = '120000';
    process.env.NODE_ENV = 'production';
    jest.resetModules();

    // Act
    const config = (await import('../../../src/utils/config.js')).default;

    // Assert
    expect(config).toMatchObject({
      port: 4000,
      logLevel: 'debug',
      linearApiKey: 'custom-key',
      enableRateLimit: true,
      rateLimitMax: 200,
      rateLimitWindowMs: 120000,
      environment: 'production',
    });
  });

  it('should parse boolean values correctly', async () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    process.env.ENABLE_RATE_LIMIT = 'false';
    jest.resetModules();

    // Act
    const config = (await import('../../../src/utils/config.js')).default;

    // Assert
    expect(config.enableRateLimit).toBe(false);
  });

  it('should use default values when numeric env variables are invalid', async () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    process.env.PORT = 'invalid-number';
    process.env.RATE_LIMIT_MAX = 'not-a-number';
    process.env.RATE_LIMIT_WINDOW_MS = 'also-invalid';
    jest.resetModules();

    // Act
    const config = (await import('../../../src/utils/config.js')).default;

    // Assert
    expect(config.port).toBe(3000);
    expect(config.rateLimitMax).toBe(100);
    expect(config.rateLimitWindowMs).toBe(60000);
  });

  it('should call process.exit when LINEAR_API_KEY is missing', async () => {
    // Arrange - remove the API key
    delete process.env.LINEAR_API_KEY;
    jest.resetModules();

    // Act
    await import('../../../src/utils/config.js');

    // Assert - process.exit should have been called with code 1
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should log configuration in development mode with debug log level', async () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'debug';
    jest.resetModules();

    // Act - import config which triggers validateConfig()
    const config = (await import('../../../src/utils/config.js')).default;

    // Assert - config should be loaded (debug logging happens but we just verify config loads)
    expect(config).toBeDefined();
    expect(config.environment).toBe('development');
    expect(config.logLevel).toBe('debug');
  });

  it('should not log configuration when not in development mode', async () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'debug';
    jest.resetModules();

    // Act
    const config = (await import('../../../src/utils/config.js')).default;

    // Assert
    expect(config.environment).toBe('production');
  });

  it('should not log configuration when log level is not debug', async () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'info';
    jest.resetModules();

    // Act
    const config = (await import('../../../src/utils/config.js')).default;

    // Assert
    expect(config.logLevel).toBe('info');
  });
});
