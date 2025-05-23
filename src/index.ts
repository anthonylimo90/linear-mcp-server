#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./utils/logger.js";
import { AppError, handleError } from "./utils/error.js";
import { linearService } from "./services/linearService.js";
import {
  SearchIssuesArgs,
  CreateIssueArgs,
  UpdateIssueArgs,
  SearchIssuesResponse,
  CreateIssueResponse,
  UpdateIssueResponse,
  GetTeamsResponse,
  Issue,
  Team
} from "./types.js";

// Initialize app
logger.debug("Starting Linear MCP server...");

// Create server
const server = new Server({
  name: "Linear MCP Server",
  version: "0.1.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Helper function to search issues with error handling
async function searchIssues(args: SearchIssuesArgs): Promise<SearchIssuesResponse> {
  try {
    const { query, teamId, status, assigneeId, limit } = args;
    
    // Input validation
    if (!query) {
      throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
    }

    logger.debug('Searching issues', { query, teamId, status, assigneeId, limit });
    
    const issues = await linearService.searchIssues(
      query,
      teamId,
      status,
      assigneeId,
      limit
    );

    // Map to response format with optimized async processing
    const formattedIssues: Issue[] = await Promise.all(
      issues.map(async (issue) => {
        const [state, assignee, team, project] = await Promise.all([
          issue.state ? issue.state : Promise.resolve(null),
          issue.assignee ? issue.assignee : Promise.resolve(null),
          issue.team ? issue.team : Promise.resolve(null),
          issue.project ? issue.project : Promise.resolve(null)
        ]);

        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description || undefined,
          status: state?.name || undefined,
          url: issue.url,
          assignee: assignee?.name || undefined,
          createdAt: issue.createdAt,
          team: team ? {
            id: team.id,
            name: team.name,
            key: team.key
          } : undefined,
          project: project ? {
            id: project.id,
            name: project.name,
            url: project.url || undefined,
            status: project.state || undefined
          } : undefined
        };
      })
    );

    logger.debug(`Found ${formattedIssues.length} issues`);
    return { issues: formattedIssues };
  } catch (error) {
    logger.error('Error searching issues', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function to create issue with error handling
async function createIssue(args: CreateIssueArgs): Promise<CreateIssueResponse> {
  try {
    const { teamId, title, description, assigneeId, priority } = args;
    
    // Input validation
    if (!teamId || !title) {
      throw new AppError('Team ID and title are required', 400, 'VALIDATION_ERROR');
    }
    
    logger.debug('Creating issue', { teamId, title, description, assigneeId, priority });
    
    const issue = await linearService.createIssue(
      teamId,
      title,
      description,
      assigneeId,
      priority
    );
    
    const response: CreateIssueResponse = {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url
    };
    
    logger.debug(`Created issue ${response.identifier}`, { id: response.id, url: response.url });
    return response;
  } catch (error) {
    logger.error('Error creating issue', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function to update issue with error handling
async function updateIssue(args: UpdateIssueArgs): Promise<UpdateIssueResponse> {
  try {
    const { issueId, title, description, assigneeId, priority, stateId } = args;
    
    // Input validation
    if (!issueId) {
      throw new AppError('Issue ID is required', 400, 'VALIDATION_ERROR');
    }
    
    logger.debug('Updating issue', { issueId, title, description, assigneeId, priority, stateId });
    
    const issue = await linearService.updateIssue(issueId, {
      title,
      description,
      assigneeId,
      priority,
      stateId
    });

    // Get the current state for status
    const state = issue.state ? await issue.state : null;
    
    const response: UpdateIssueResponse = {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
      status: state?.name || undefined
    };
    
    logger.debug(`Updated issue ${response.identifier}`, { id: response.id, url: response.url });
    return response;
  } catch (error) {
    logger.error('Error updating issue', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function to get teams with error handling
async function getTeams(): Promise<GetTeamsResponse> {
  try {
    logger.debug('Getting teams');
    
    const teams = await linearService.getTeams();
    
    const formattedTeams: Team[] = teams.map(team => ({
      id: team.id,
      name: team.name,
      key: team.key,
      description: team.description || undefined
    }));
    
    logger.debug(`Found ${formattedTeams.length} teams`);
    return { teams: formattedTeams };
  } catch (error) {
    logger.error('Error getting teams', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function to get issues assigned to the current user
async function getMyIssues(limit = 50): Promise<SearchIssuesResponse> {
  try {
    logger.debug('Fetching my issues', { limit });
    const issues = await linearService.searchIssues('', undefined, undefined, 'me', limit);

    // Map to response format with optimized async processing
    const formattedIssues: Issue[] = await Promise.all(
      issues.map(async (issue) => {
        const [state, assignee, team, project] = await Promise.all([
          issue.state ? issue.state : Promise.resolve(null),
          issue.assignee ? issue.assignee : Promise.resolve(null),
          issue.team ? issue.team : Promise.resolve(null),
          issue.project ? issue.project : Promise.resolve(null)
        ]);

        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description || undefined,
          status: state?.name || undefined,
          url: issue.url,
          assignee: assignee?.name || undefined,
          createdAt: issue.createdAt,
          team: team ? {
            id: team.id,
            name: team.name,
            key: team.key
          } : undefined,
          project: project ? {
            id: project.id,
            name: project.name,
            url: project.url || undefined,
            status: project.state || undefined
          } : undefined
        };
      })
    );

    logger.debug(`Found ${formattedIssues.length} issues assigned to me`);
    return { issues: formattedIssues };
  } catch (error) {
    logger.error('Error fetching my issues', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Tool definitions for MCP
const tools = [
  {
    name: "search_issues",
    description: "Search for issues in Linear",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query"
        },
        teamId: {
          type: "string",
          description: "Team ID to filter by"
        },
        status: {
          type: "string",
          description: "Status to filter by"
        },
        assigneeId: {
          type: "string",
          description: "Assignee ID to filter by. Use 'me' to filter by the current user."
        },
        limit: {
          type: "number",
          description: "Maximum number of issues to return"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "create_issue",
    description: "Create a new issue in Linear",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID"
        },
        title: {
          type: "string",
          description: "Issue title"
        },
        description: {
          type: "string",
          description: "Issue description"
        },
        assigneeId: {
          type: "string",
          description: "Assignee ID. Use 'me' to assign to the current user."
        },
        priority: {
          type: "number",
          description: "Issue priority (0-4)"
        }
      },
      required: ["teamId", "title"]
    }
  },
  {
    name: "update_issue",
    description: "Update an existing issue in Linear",
    inputSchema: {
      type: "object",
      properties: {
        issueId: {
          type: "string",
          description: "Issue ID to update"
        },
        title: {
          type: "string",
          description: "New issue title"
        },
        description: {
          type: "string",
          description: "New issue description"
        },
        assigneeId: {
          type: "string",
          description: "New assignee ID. Use 'me' to assign to current user, empty string to unassign."
        },
        priority: {
          type: "number",
          description: "New issue priority (0-4)"
        },
        stateId: {
          type: "string",
          description: "New workflow state ID"
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "get_teams",
    description: "Get all teams in the workspace",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_my_issues",
    description: "Get issues assigned to the current user in Linear",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of issues to return"
        }
      }
    }
  }
];

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls with error handling
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  logger.debug(`Handling tool call: ${name}`, { arguments: args });

  try {
    let result;
    
    switch (name) {
      case 'search_issues': {
        // Type guard validation
        if (typeof args.query !== 'string') {
          throw new AppError('Search query is required', 400, 'VALIDATION_ERROR');
        }
        result = await searchIssues({
          query: args.query,
          teamId: args.teamId as string,
          status: args.status as string,
          assigneeId: args.assigneeId as string,
          limit: args.limit as number
        });
        break;
      }
      case 'create_issue': {
        // Type guard validation
        if (typeof args.teamId !== 'string' || typeof args.title !== 'string') {
          throw new AppError('Team ID and title are required', 400, 'VALIDATION_ERROR');
        }
        result = await createIssue({
          teamId: args.teamId,
          title: args.title,
          description: args.description as string,
          assigneeId: args.assigneeId as string,
          priority: args.priority as number
        });
        break;
      }
      case 'update_issue': {
        // Type guard validation
        if (typeof args.issueId !== 'string') {
          throw new AppError('Issue ID is required', 400, 'VALIDATION_ERROR');
        }
        result = await updateIssue({
          issueId: args.issueId,
          title: args.title as string,
          description: args.description as string,
          assigneeId: args.assigneeId as string,
          priority: args.priority as number,
          stateId: args.stateId as string
        });
        break;
      }
      case 'get_teams':
        result = await getTeams();
        break;
      case 'get_my_issues':
        result = await getMyIssues(args.limit as number | undefined);
        break;
      default:
        throw new AppError(`Unknown tool: ${name}`, 400, String(ErrorCode.InvalidRequest));
    }
    
    logger.debug(`Tool call ${name} completed successfully`);
    return { toolResult: result };
    
  } catch (error: unknown) {
    // Convert error to proper McpError format
    const errorResponse = handleError(error);
    throw new McpError(
      errorResponse.statusCode || 500,
      errorResponse.message,
      { code: errorResponse.code || String(ErrorCode.InternalError), details: errorResponse.details }
    );
  }
});

// Start server
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.debug("Linear MCP Server started and ready to accept connections");
  } catch (error: unknown) {
    logger.error("Failed to start server", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  logger.debug('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.debug('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();