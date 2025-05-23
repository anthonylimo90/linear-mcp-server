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
    logger.debug('LinearService initialized');
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
    limit = 50
  ): Promise<Issue[]> {
    try {
      // Cap the limit at 250 for performance reasons
      const cappedLimit = Math.min(limit, 250);
      
      logger.debug('Searching issues in Linear', { query, teamId, status, assigneeId, limit: cappedLimit });

      // Build filter object using proper Linear API structure
      const filter: any = {};

      if (teamId) {
        filter.team = { id: { eq: teamId } };
      }

      if (status) {
        filter.state = { name: { eq: status } };
      }

      if (assigneeId) {
        if (assigneeId === 'me') {
          const viewer = await this.client.viewer;
          filter.assignee = { id: { eq: viewer.id } };
        } else {
          filter.assignee = { id: { eq: assigneeId } };
        }
      }

      // If there's a query, add title search
      if (query && query.trim()) {
        filter.title = { containsIgnoreCase: query.trim() };
      }

      logger.debug('Using filter', { filter });

      const issues = await this.client.issues({
        first: cappedLimit,
        filter: filter
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

  /**
   * Update an existing issue in Linear
   */
  public async updateIssue(
    issueId: string,
    updates: {
      title?: string;
      description?: string;
      assigneeId?: string;
      priority?: number;
      stateId?: string;
    }
  ): Promise<Issue> {
    try {
      logger.debug('Updating issue in Linear', { issueId, updates });
      
      const issueInput: any = {};

      if (updates.title) issueInput.title = updates.title;
      if (updates.description !== undefined) issueInput.description = updates.description;
      if (updates.priority !== undefined) issueInput.priority = updates.priority;
      if (updates.stateId) issueInput.stateId = updates.stateId;
      
      if (updates.assigneeId === "me") {
        const viewer = await this.client.viewer;
        issueInput.assigneeId = viewer.id;
      } else if (updates.assigneeId === null || updates.assigneeId === "") {
        issueInput.assigneeId = null; // Unassign
      } else if (updates.assigneeId) {
        issueInput.assigneeId = updates.assigneeId;
      }

      const issuePayload = await this.client.updateIssue(issueId, issueInput);
      const issue = issuePayload.issue;
      
      if (!issue) {
        throw new AppError('Failed to update issue', 500, String(ErrorCode.InternalError));
      }
      
      return issue;
    } catch (error) {
      logger.error('Failed to update issue in Linear', error instanceof Error ? { error } : undefined);
      throw new AppError('Failed to update issue in Linear', 500, String(ErrorCode.InternalError), error);
    }
  }
}

// Export singleton instance
export const linearService = LinearService.getInstance(); 