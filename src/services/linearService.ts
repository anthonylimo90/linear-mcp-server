import { LinearClient, Team, Issue, User } from '@linear/sdk';
import config from '../utils/config.js';
import { logger, AppError } from '../utils/logger.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Service class for interacting with the Linear API
 */
export class LinearService {
  private client: LinearClient;
  private static instance: LinearService;

  private constructor() {
    this.client = new LinearClient({ apiKey: config.linearApiKey });
    logger.info('LinearService initialized');
  }

  /**
   * Get singleton instance of LinearService
   */
  public static getInstance(): LinearService {
    if (!LinearService.instance) {
      LinearService.instance = new LinearService();
    }
    return LinearService.instance;
  }

  /**
   * Get all teams from Linear
   */
  public async getTeams(): Promise<Team[]> {
    try {
      logger.debug('Fetching teams from Linear');
      const teams = await this.client.teams();
      return teams.nodes;
    } catch (error) {
      logger.error('Failed to fetch teams from Linear', error instanceof Error ? { error } : undefined);
      throw new AppError('Failed to fetch teams from Linear', 500, String(ErrorCode.InternalError), error);
    }
  }

  /**
   * Search issues in Linear
   */
  public async searchIssues(
    query: string,
    teamId?: string,
    status?: string,
    assigneeId?: string,
    limit = 10
  ): Promise<Issue[]> {
    try {
      logger.debug('Searching issues in Linear', { query, teamId, status, assigneeId, limit });

      // Build filter for the query
      let filter = '';

      if (teamId) {
        filter += ` team:${teamId}`;
      }

      if (status) {
        filter += ` state:${status}`;
      }

      if (assigneeId) {
        if (assigneeId === 'me') {
          const viewer = await this.client.viewer;
          filter += ` assignee:${viewer.id}`;
        } else {
          filter += ` assignee:${assigneeId}`;
        }
      }

      // Combine user query with filter
      const fullQuery = `${query}${filter}`;
      
      // The Linear SDK types don't match actual API functionality
      // Use type assertion for the filter
      const issues = await this.client.issues({
        first: limit,
        filter: {
          search: {
            query: fullQuery
          }
        } as any
      });

      return issues.nodes;
    } catch (error) {
      logger.error('Failed to search issues in Linear', error instanceof Error ? { error } : undefined);
      throw new AppError('Failed to search issues in Linear', 500, String(ErrorCode.InternalError), error);
    }
  }

  /**
   * Create a new issue in Linear
   */
  public async createIssue(
    teamId: string,
    title: string,
    description?: string,
    assigneeId?: string,
    priority?: number
  ): Promise<Issue> {
    try {
      logger.debug('Creating issue in Linear', { teamId, title, description, assigneeId, priority });
      
      const issueInput: any = {
        teamId,
        title
      };

      if (description) issueInput.description = description;
      if (priority !== undefined) issueInput.priority = priority;
      
      if (assigneeId === "me") {
        const viewer = await this.client.viewer;
        issueInput.assigneeId = viewer.id;
      } else if (assigneeId) {
        issueInput.assigneeId = assigneeId;
      }

      const issuePayload = await this.client.createIssue(issueInput);
      const issue = issuePayload.issue;
      
      if (!issue) {
        throw new AppError('Failed to create issue', 500, String(ErrorCode.InternalError));
      }
      
      return issue;
    } catch (error) {
      logger.error('Failed to create issue in Linear', error instanceof Error ? { error } : undefined);
      throw new AppError('Failed to create issue in Linear', 500, String(ErrorCode.InternalError), error);
    }
  }

  /**
   * Get the current user (viewer) from Linear
   */
  public async getViewer(): Promise<User> {
    try {
      logger.debug('Fetching current user from Linear');
      return await this.client.viewer;
    } catch (error) {
      logger.error('Failed to fetch current user from Linear', error instanceof Error ? { error } : undefined);
      throw new AppError('Failed to fetch current user from Linear', 500, String(ErrorCode.InternalError), error);
    }
  }
}

// Export singleton instance
export const linearService = LinearService.getInstance(); 