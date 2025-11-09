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
      expect(mockLinearClient.teams).toHaveBeenCalledTimes(1);
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
      const result = await service.searchIssues('test query', 'team-1', 'In Progress', 'user-1', 10);

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
      await expect(
        service.createIssue('team-1', 'Test Issue')
      ).rejects.toThrow('Failed to create issue');
    });

    it('should handle API errors', async () => {
      // Arrange
      mockLinearClient.createIssue.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(
        service.createIssue('team-1', 'Test Issue')
      ).rejects.toThrow('Failed to create issue in Linear');
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
      await expect(
        service.updateIssue('issue-1', { title: 'Test' })
      ).rejects.toThrow('Failed to update issue');
    });

    it('should handle API errors', async () => {
      // Arrange
      mockLinearClient.updateIssue.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(
        service.updateIssue('issue-1', { title: 'Test' })
      ).rejects.toThrow('Failed to update issue in Linear');
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
});
