import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Config', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });
  
  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
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
}); 