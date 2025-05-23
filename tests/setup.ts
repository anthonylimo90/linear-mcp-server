import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Suppress console.log during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Minimize logging during tests
process.env.LINEAR_API_KEY = 'test-api-key';

// Global test timeout
jest.setTimeout(30000); 