import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Linear SDK for integration tests
jest.unstable_mockModule('@linear/sdk', () => ({
  LinearClient: jest.fn(),
}));

describe('MCP Server Integration', () => {
  let mockLinearClient: any;
  let server: any;
  
  beforeEach(async () => {
    // Setup mock Linear client
    mockLinearClient = {
      teams: jest.fn().mockResolvedValue({ 
        nodes: [
          { id: 'team-1', name: 'Engineering', key: 'ENG', description: 'Engineering team' }
        ]
      }),
      issues: jest.fn().mockResolvedValue({ 
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
      }),
      createIssue: jest.fn().mockResolvedValue({
        issue: {
          id: 'new-issue',
          identifier: 'ENG-999',
          title: 'New issue',
          url: 'https://linear.app/issue/ENG-999',
        }
      }),
      updateIssue: jest.fn().mockResolvedValue({
        issue: {
          id: 'issue-1',
          identifier: 'ENG-123',
          title: 'Updated issue',
          url: 'https://linear.app/issue/ENG-123',
          state: Promise.resolve({ name: 'Done' }),
        }
      }),
      viewer: { id: 'user-1', name: 'Test User' },
    };
    
    // Mock LinearClient constructor
    const { LinearClient } = await import('@linear/sdk');
    (LinearClient as jest.Mock).mockImplementation(() => mockLinearClient);
    
    // Create a test server instance (not the full MCP server)
    // We'll test the helper functions directly
  });

  describe('Tool Functions', () => {
    let searchIssues: any;
    let createIssue: any;
    let updateIssue: any;
    let getTeams: any;
    let getMyIssues: any;

    beforeEach(async () => {
      // We can't easily test the full MCP server due to its singleton nature
      // So we'll test the core functionality through the service layer
      const serviceModule = await import('../../src/services/linearService.js');
      const linearService = serviceModule.linearService;
      
      // Create wrapper functions that mimic the MCP tool functions
      searchIssues = async (args: any) => {
        const issues = await linearService.searchIssues(
          args.query,
          args.teamId,
          args.status,
          args.assigneeId,
          args.limit
        );
        
        // Simulate the formatting that happens in the real MCP server
        const formattedIssues = await Promise.all(
          issues.map(async (issue: any) => ({
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            url: issue.url,
            createdAt: issue.createdAt,
            status: issue.state ? (await issue.state).name : undefined,
            assignee: issue.assignee ? (await issue.assignee).name : undefined,
            team: issue.team ? await issue.team : undefined,
            project: issue.project ? await issue.project : undefined,
          }))
        );
        
        return { issues: formattedIssues };
      };
      
      createIssue = async (args: any) => {
        const issue = await linearService.createIssue(
          args.teamId,
          args.title,
          args.description,
          args.assigneeId,
          args.priority
        );
        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
        };
      };
      
      updateIssue = async (args: any) => {
        const issue = await linearService.updateIssue(args.issueId, {
          title: args.title,
          description: args.description,
          assigneeId: args.assigneeId,
          priority: args.priority,
          stateId: args.stateId,
        });
        const state = issue.state ? await issue.state : null;
        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          url: issue.url,
          status: state?.name,
        };
      };
      
      getTeams = async () => {
        const teams = await linearService.getTeams();
        return {
          teams: teams.map(team => ({
            id: team.id,
            name: team.name,
            key: team.key,
            description: team.description,
          }))
        };
      };
      
      getMyIssues = async (args: any) => {
        return searchIssues({ 
          query: '', 
          assigneeId: 'me', 
          limit: args.limit || 50 
        });
      };
    });

    describe('search_issues', () => {
      it('should search and format issues correctly', async () => {
        // Act
        const result = await searchIssues({
          query: 'test',
          teamId: 'team-1',
          limit: 10,
        });

        // Assert
        expect(result).toEqual({
          issues: [
            {
              id: 'issue-1',
              identifier: 'ENG-123',
              title: 'Test issue',
              description: 'Test description',
              url: 'https://linear.app/issue/ENG-123',
              createdAt: '2023-01-01T00:00:00Z',
              status: 'In Progress',
              assignee: 'John Doe',
              team: { id: 'team-1', name: 'Engineering', key: 'ENG' },
              project: null,
            }
          ]
        });

        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 10,
          filter: {
            team: { id: { eq: 'team-1' } },
            title: { containsIgnoreCase: 'test' },
          },
        });
      });
    });

    describe('create_issue', () => {
      it('should create issue with correct parameters', async () => {
        // Act
        const result = await createIssue({
          teamId: 'team-1',
          title: 'New Test Issue',
          description: 'Description',
          assigneeId: 'user-1',
          priority: 2,
        });

        // Assert
        expect(result).toEqual({
          id: 'new-issue',
          identifier: 'ENG-999',
          title: 'New issue',
          url: 'https://linear.app/issue/ENG-999',
        });

        expect(mockLinearClient.createIssue).toHaveBeenCalledWith({
          teamId: 'team-1',
          title: 'New Test Issue',
          description: 'Description',
          assigneeId: 'user-1',
          priority: 2,
        });
      });
    });

    describe('update_issue', () => {
      it('should update issue with correct parameters', async () => {
        // Act
        const result = await updateIssue({
          issueId: 'issue-1',
          title: 'Updated Title',
          priority: 3,
        });

        // Assert
        expect(result).toEqual({
          id: 'issue-1',
          identifier: 'ENG-123',
          title: 'Updated issue',
          url: 'https://linear.app/issue/ENG-123',
          status: 'Done',
        });

        expect(mockLinearClient.updateIssue).toHaveBeenCalledWith('issue-1', {
          title: 'Updated Title',
          priority: 3,
        });
      });
    });

    describe('get_teams', () => {
      it('should return formatted teams', async () => {
        // Act
        const result = await getTeams();

        // Assert
        expect(result).toEqual({
          teams: [
            {
              id: 'team-1',
              name: 'Engineering',
              key: 'ENG',
              description: 'Engineering team',
            }
          ]
        });

        expect(mockLinearClient.teams).toHaveBeenCalledTimes(1);
      });
    });

    describe('get_my_issues', () => {
      it('should get issues assigned to current user', async () => {
        // Act
        const result = await getMyIssues({ limit: 20 });

        // Assert
        expect(result.issues).toHaveLength(1);
        expect(mockLinearClient.issues).toHaveBeenCalledWith({
          first: 20,
          filter: {
            assignee: { id: { eq: 'user-1' } },
            title: { containsIgnoreCase: '' },
          },
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Linear API errors gracefully', async () => {
      // Arrange
      const serviceModule = await import('../../src/services/linearService.js');
      const linearService = serviceModule.linearService;
      
      mockLinearClient.teams.mockRejectedValue(new Error('API Error'));

      // Act & Assert
      await expect(linearService.getTeams()).rejects.toThrow();
    });
  });
}); 