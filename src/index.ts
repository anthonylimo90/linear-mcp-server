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
  SearchIssuesResponse,
  CreateIssueResponse,
  GetTeamsResponse,
  Issue,
  Team
} from "./types.js";

// Initialize app
logger.info("Starting Linear MCP server...");

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
        const [state, assignee] = await Promise.all([
          issue.state ? issue.state : Promise.resolve(null),
          issue.assignee ? issue.assignee : Promise.resolve(null)
        ]);

        return {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description || undefined,
          status: state?.name || undefined,
          url: issue.url,
          assignee: assignee?.name || undefined,
          createdAt: issue.createdAt
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
    
    logger.info(`Created issue ${response.identifier}`, { id: response.id, url: response.url });
    return response;
  } catch (error) {
    logger.error('Error creating issue', error instanceof Error ? { error } : undefined);
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
    name: "get_teams",
    description: "Get all teams in the workspace",
    inputSchema: {
      type: "object",
      properties: {}
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
  logger.info(`Handling tool call: ${name}`, { arguments: args });

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
      case 'get_teams':
        result = await getTeams();
        break;
      default:
        throw new AppError(
          `Tool '${name}' not found`,
          404,
          'TOOL_NOT_FOUND'
        );
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
    logger.info("Linear MCP Server started and ready to accept connections");
  } catch (error: unknown) {
    logger.error("Failed to start server", { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();