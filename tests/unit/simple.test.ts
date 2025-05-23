import { describe, it, expect } from '@jest/globals';

describe('Simple Tests', () => {
  describe('Basic functionality', () => {
    it('should perform basic arithmetic', () => {
      expect(2 + 2).toBe(4);
    });

    it('should handle string operations', () => {
      const input = 'Linear MCP Server';
      expect(input.toLowerCase()).toBe('linear mcp server');
      expect(input.split(' ')).toHaveLength(3);
    });

    it('should work with async operations', async () => {
      const promise = Promise.resolve('test result');
      const result = await promise;
      expect(result).toBe('test result');
    });
  });

  describe('Type validation', () => {
    it('should validate issue-like objects', () => {
      const mockIssue = {
        id: 'issue-1',
        identifier: 'ENG-123',
        title: 'Test Issue',
        description: 'Test Description',
        url: 'https://linear.app/issue/ENG-123',
      };

      expect(mockIssue).toMatchObject({
        id: expect.any(String),
        identifier: expect.stringMatching(/^[A-Z]+-\d+$/),
        title: expect.any(String),
        url: expect.stringContaining('linear.app'),
      });
    });

    it('should validate team-like objects', () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Engineering',
        key: 'ENG',
        description: 'Engineering team',
      };

      expect(mockTeam).toEqual({
        id: 'team-1',
        name: 'Engineering',
        key: 'ENG',
        description: 'Engineering team',
      });
    });
  });

  describe('Error handling patterns', () => {
    it('should handle thrown errors', () => {
      const throwError = () => {
        throw new Error('Test error');
      };

      expect(throwError).toThrow('Test error');
      expect(throwError).toThrow(Error);
    });

    it('should handle async errors', async () => {
      const asyncError = async () => {
        throw new Error('Async error');
      };

      await expect(asyncError()).rejects.toThrow('Async error');
    });
  });

  describe('Environment variables', () => {
    it('should access test environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.LINEAR_API_KEY).toBe('test-api-key');
      expect(process.env.LOG_LEVEL).toBe('error');
    });
  });
}); 