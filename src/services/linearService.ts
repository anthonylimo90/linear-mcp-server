import { LinearClient, Team, Issue, User, WorkflowState, Comment } from '@linear/sdk';
import pThrottle from 'p-throttle';
import config from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/error.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Type definitions for Linear API filters and inputs
 */
interface IssueFilter {
  team?: { id: { eq: string } };
  state?: { name: { eq: string } };
  assignee?: { id: { eq: string } };
  title?: { containsIgnoreCase: string };
}

interface IssueCreateInput {
  teamId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  priority?: number;
}

interface IssueUpdateInput {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  priority?: number;
  stateId?: string;
}

// Rate limiting: 10 requests per second to be conservative with Linear API
const throttle = pThrottle({
  limit: 10,
  interval: 1000, // 1 second
});

/**
 * Retry configuration for network errors
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Cache entry with expiry time
 */
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Execute an async function with exponential backoff retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-network errors (4xx errors)
      if (lastError.message.includes('404') || lastError.message.includes('400')) {
        throw lastError;
      }

      // If we've exhausted retries, throw
      if (attempt === retries) {
        logger.error(`${context} failed after ${retries + 1} attempts`, { error: lastError });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );

      logger.warn(
        `${context} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms`,
        {
          error: lastError.message,
        }
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Helper to handle errors consistently across all methods
 */
function handleLinearError(error: unknown, context: string, params?: Record<string, any>): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorDetails = error instanceof Error ? { error } : undefined;

  logger.error(context, errorDetails);

  const paramString = params
    ? Object.entries(params)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';

  const fullMessage = paramString
    ? `${context} (${paramString}): ${errorMessage}`
    : `${context}: ${errorMessage}`;

  throw new AppError(fullMessage, 500, String(ErrorCode.InternalError), error);
}

/**
 * Service class for interacting with the Linear API
 *
 * This singleton service provides a rate-limited interface to the Linear API.
 * It includes viewer caching, error handling, and comprehensive logging.
 *
 * @example
 * ```typescript
 * const service = LinearService.getInstance();
 * const teams = await service.getTeams();
 * const issues = await service.searchIssues('bug', teamId);
 * ```
 */
export class LinearService {
  private client: LinearClient;
  private static instance: LinearService;
  private viewerCache?: User;
  private viewerCacheExpiry?: number;
  private teamsCache?: CacheEntry<Team[]>;
  private workflowStatesCache: Map<string, CacheEntry<WorkflowState[]>> = new Map();

  private static readonly VIEWER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly TEAMS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private static readonly WORKFLOW_STATES_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    this.client = new LinearClient({ apiKey: config.linearApiKey });
    logger.debug('LinearService initialized with rate limiting (10 req/sec)');
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
   * Reset singleton instance (for testing only)
   * @internal
   */
  public static resetInstance(): void {
    LinearService.instance = undefined as any;
  }

  /**
   * Get cached viewer or fetch from API if cache is expired
   * @private
   * @returns Promise resolving to current user
   */
  private async getCachedViewer(): Promise<User> {
    const now = Date.now();

    // Return cached viewer if still valid
    if (this.viewerCache && this.viewerCacheExpiry && now < this.viewerCacheExpiry) {
      logger.debug('Using cached viewer', { userId: this.viewerCache.id });
      return this.viewerCache;
    }

    // Fetch fresh viewer and update cache
    logger.debug('Fetching fresh viewer from API');
    this.viewerCache = await this.client.viewer;
    this.viewerCacheExpiry = now + LinearService.VIEWER_CACHE_TTL;

    return this.viewerCache;
  }

  /**
   * Get all teams from the Linear workspace
   *
   * Rate limited to 10 requests per second. Results are cached for 10 minutes.
   * Results include team ID, name, key, and description.
   *
   * @returns Promise resolving to array of teams
   * @throws {AppError} When API call fails
   *
   * @example
   * ```typescript
   * const teams = await linearService.getTeams();
   * teams.forEach(team => console.log(team.name, team.key));
   * ```
   */
  public async getTeams(): Promise<Team[]> {
    return throttle(async () => {
      const now = Date.now();

      // Return cached teams if still valid
      if (this.teamsCache && now < this.teamsCache.expiry) {
        logger.debug('Using cached teams');
        return this.teamsCache.data;
      }

      try {
        logger.debug('Fetching teams from Linear');
        const teams = await withRetry(async () => {
          const result = await this.client.teams();
          return result.nodes;
        }, 'Fetching teams from Linear');

        // Update cache
        this.teamsCache = {
          data: teams,
          expiry: now + LinearService.TEAMS_CACHE_TTL,
        };

        return teams;
      } catch (error) {
        handleLinearError(error, 'Failed to fetch teams from Linear');
      }
    })();
  }

  /**
   * Search for issues in Linear with optional filters
   *
   * Supports filtering by team, status, assignee, and title search. The special value 'me' can be
   * used for assigneeId to search for issues assigned to the current user (uses cached viewer).
   *
   * @param query - Search query to filter issues by title (case-insensitive)
   * @param teamId - Optional team ID to filter by
   * @param status - Optional status/state name to filter by (exact match)
   * @param assigneeId - Optional assignee ID to filter by (use 'me' for current user)
   * @param limit - Maximum number of results to return (default: 50, max: 250)
   * @returns Promise resolving to array of matching issues
   * @throws {AppError} When API call fails
   *
   * @example
   * ```typescript
   * // Search for bugs assigned to me
   * const myBugs = await linearService.searchIssues('bug', undefined, undefined, 'me', 25);
   *
   * // Search in specific team
   * const teamIssues = await linearService.searchIssues('', teamId, 'In Progress');
   * ```
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

      logger.debug('Searching issues in Linear', {
        query,
        teamId,
        status,
        assigneeId,
        limit: cappedLimit,
      });

      // Build filter object using proper Linear API structure
      const filter: IssueFilter = {};

      if (teamId) {
        filter.team = { id: { eq: teamId } };
      }

      if (status) {
        filter.state = { name: { eq: status } };
      }

      if (assigneeId) {
        if (assigneeId === 'me') {
          const viewer = await this.getCachedViewer();
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

      const issues = await withRetry(async () => {
        const result = await this.client.issues({
          first: cappedLimit,
          filter: filter,
        });
        return result.nodes;
      }, 'Searching issues in Linear');

      return issues;
    } catch (error) {
      handleLinearError(error, 'Failed to search issues in Linear', { query });
    }
  }

  /**
   * Create a new issue in Linear
   *
   * Creates an issue with the specified properties. The special value 'me' can be used for
   * assigneeId to assign the issue to the current user (uses cached viewer).
   *
   * @param teamId - ID of the team to create the issue in
   * @param title - Title of the issue (required)
   * @param description - Optional markdown description
   * @param assigneeId - Optional assignee ID (use 'me' for current user)
   * @param priority - Optional priority level (0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low)
   * @returns Promise resolving to the created issue
   * @throws {AppError} When issue creation fails
   *
   * @example
   * ```typescript
   * const issue = await linearService.createIssue(
   *   teamId,
   *   'Fix login bug',
   *   'Users are unable to log in with email',
   *   'me',
   *   1
   * );
   * console.log(`Created issue: ${issue.identifier}`);
   * ```
   */
  public async createIssue(
    teamId: string,
    title: string,
    description?: string,
    assigneeId?: string,
    priority?: number
  ): Promise<Issue> {
    try {
      logger.debug('Creating issue in Linear', {
        teamId,
        title,
        description,
        assigneeId,
        priority,
      });

      const issueInput: IssueCreateInput = {
        teamId,
        title,
      };

      if (description) issueInput.description = description;
      if (priority !== undefined) issueInput.priority = priority;

      if (assigneeId === 'me') {
        const viewer = await this.getCachedViewer();
        issueInput.assigneeId = viewer.id;
      } else if (assigneeId) {
        issueInput.assigneeId = assigneeId;
      }

      const issue = await withRetry(async () => {
        const issuePayload = await this.client.createIssue(issueInput);
        if (!issuePayload.issue) {
          throw new AppError('Failed to create issue', 500, String(ErrorCode.InternalError));
        }
        return issuePayload.issue;
      }, 'Creating issue in Linear');

      return issue;
    } catch (error) {
      handleLinearError(error, 'Failed to create issue in Linear', { teamId, title });
    }
  }

  /**
   * Get the current user (viewer) from Linear
   */
  public async getViewer(): Promise<User> {
    try {
      logger.debug('Fetching current user from Linear');
      return await withRetry(async () => this.client.viewer, 'Fetching current user from Linear');
    } catch (error) {
      handleLinearError(error, 'Failed to fetch current user from Linear');
    }
  }

  /**
   * Health check - verify API connection and return status
   * Rate limited to 10 requests per second.
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    apiConnected: boolean;
    userId?: string;
    userName?: string;
    error?: string;
  }> {
    return throttle(async () => {
      try {
        logger.debug('Performing health check');
        const viewer = await withRetry(async () => this.client.viewer, 'Health check');

        return {
          status: 'healthy' as const,
          apiConnected: true,
          userId: viewer.id,
          userName: viewer.name,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Health check failed', error instanceof Error ? { error } : undefined);

        return {
          status: 'unhealthy' as const,
          apiConnected: false,
          error: errorMessage,
        };
      }
    })();
  }

  /**
   * Get a specific issue by its ID
   *
   * Retrieves a single issue with all its details including state, assignee, team, and project.
   * Rate limited to 10 requests per second.
   *
   * @param issueId - The Linear issue ID
   * @returns Promise resolving to the issue
   * @throws {AppError} When issue is not found or API call fails
   *
   * @example
   * ```typescript
   * const issue = await linearService.getIssue('abc-123');
   * console.log(issue.title, issue.status);
   * ```
   */
  public async getIssue(issueId: string): Promise<Issue> {
    return throttle(async () => {
      try {
        logger.debug('Fetching issue from Linear', { issueId });
        const issue = await withRetry(
          async () => this.client.issue(issueId),
          'Fetching issue from Linear'
        );

        if (!issue) {
          throw new AppError(`Issue not found: ${issueId}`, 404, String(ErrorCode.InvalidRequest));
        }

        return issue;
      } catch (error) {
        handleLinearError(error, 'Failed to fetch issue from Linear', { issueId });
      }
    })();
  }

  /**
   * Get all workflow states for a specific team
   *
   * Returns all workflow states (statuses) configured for the team, including their type,
   * position, and description. Results are cached for 15 minutes per team.
   * Rate limited to 10 requests per second.
   *
   * @param teamId - The team ID
   * @returns Promise resolving to array of workflow states
   * @throws {AppError} When team is not found or API call fails
   *
   * @example
   * ```typescript
   * const states = await linearService.getWorkflowStates(teamId);
   * states.forEach(state => console.log(state.name, state.type));
   * ```
   */
  public async getWorkflowStates(teamId: string): Promise<WorkflowState[]> {
    return throttle(async () => {
      const now = Date.now();

      // Check cache for this team
      const cached = this.workflowStatesCache.get(teamId);
      if (cached && now < cached.expiry) {
        logger.debug('Using cached workflow states', { teamId });
        return cached.data;
      }

      try {
        logger.debug('Fetching workflow states from Linear', { teamId });
        const states = await withRetry(async () => {
          const team = await this.client.team(teamId);
          if (!team) {
            throw new AppError(`Team not found: ${teamId}`, 404, String(ErrorCode.InvalidRequest));
          }
          const result = await team.states();
          return result.nodes;
        }, 'Fetching workflow states from Linear');

        // Update cache for this team
        this.workflowStatesCache.set(teamId, {
          data: states,
          expiry: now + LinearService.WORKFLOW_STATES_CACHE_TTL,
        });

        return states;
      } catch (error) {
        handleLinearError(error, 'Failed to fetch workflow states from Linear', { teamId });
      }
    })();
  }

  /**
   * Add a comment to an existing issue
   *
   * Creates a new comment on the specified issue. The comment body supports markdown formatting.
   * Rate limited to 10 requests per second.
   *
   * @param issueId - The issue ID to add the comment to
   * @param body - The comment text (supports markdown)
   * @returns Promise resolving to the created comment
   * @throws {AppError} When comment creation fails
   *
   * @example
   * ```typescript
   * const comment = await linearService.addComment(issueId, 'This has been fixed in PR #123');
   * console.log(`Comment added: ${comment.id}`);
   * ```
   */
  public async addComment(issueId: string, body: string): Promise<Comment> {
    return throttle(async () => {
      try {
        logger.debug('Adding comment to issue in Linear', { issueId, bodyLength: body.length });

        const comment = await withRetry(async () => {
          const commentPayload = await this.client.createComment({
            issueId,
            body,
          });

          if (!commentPayload.comment) {
            throw new AppError('Failed to create comment', 500, String(ErrorCode.InternalError));
          }

          return commentPayload.comment;
        }, 'Adding comment to issue in Linear');

        return comment;
      } catch (error) {
        handleLinearError(error, 'Failed to add comment to issue in Linear', { issueId });
      }
    })();
  }

  /**
   * Update an existing issue in Linear
   *
   * Updates one or more properties of an existing issue. The special value 'me' can be used for
   * assigneeId to assign to the current user. Use null or empty string to unassign.
   *
   * @param issueId - ID of the issue to update
   * @param updates - Object containing the properties to update
   * @param updates.title - Optional new title
   * @param updates.description - Optional new description
   * @param updates.assigneeId - Optional new assignee ID ('me' for current user, null/empty to unassign)
   * @param updates.priority - Optional new priority level (0-4)
   * @param updates.stateId - Optional new workflow state ID
   * @returns Promise resolving to the updated issue
   * @throws {AppError} When update fails
   *
   * @example
   * ```typescript
   * // Update multiple properties
   * const updated = await linearService.updateIssue(issueId, {
   *   title: 'Updated title',
   *   assigneeId: 'me',
   *   priority: 2
   * });
   *
   * // Unassign an issue
   * await linearService.updateIssue(issueId, { assigneeId: null });
   * ```
   */
  public async updateIssue(
    issueId: string,
    updates: {
      title?: string;
      description?: string;
      assigneeId?: string | null;
      priority?: number;
      stateId?: string;
    }
  ): Promise<Issue> {
    try {
      logger.debug('Updating issue in Linear', { issueId, updates });

      const issueInput: IssueUpdateInput = {};

      if (updates.title) issueInput.title = updates.title;
      if (updates.description !== undefined) issueInput.description = updates.description;
      if (updates.priority !== undefined) issueInput.priority = updates.priority;
      if (updates.stateId) issueInput.stateId = updates.stateId;

      if (updates.assigneeId === 'me') {
        const viewer = await this.getCachedViewer();
        issueInput.assigneeId = viewer.id;
      } else if (updates.assigneeId === null || updates.assigneeId === '') {
        issueInput.assigneeId = null; // Unassign
      } else if (updates.assigneeId) {
        issueInput.assigneeId = updates.assigneeId;
      }

      const issue = await withRetry(async () => {
        const issuePayload = await this.client.updateIssue(issueId, issueInput);
        if (!issuePayload.issue) {
          throw new AppError('Failed to update issue', 500, String(ErrorCode.InternalError));
        }
        return issuePayload.issue;
      }, 'Updating issue in Linear');

      return issue;
    } catch (error) {
      handleLinearError(error, 'Failed to update issue in Linear', { issueId });
    }
  }
}

// Export singleton instance
export const linearService = LinearService.getInstance();
