import dotenv from 'dotenv';
import { logger } from './logger.js';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  logLevel: string;
  linearApiKey: string;
  enableRateLimit: boolean;
  rateLimitMax: number;
  rateLimitWindowMs: number;
  environment: string;
}

/**
 * Application configuration settings
 */
const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  linearApiKey: process.env.LINEAR_API_KEY || '',
  enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute default
  environment: process.env.NODE_ENV || 'development',
};

// Validate required configuration values
function validateConfig() {
  if (!config.linearApiKey) {
    logger.error('Missing LINEAR_API_KEY environment variable');
    process.exit(1);
  }

  // Only log configuration in development mode to avoid interfering with MCP stdio communication
  if (config.environment === 'development' && process.env.LOG_LEVEL === 'debug') {
    logger.debug('Configuration loaded', {
      port: config.port,
      logLevel: config.logLevel,
      enableRateLimit: config.enableRateLimit,
      environment: config.environment
    });
  }
}

// Call validation on import
validateConfig();

export default config; 