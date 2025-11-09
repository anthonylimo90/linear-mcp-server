import { describe, it, expect } from '@jest/globals';
import {
  SearchIssuesSchema,
  CreateIssueSchema,
  UpdateIssueSchema,
  GetMyIssuesSchema,
  GetIssueSchema,
  GetWorkflowStatesSchema,
  AddCommentSchema,
} from '../../../src/utils/validation.js';

describe('Validation Schemas', () => {
  describe('SearchIssuesSchema', () => {
    it('should validate valid search issues input', () => {
      const validInput = {
        query: 'bug',
        teamId: 'team-123',
        status: 'In Progress',
        assigneeId: 'user-456',
        limit: 50,
      };

      const result = SearchIssuesSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty query', () => {
      const invalidInput = {
        query: '',
      };

      const result = SearchIssuesSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should apply default limit of 50', () => {
      const input = {
        query: 'test',
      };

      const result = SearchIssuesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit over 250', () => {
      const invalidInput = {
        query: 'test',
        limit: 300,
      };

      const result = SearchIssuesSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const invalidInput = {
        query: 'test',
        limit: -10,
      };

      const result = SearchIssuesSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateIssueSchema', () => {
    it('should validate valid create issue input', () => {
      const validInput = {
        teamId: 'team-123',
        title: 'Fix the bug',
        description: 'This is a description',
        assigneeId: 'user-456',
        priority: 2,
      };

      const result = CreateIssueSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty team ID', () => {
      const invalidInput = {
        teamId: '',
        title: 'Fix the bug',
      };

      const result = CreateIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const invalidInput = {
        teamId: 'team-123',
        title: '',
      };

      const result = CreateIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject title over 255 characters', () => {
      const invalidInput = {
        teamId: 'team-123',
        title: 'a'.repeat(256),
      };

      const result = CreateIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject priority outside 0-4 range', () => {
      const invalidInput = {
        teamId: 'team-123',
        title: 'Fix the bug',
        priority: 5,
      };

      const result = CreateIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should allow priority within 0-4 range', () => {
      const validInput = {
        teamId: 'team-123',
        title: 'Fix the bug',
        priority: 0,
      };

      const result = CreateIssueSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateIssueSchema', () => {
    it('should validate valid update issue input', () => {
      const validInput = {
        issueId: 'issue-123',
        title: 'Updated title',
        description: 'Updated description',
        priority: 3,
      };

      const result = UpdateIssueSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty issue ID', () => {
      const invalidInput = {
        issueId: '',
        title: 'Updated title',
      };

      const result = UpdateIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should allow null assigneeId', () => {
      const validInput = {
        issueId: 'issue-123',
        assigneeId: null,
      };

      const result = UpdateIssueSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject title over 255 characters', () => {
      const invalidInput = {
        issueId: 'issue-123',
        title: 'a'.repeat(256),
      };

      const result = UpdateIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('GetMyIssuesSchema', () => {
    it('should validate valid input', () => {
      const validInput = {
        limit: 25,
      };

      const result = GetMyIssuesSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should apply default limit of 50', () => {
      const input = {};

      const result = GetMyIssuesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should reject limit over 250', () => {
      const invalidInput = {
        limit: 300,
      };

      const result = GetMyIssuesSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('GetIssueSchema', () => {
    it('should validate valid issue ID', () => {
      const validInput = {
        issueId: 'issue-123',
      };

      const result = GetIssueSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty issue ID', () => {
      const invalidInput = {
        issueId: '',
      };

      const result = GetIssueSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('GetWorkflowStatesSchema', () => {
    it('should validate valid team ID', () => {
      const validInput = {
        teamId: 'team-123',
      };

      const result = GetWorkflowStatesSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty team ID', () => {
      const invalidInput = {
        teamId: '',
      };

      const result = GetWorkflowStatesSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('AddCommentSchema', () => {
    it('should validate valid comment input', () => {
      const validInput = {
        issueId: 'issue-123',
        body: 'This is a comment',
      };

      const result = AddCommentSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty issue ID', () => {
      const invalidInput = {
        issueId: '',
        body: 'This is a comment',
      };

      const result = AddCommentSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should reject empty body', () => {
      const invalidInput = {
        issueId: 'issue-123',
        body: '',
      };

      const result = AddCommentSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
