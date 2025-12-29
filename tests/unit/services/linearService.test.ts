import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LinearClient } from '@linear/sdk';

// Mock the Linear SDK
jest.mock('@linear/sdk', () => {
  return {
    LinearClient: jest.fn(),
  };
});

// Import after mocking
import { LinearService } from '../../../src/services/linearService.js';

describe('LinearService', () => {
  let mockLinearClient: any;
  let service: LinearService;

  beforeEach(() => {
    // Reset the singleton instance
    LinearService.resetInstance();

    // Reset all mocks
    jest.clearAllMocks();

    // Create mock client methods
    mockLinearClient = {
      teams: jest.fn(),
      issues: jest.fn(),
      createIssue: jest.fn(),
      updateIssue: jest.fn(),
      issue: jest.fn(),
      team: jest.fn(),
      createComment: jest.fn(),
      viewer: { id: 'test-user', name: 'Test User' },
    };

    // Mock the LinearClient constructor
    (LinearClient as unknown as jest.Mock).mockImplementation(() => mockLinearClient);

    // Create a new instance (this will use the mocked constructor)
    service = LinearService.getInstance();
  });

  describe('getTeams', () => {
    it('should return teams from Linear API', async () => {
      // Arrange
      const mockTeams = [
        { id: 'team-1', name: 'Engineering', key: 'ENG', description: 'Engineering team' },
        { id: 'team-2', name: 'Product', key: 'PRO', description: 'Product team' },
      ];
      mockLinearClient.teams.mockResolvedValue({ nodes: mockTeams });

      // Act
      const result = await service.getTeams();

      // Assert
      expect(result).toEqual(mockTeams);
      expect(mockLinearClient.teams).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      mockLinearClient.teams.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getTeams()).rejects.toThrow('Failed to fetch teams from Linear');
      // Expects 4 calls: initial + 3 retries (RETRY_CONFIG.maxRetries = 3)
      expect(mockLinearClient.teams).toHaveBeenCalledTimes(4);
    });
  });

  describe('searchIssues', () => {
    it('should search issues with filters', async () => {
      // Arrange
      const mockIssues = [
        {
          id: 'issue-1',
          identifier: 'ENG-123',
          title: 'Test issue',
          description: 'Test description',
          url: 'https://linear.app/test',
          createdAt: '2023-01-01T00:00:00Z',
        },
      ];
      mockLinearClient.issues.mockResolvedValue({ nodes: mockIssues });

      // Act
      const result = await service.searchIssues(
        'test query',
        'team-1',
        'In Progress',
        'user-1',
        10
      );

      // Assert
      expect(result).toEqual(mockIssues);
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 10,
        filter: {
          team: { id: { eq: 'team-1' } },
          state: { name: { eq: 'In Progress' } },
          assignee: { id: { eq: 'user-1' } },
          title: { containsIgnoreCase: 'test query' },
        },
      });
    });

    it('should handle "me" assignee filter', async () => {
      // Arrange
      const mockIssues: any[] = [];
      mockLinearClient.issues.mockResolvedValue({ nodes: mockIssues });

      // Act
      await service.searchIssues('test', undefined, undefined, 'me', 10);

      // Assert
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 10,
        filter: {
          assignee: { id: { eq: 'test-user' } },
          title: { containsIgnoreCase: 'test' },
        },
      });
    });

    it('should limit results to maximum of 250', async () => {
      // Arrange
      mockLinearClient.issues.mockResolvedValue({ nodes: [] });

      // Act
      await service.searchIssues('test', undefined, undefined, undefined, 1000);

      // Assert
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 250,
        filter: { title: { containsIgnoreCase: 'test' } },
      });
    });

    it('should handle empty query', async () => {
      // Arrange
      mockLinearClient.issues.mockResolvedValue({ nodes: [] });

      // Act
      await service.searchIssues('', 'team-1', undefined, undefined, 10);

      // Assert
      expect(mockLinearClient.issues).toHaveBeenCalledWith({
        first: 10,
        filter: {
          team: { id: { eq: 'team-1' } },
        },
      });
    });
  });

  describe('createIssue', () => {
    it('should create issue with all parameters', async () => {
      // Arrange
      const mockIssue = {
        id: 'new-issue',
        identifier: 'ENG-999',
        title: 'New issue',
        url: 'https://linear.app/new',
      };
      mockLinearClient.createIssue.mockResolvedValue({ issue: mockIssue });

      // Act
      const result = await service.createIssue(
        'team-1',
        'Test Issue',
        'Test description',
        'user-1',
        2
      );

      // Assert
      expect(result).toEqual(mockIssue);
      expect(mockLinearClient.createIssue).toHaveBeenCalledWith({
        teamId: 'team-1',
        title: 'Test Issue',
        description: 'Test description',
        assigneeId: 'user-1',
        priority: 2,
      });
    });

    it('should handle "me" assignee', async () => {
      // Arrange
      const mockIssue = { id: 'issue', identifier: 'ENG-999', title: 'Test', url: 'url' };
      mockLinearClient.createIssue.mockResolvedValue({ issue: mockIssue });

      // Act
      await service.createIssue('team-1', 'Test Issue', undefined, 'me');

      // Assert
      expect(mockLinearClient.createIssue).toHaveBeenCalledWith({
        teamId: 'team-1',
        title: 'Test Issue',
        assigneeId: 'test-user',
      });
    });

    it('should create issue without optional parameters', async () => {
      // Arrange
      const mockIssue = { id: 'issue', identifier: 'ENG-999', title: 'Test', url: 'url' };
      mockLinearClient.createIssue.mockResolvedValue({ issue: mockIssue });

      // Act
      await service.createIssue('team-1', 'Test Issue');

      // Assert
      expect(mockLinearClient.createIssue).toHaveBeenCalledWith({
        teamId: 'team-1',
        title: 'Test Issue',
      });
    });

    it('should throw error when API returns no issue', async () => {
      // Arrange
      mockLinearClient.createIssue.mockResolvedValue({ issue: null });

      // Act & Assert
      await expect(service.createIssue('team-1', 'Test Issue')).rejects.toThrow(
        'Failed to create issue'
      );
    });

    it('should handle API errors', async () => {
      // Arrange
      mockLinearClient.createIssue.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(service.createIssue('team-1', 'Test Issue')).rejects.toThrow(
        'Failed to create issue in Linear'
      );
    });
  });

  describe('updateIssue', () => {
    it('should update issue with provided fields', async () => {
      // Arrange
      const mockIssue = {
        id: 'issue-1',
        identifier: 'ENG-123',
        title: 'Updated title',
        url: 'url',
      };
      mockLinearClient.updateIssue.mockResolvedValue({ issue: mockIssue });

      // Act
      const result = await service.updateIssue('issue-1', {
        title: 'Updated title',
        description: 'Updated description',
        priority: 3,
      });

      // Assert
      expect(result).toEqual(mockIssue);
      expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
        title: 'Updated title',
        description: 'Updated description',
        priority: 3,
      });
    });

    it('should handle unassigning issue', async () => {
      // Arrange
      const mockIssue = { id: 'issue-1', identifier: 'ENG-123', title: 'Test', url: 'url' };
      mockLinearClient.updateIssue.mockResolvedValue({ issue: mockIssue });

      // Act
      await service.updateIssue('issue-1', { assigneeId: '' });

      // Assert
      expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
        assigneeId: null,
      });
    });

    it('should handle "me" assignee', async () => {
      // Arrange
      const mockIssue = { id: 'issue-1', identifier: 'ENG-123', title: 'Test', url: 'url' };
      mockLinearClient.updateIssue.mockResolvedValue({ issue: mockIssue });

      // Act
      await service.updateIssue('issue-1', { assigneeId: 'me' });

      // Assert
      expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
        assigneeId: 'test-user',
      });
    });

    it('should throw error when API returns no issue', async () => {
      // Arrange
      mockLinearClient.updateIssue.mockResolvedValue({ issue: null });

      // Act & Assert
      await expect(service.updateIssue('issue-1', { title: 'Test' })).rejects.toThrow(
        'Failed to update issue'
      );
    });

    it('should handle API errors', async () => {
      // Arrange
      mockLinearClient.updateIssue.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(service.updateIssue('issue-1', { title: 'Test' })).rejects.toThrow(
        'Failed to update issue in Linear'
      );
    });
  });

  describe('getViewer', () => {
    it('should return current user', async () => {
      // Act
      const result = await service.getViewer();

      // Assert
      expect(result).toEqual({ id: 'test-user', name: 'Test User' });
    });
  });

  describe('getIssue', () => {
    it('should return issue by ID', async () => {
      // Arrange
      const mockIssue = {
        id: 'issue-1',
        identifier: 'ENG-123',
        title: 'Test issue',
        description: 'Test description',
        url: 'https://linear.app/test',
      };
      mockLinearClient.issue.mockResolvedValue(mockIssue);

      // Act
      const result = await service.getIssue('issue-1');

      // Assert
      expect(result).toEqual(mockIssue);
      expect(mockLinearClient.issue).toHaveBeenCalledWith('issue-1');
    });

    it('should throw error when issue not found', async () => {
      // Arrange
      mockLinearClient.issue.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getIssue('nonexistent')).rejects.toThrow('Issue not found');
    });

    it('should handle API errors', async () => {
      // Arrange
      mockLinearClient.issue.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(service.getIssue('issue-1')).rejects.toThrow(
        'Failed to fetch issue from Linear'
      );
    });
  });

  describe('getWorkflowStates', () => {
    it('should return workflow states for team', async () => {
      // Arrange
      const mockStates = [
        { id: 'state-1', name: 'Todo', type: 'backlog' },
        { id: 'state-2', name: 'In Progress', type: 'started' },
        { id: 'state-3', name: 'Done', type: 'completed' },
      ];
      const statesMethod: any = jest.fn();
      statesMethod.mockResolvedValue({ nodes: mockStates });
      const mockTeam = {
        id: 'team-1',
        name: 'Engineering',
        states: statesMethod,
      };
      mockLinearClient.team.mockResolvedValue(mockTeam);

      // Act
      const result = await service.getWorkflowStates('team-1');

      // Assert
      expect(result).toEqual(mockStates);
      expect(mockLinearClient.team).toHaveBeenCalledWith('team-1');
      expect(mockTeam.states).toHaveBeenCalled();
    });

    it('should cache workflow states for 15 minutes', async () => {
      // Arrange
      const mockStates = [{ id: 'state-1', name: 'Todo', type: 'backlog' }];
      const statesMethod: any = jest.fn();
      statesMethod.mockResolvedValue({ nodes: mockStates });
      const mockTeam = {
        id: 'team-1',
        states: statesMethod,
      };
      mockLinearClient.team.mockResolvedValue(mockTeam);

      // Act
      const result1 = await service.getWorkflowStates('team-1');
      const result2 = await service.getWorkflowStates('team-1');

      // Assert
      expect(result1).toEqual(mockStates);
      expect(result2).toEqual(mockStates);
      expect(mockLinearClient.team).toHaveBeenCalledTimes(1); // Called only once due to caching
    });

    it('should throw error when team not found', async () => {
      // Arrange
      mockLinearClient.team.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getWorkflowStates('nonexistent')).rejects.toThrow('Team not found');
    });

    it('should handle API errors', async () => {
      // Arrange
      mockLinearClient.team.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(service.getWorkflowStates('team-1')).rejects.toThrow(
        'Failed to fetch workflow states from Linear'
      );
    });
  });

  describe('addComment', () => {
    it('should add comment to issue', async () => {
      // Arrange
      const mockComment = {
        id: 'comment-1',
        body: 'Test comment',
        createdAt: '2023-01-01T00:00:00Z',
      };
      mockLinearClient.createComment.mockResolvedValue({ comment: mockComment });

      // Act
      const result = await service.addComment('issue-1', 'Test comment');

      // Assert
      expect(result).toEqual(mockComment);
      expect(mockLinearClient.createComment).toHaveBeenCalledWith({
        issueId: 'issue-1',
        body: 'Test comment',
      });
    });

    it('should throw error when API returns no comment', async () => {
      // Arrange
      mockLinearClient.createComment.mockResolvedValue({ comment: null });

      // Act & Assert
      await expect(service.addComment('issue-1', 'Test comment')).rejects.toThrow(
        'Failed to create comment'
      );
    });

    it('should handle API errors', async () => {
      // Arrange
      mockLinearClient.createComment.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(service.addComment('issue-1', 'Test comment')).rejects.toThrow(
        'Failed to add comment to issue in Linear'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when API is accessible', async () => {
      // Act
      const result = await service.healthCheck();

      // Assert
      expect(result).toEqual({
        status: 'healthy',
        apiConnected: true,
        userId: 'test-user',
        userName: 'Test User',
      });
    });

    it('should return unhealthy status when API is not accessible', async () => {
      // Arrange
      const mockError = new Error('Connection failed');
      mockLinearClient.viewer = Promise.reject(mockError);

      // Reset instance with new mock
      LinearService.resetInstance();
      (LinearClient as unknown as jest.Mock).mockImplementation(() => mockLinearClient);
      service = LinearService.getInstance();

      // Act
      const result = await service.healthCheck();

      // Assert
      expect(result.status).toBe('unhealthy');
      expect(result.apiConnected).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('caching', () => {
    it('should cache teams for 10 minutes', async () => {
      // Arrange
      const mockTeams = [
        { id: 'team-1', name: 'Engineering', key: 'ENG' },
        { id: 'team-2', name: 'Product', key: 'PRO' },
      ];
      mockLinearClient.teams.mockResolvedValue({ nodes: mockTeams });

      // Act
      const result1 = await service.getTeams();
      const result2 = await service.getTeams();

      // Assert
      expect(result1).toEqual(mockTeams);
      expect(result2).toEqual(mockTeams);
      expect(mockLinearClient.teams).toHaveBeenCalledTimes(1); // Called only once due to caching
    });
  });
});
