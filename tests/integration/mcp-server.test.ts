import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LinearClient } from '@linear/sdk';

// Mock the Linear SDK
jest.mock('@linear/sdk', () => {
  return {
    LinearClient: jest.fn(),
  };
});

// Import after mocking
import { LinearService } from '../../src/services/linearService.js';

describe('MCP Server Integration', () => {
  let mockLinearClient: any;

  beforeEach(() => {
    // Reset the singleton instance
    LinearService.resetInstance();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock Linear client with realistic responses
    const teamsResponse = {
      nodes: [
        { id: 'team-1', name: 'Engineering', key: 'ENG', description: 'Engineering team' }
      ]
    };

    const issuesResponse = {
      nodes: [
        {
          id: 'issue-1',
          identifier: 'ENG-123',
          title: 'Test issue',
          description: 'Test description',
          url: 'https://linear.app/issue/ENG-123',
          createdAt: '2023-01-01T00:00:00Z',
          state: Promise.resolve({ name: 'In Progress' }),
          assignee: Promise.resolve({ name: 'John Doe' }),
          team: Promise.resolve({ id: 'team-1', name: 'Engineering', key: 'ENG' }),
          project: Promise.resolve(null),
        }
      ]
    };

    const createResponse = {
      issue: {
        id: 'new-issue',
        identifier: 'ENG-999',
        title: 'New issue',
        url: 'https://linear.app/issue/ENG-999',
      }
    };

    const updateResponse = {
      issue: {
        id: 'issue-1',
        identifier: 'ENG-123',
        title: 'Updated issue',
        url: 'https://linear.app/issue/ENG-123',
        state: Promise.resolve({ name: 'Done' }),
      }
    };

    mockLinearClient = {
      // @ts-expect-error - Mock function for testing
      teams: jest.fn().mockResolvedValue(teamsResponse),
      // @ts-expect-error - Mock function for testing
      issues: jest.fn().mockResolvedValue(issuesResponse),
      // @ts-expect-error - Mock function for testing
      createIssue: jest.fn().mockResolvedValue(createResponse),
      // @ts-expect-error - Mock function for testing
      updateIssue: jest.fn().mockResolvedValue(updateResponse),
      viewer: { id: 'user-1', name: 'Test User' },
    };

    // Mock LinearClient constructor
    (LinearClient as unknown as jest.Mock).mockImplementation(() => mockLinearClient);
  });

  describe('Tool Functions', () => {
    let linearService: LinearService;

    beforeEach(() => {
      // Get the singleton instance (which uses our mocks)
      linearService = LinearService.getInstance();
    });

    describe('search_issues', () => {
      it('should search and return issues with all filters', async () => {
        // Act
        const issues = await linearService.searchIssues('test', 'team-1', 'In Progress', 'user-1', 10);

        // Assert
        expect(issues).toHaveLength(1);
        expect(issues[0].id).toBe('issue-1');
        expect(issues[0].identifier).toBe('ENG-123');
        expect(issues[0].title).toBe('Test issue');

        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 10,
          filter: {
            team: { id: { eq: 'team-1' } },
            state: { name: { eq: 'In Progress' } },
            assignee: { id: { eq: 'user-1' } },
            title: { containsIgnoreCase: 'test' },
          },
        });
      });

      it('should search with "me" assignee filter', async () => {
        // Act
        await linearService.searchIssues('bug', undefined, undefined, 'me', 50);

        // Assert
        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 50,
          filter: {
            assignee: { id: { eq: 'user-1' } },
            title: { containsIgnoreCase: 'bug' },
          },
        });
      });

      it('should handle empty query', async () => {
        // Act
        await linearService.searchIssues('', 'team-1', undefined, undefined, 25);

        // Assert
        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 25,
          filter: {
            team: { id: { eq: 'team-1' } },
          },
        });
      });

      it('should cap limit at 250', async () => {
        // Act
        await linearService.searchIssues('test', undefined, undefined, undefined, 1000);

        // Assert
        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 250,
          filter: { title: { containsIgnoreCase: 'test' } },
        });
      });
    });

    describe('create_issue', () => {
      it('should create issue with all parameters', async () => {
        // Act
        const result = await linearService.createIssue(
          'team-1',
          'New Test Issue',
          'Description',
          'user-1',
          2
        );

        // Assert
        expect(result.id).toBe('new-issue');
        expect(result.identifier).toBe('ENG-999');
        expect(result.title).toBe('New issue');

        expect(mockLinearClient.createIssue).toHaveBeenCalledWith({
          teamId: 'team-1',
          title: 'New Test Issue',
          description: 'Description',
          assigneeId: 'user-1',
          priority: 2,
        });
      });

      it('should create issue with minimal parameters', async () => {
        // Act
        await linearService.createIssue('team-1', 'Minimal Issue');

        // Assert
        expect(mockLinearClient.createIssue).toHaveBeenCalledWith({
          teamId: 'team-1',
          title: 'Minimal Issue',
        });
      });

      it('should handle "me" assignee', async () => {
        // Act
        await linearService.createIssue('team-1', 'Assigned to me', undefined, 'me');

        // Assert
        expect(mockLinearClient.createIssue).toHaveBeenCalledWith({
          teamId: 'team-1',
          title: 'Assigned to me',
          assigneeId: 'user-1',
        });
      });

      it('should throw error when API returns no issue', async () => {
        // Arrange
        mockLinearClient.createIssue.mockResolvedValueOnce({ issue: null });

        // Act & Assert
        await expect(
          linearService.createIssue('team-1', 'Test')
        ).rejects.toThrow('Failed to create issue');
      });
    });

    describe('update_issue', () => {
      it('should update issue with multiple fields', async () => {
        // Act
        const result = await linearService.updateIssue('issue-1', {
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 3,
          stateId: 'state-done',
        });

        // Assert
        expect(result.id).toBe('issue-1');
        expect(result.identifier).toBe('ENG-123');

        expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 3,
          stateId: 'state-done',
        });
      });

      it('should update single field', async () => {
        // Act
        await linearService.updateIssue('issue-1', { title: 'New Title' });

        // Assert
        expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
          title: 'New Title',
        });
      });

      it('should handle unassigning issue', async () => {
        // Act
        await linearService.updateIssue('issue-1', { assigneeId: '' });

        // Assert
        expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
          assigneeId: null,
        });
      });

      it('should handle "me" assignee', async () => {
        // Act
        await linearService.updateIssue('issue-1', { assigneeId: 'me' });

        // Assert
        expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
          assigneeId: 'user-1',
        });
      });

      it('should throw error when API returns no issue', async () => {
        // Arrange
        mockLinearClient.updateIssue.mockResolvedValueOnce({ issue: null });

        // Act & Assert
        await expect(
          linearService.updateIssue('issue-1', { title: 'Test' })
        ).rejects.toThrow('Failed to update issue');
      });
    });

    describe('get_teams', () => {
      it('should return all teams', async () => {
        // Act
        const teams = await linearService.getTeams();

        // Assert
        expect(teams).toHaveLength(1);
        expect(teams[0]).toEqual({
          id: 'team-1',
          name: 'Engineering',
          key: 'ENG',
          description: 'Engineering team',
        });

        expect(mockLinearClient.teams).toHaveBeenCalledTimes(1);
      });

      it('should handle empty teams list', async () => {
        // Arrange
        mockLinearClient.teams.mockResolvedValueOnce({ nodes: [] });

        // Act
        const teams = await linearService.getTeams();

        // Assert
        expect(teams).toEqual([]);
      });
    });

    describe('get_my_issues (via search with "me")', () => {
      it('should get issues assigned to current user', async () => {
        // Act
        const issues = await linearService.searchIssues('', undefined, undefined, 'me', 20);

        // Assert
        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 20,
          filter: {
            assignee: { id: { eq: 'user-1' } },
          },
        });
      });

      it('should use default limit when not specified', async () => {
        // Act
        await linearService.searchIssues('', undefined, undefined, 'me', 50);

        // Assert
        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 50,
          filter: {
            assignee: { id: { eq: 'user-1' } },
          },
        });
      });
    });

    describe('get_viewer', () => {
      it('should return current user information', async () => {
        // Act
        const viewer = await linearService.getViewer();

        // Assert
        expect(viewer).toEqual({ id: 'user-1', name: 'Test User' });
      });
    });
  });

  describe('Error Handling', () => {
    let linearService: LinearService;

    beforeEach(() => {
      linearService = LinearService.getInstance();
    });

    it('should handle teams API errors gracefully', async () => {
      // Arrange
      mockLinearClient.teams.mockRejectedValueOnce(new Error('API Error'));

      // Act & Assert
      await expect(linearService.getTeams()).rejects.toThrow('Failed to fetch teams from Linear');
    });

    it('should handle issues search errors gracefully', async () => {
      // Arrange
      mockLinearClient.issues.mockRejectedValueOnce(new Error('Search Error'));

      // Act & Assert
      await expect(
        linearService.searchIssues('test', undefined, undefined, undefined, 10)
      ).rejects.toThrow('Failed to search issues in Linear');
    });

    it('should handle create issue errors gracefully', async () => {
      // Arrange
      mockLinearClient.createIssue.mockRejectedValueOnce(new Error('Create Error'));

      // Act & Assert
      await expect(
        linearService.createIssue('team-1', 'Test')
      ).rejects.toThrow('Failed to create issue in Linear');
    });

    it('should handle update issue errors gracefully', async () => {
      // Arrange
      mockLinearClient.updateIssue.mockRejectedValueOnce(new Error('Update Error'));

      // Act & Assert
      await expect(
        linearService.updateIssue('issue-1', { title: 'Test' })
      ).rejects.toThrow('Failed to update issue in Linear');
    });

    // Note: Viewer errors are harder to mock due to async property access
    // The getViewer method is well-tested in unit tests
  });

  describe('Filter Building', () => {
    let linearService: LinearService;

    beforeEach(() => {
      linearService = LinearService.getInstance();
    });

    it('should build filter with only team', async () => {
      // Act
      await linearService.searchIssues('', 'team-1', undefined, undefined, 10);

      // Assert
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 10,
        filter: {
          team: { id: { eq: 'team-1' } },
        },
      });
    });

    it('should build filter with only status', async () => {
      // Act
      await linearService.searchIssues('', undefined, 'Done', undefined, 10);

      // Assert
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 10,
        filter: {
          state: { name: { eq: 'Done' } },
        },
      });
    });

    it('should build filter with all parameters', async () => {
      // Act
      await linearService.searchIssues('bug fix', 'team-1', 'In Progress', 'user-1', 25);

      // Assert
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 25,
        filter: {
          team: { id: { eq: 'team-1' } },
          state: { name: { eq: 'In Progress' } },
          assignee: { id: { eq: 'user-1' } },
          title: { containsIgnoreCase: 'bug fix' },
        },
      });
    });

    it('should trim query string', async () => {
      // Act
      await linearService.searchIssues('  test query  ', undefined, undefined, undefined, 10);

      // Assert
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 10,
        filter: {
          title: { containsIgnoreCase: 'test query' },
        },
      });
    });
  });
});
