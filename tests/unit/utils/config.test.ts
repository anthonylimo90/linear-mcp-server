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

  it('should load default configuration', () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    delete require.cache[require.resolve('../../../src/utils/config.js')];
    
    // Act
    const config = require('../../../src/utils/config.js').default;
    
    // Assert
    expect(config).toMatchObject({
      port: 3000,
      logLevel: 'info',
      linearApiKey: 'test-key',
      enableRateLimit: false,
      rateLimitMax: 100,
      rateLimitWindowMs: 60000,
      environment: 'test', // Set in setup.ts
    });
  });

  it('should load custom environment variables', () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'custom-key';
    process.env.PORT = '4000';
    process.env.LOG_LEVEL = 'debug';
    process.env.ENABLE_RATE_LIMIT = 'true';
    process.env.RATE_LIMIT_MAX = '200';
    process.env.RATE_LIMIT_WINDOW_MS = '120000';
    process.env.NODE_ENV = 'production';
    delete require.cache[require.resolve('../../../src/utils/config.js')];
    
    // Act
    const config = require('../../../src/utils/config.js').default;
    
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

  it('should parse boolean values correctly', () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    process.env.ENABLE_RATE_LIMIT = 'false';
    delete require.cache[require.resolve('../../../src/utils/config.js')];
    
    // Act
    const config = require('../../../src/utils/config.js').default;
    
    // Assert
    expect(config.enableRateLimit).toBe(false);
  });

  it('should parse numeric values correctly', () => {
    // Arrange
    process.env.LINEAR_API_KEY = 'test-key';
    process.env.PORT = 'invalid-number';
    delete require.cache[require.resolve('../../../src/utils/config.js')];
    
    // Act
    const config = require('../../../src/utils/config.js').default;
    
    // Assert
    expect(config.port).toBeNaN();
  });
}); 