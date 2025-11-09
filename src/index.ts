#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { Issue as LinearIssue } from "@linear/sdk";
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
  GetIssueArgs,
  GetWorkflowStatesArgs,
  GetWorkflowStatesResponse,
  AddCommentArgs,
  AddCommentResponse,
  HealthCheckResponse,
  Issue,
  Team,
  WorkflowState
} from "./types.js";
import {
  SearchIssuesSchema,
  CreateIssueSchema,
  UpdateIssueSchema,
  GetMyIssuesSchema,
  GetIssueSchema,
  GetWorkflowStatesSchema,
  AddCommentSchema,
} from "./utils/validation.js";
import { ZodError } from "zod";

// Initialize app
logger.debug("Starting Linear MCP server...");

/**
 * Formats a Linear SDK issue into our standardized Issue format
 * @param issue - Linear SDK issue object
 * @returns Promise resolving to formatted Issue
 */
async function formatIssue(issue: LinearIssue): Promise<Issue> {
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
}

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
    // Validate input with Zod
    const validated = SearchIssuesSchema.parse(args);
    const { query, teamId, status, assigneeId, limit } = validated;

    logger.debug('Searching issues', { query, teamId, status, assigneeId, limit });

    const issues = await linearService.searchIssues(
      query,
      teamId,
      status,
      assigneeId,
      limit
    );

    // Use shared formatting function
    const formattedIssues: Issue[] = await Promise.all(issues.map(formatIssue));

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
    // Validate input with Zod
    const validated = CreateIssueSchema.parse(args);
    const { teamId, title, description, assigneeId, priority } = validated;

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
    // Validate input with Zod
    const validated = UpdateIssueSchema.parse(args);
    const { issueId, title, description, assigneeId, priority, stateId } = validated;

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
async function getMyIssues(args?: { limit?: number }): Promise<SearchIssuesResponse> {
  try {
    // Validate input with Zod
    const validated = GetMyIssuesSchema.parse(args || {});
    const { limit } = validated;

    logger.debug('Fetching my issues', { limit });
    const issues = await linearService.searchIssues('', undefined, undefined, 'me', limit);

    // Use shared formatting function
    const formattedIssues: Issue[] = await Promise.all(issues.map(formatIssue));

    logger.debug(`Found ${formattedIssues.length} issues assigned to me`);
    return { issues: formattedIssues };
  } catch (error) {
    logger.error('Error fetching my issues', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function to get a specific issue by ID
async function getIssue(args: GetIssueArgs): Promise<Issue> {
  try {
    // Validate input with Zod
    const validated = GetIssueSchema.parse(args);
    const { issueId } = validated;

    logger.debug('Fetching issue by ID', { issueId });
    const issue = await linearService.getIssue(issueId);

    // Use shared formatting function
    const formattedIssue: Issue = await formatIssue(issue);

    logger.debug(`Found issue ${formattedIssue.identifier}`);
    return formattedIssue;
  } catch (error) {
    logger.error('Error fetching issue', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function to get workflow states for a team
async function getWorkflowStates(args: GetWorkflowStatesArgs): Promise<GetWorkflowStatesResponse> {
  try {
    // Validate input with Zod
    const validated = GetWorkflowStatesSchema.parse(args);
    const { teamId } = validated;

    logger.debug('Fetching workflow states', { teamId });
    const states = await linearService.getWorkflowStates(teamId);

    const formattedStates: WorkflowState[] = states.map((state: any) => ({
      id: state.id,
      name: state.name,
      type: state.type,
      description: state.description || undefined,
      position: state.position
    }));

    logger.debug(`Found ${formattedStates.length} workflow states`);
    return { states: formattedStates };
  } catch (error) {
    logger.error('Error fetching workflow states', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function to add a comment to an issue
async function addComment(args: AddCommentArgs): Promise<AddCommentResponse> {
  try {
    // Validate input with Zod
    const validated = AddCommentSchema.parse(args);
    const { issueId, body } = validated;

    logger.debug('Adding comment to issue', { issueId, bodyLength: body.length });
    const comment = await linearService.addComment(issueId, body);

    const response: AddCommentResponse = {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toString(),
      issueId: issueId
    };

    logger.debug(`Added comment to issue`, { commentId: response.id });
    return response;
  } catch (error) {
    logger.error('Error adding comment', error instanceof Error ? { error } : undefined);
    throw error;
  }
}

// Helper function for health check
async function healthCheck(): Promise<HealthCheckResponse> {
  try {
    logger.debug('Performing health check');
    const result = await linearService.healthCheck();
    logger.debug('Health check completed', { status: result.status });
    return result;
  } catch (error) {
    logger.error('Error during health check', error instanceof Error ? { error } : undefined);
    // Health check should not throw, return unhealthy status instead
    return {
      status: 'unhealthy',
      apiConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Tool definitions for MCP
const tools = [
  {
    name: "search_issues",
    description: "Search for issues in Linear with powerful filtering options. Examples: 'Find all high-priority bugs assigned to me', 'Show open issues in the Engineering team', 'Search for issues about authentication'",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query - can be keywords, issue identifiers, or descriptions to search for"
        },
        teamId: {
          type: "string",
          description: "Team ID to filter results (use get_teams to find team IDs)"
        },
        status: {
          type: "string",
          description: "Status to filter by (e.g., 'In Progress', 'Done', 'Todo')"
        },
        assigneeId: {
          type: "string",
          description: "Assignee ID to filter by. Pro tip: Use 'me' to filter by the current user"
        },
        limit: {
          type: "number",
          description: "Maximum number of issues to return (default: 50)"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "create_issue",
    description: "Create a new issue in Linear with full customization. Examples: 'Create a bug report for login issues', 'Add a feature request to implement dark mode', 'Create a high-priority task and assign it to me'",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "Team ID (use get_teams to find available teams)"
        },
        title: {
          type: "string",
          description: "Issue title - should be clear and concise"
        },
        description: {
          type: "string",
          description: "Detailed issue description (supports Markdown formatting)"
        },
        assigneeId: {
          type: "string",
          description: "Assignee ID. Pro tip: Use 'me' to assign to yourself"
        },
        priority: {
          type: "number",
          description: "Issue priority: 0=None, 1=Low, 2=Medium, 3=High, 4=Urgent"
        }
      },
      required: ["teamId", "title"]
    }
  },
  {
    name: "update_issue",
    description: "Update an existing issue in Linear - modify title, description, assignee, priority, or workflow state. Examples: 'Update issue ENG-123 to high priority', 'Assign issue ENG-456 to me', 'Change the description of issue ENG-789'",
    inputSchema: {
      type: "object",
      properties: {
        issueId: {
          type: "string",
          description: "Issue ID to update (the unique identifier like 'ENG-123')"
        },
        title: {
          type: "string",
          description: "New issue title"
        },
        description: {
          type: "string",
          description: "New issue description (supports Markdown formatting)"
        },
        assigneeId: {
          type: "string",
          description: "New assignee ID. Pro tip: Use 'me' to assign to yourself, or empty string '' to unassign"
        },
        priority: {
          type: "number",
          description: "New issue priority: 0=None, 1=Low, 2=Medium, 3=High, 4=Urgent"
        },
        stateId: {
          type: "string",
          description: "New workflow state ID (use get_workflow_states to find state IDs)"
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "get_teams",
    description: "Get all teams in your Linear workspace. Use this to find team IDs for creating issues or filtering searches. Example: 'Show me all my Linear teams'",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_my_issues",
    description: "Get all issues assigned to you in Linear. Perfect for daily standup prep or checking your current workload. Examples: 'What issues are assigned to me?', 'Show my current tasks'",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of issues to return (default: 50, max: 250)"
        }
      }
    }
  },
  {
    name: "get_issue",
    description: "Get detailed information about a specific issue by its ID. Examples: 'Get the details of issue ENG-123', 'Show me issue PROJ-456'",
    inputSchema: {
      type: "object",
      properties: {
        issueId: {
          type: "string",
          description: "The unique ID of the issue to retrieve (e.g., 'abc123-def456-...'). Note: This is the internal UUID, not the identifier like 'ENG-123'"
        }
      },
      required: ["issueId"]
    }
  },
  {
    name: "get_workflow_states",
    description: "Get all workflow states (statuses) for a specific team. Use this to find state IDs when updating issues. Examples: 'Show workflow states for the Engineering team', 'What statuses are available?'",
    inputSchema: {
      type: "object",
      properties: {
        teamId: {
          type: "string",
          description: "The ID of the team (use get_teams to find team IDs)"
        }
      },
      required: ["teamId"]
    }
  },
  {
    name: "add_comment",
    description: "Add a comment to an existing issue in Linear. Comments support Markdown formatting. Examples: 'Add a comment to issue ENG-123', 'Comment on the bug report with an update'",
    inputSchema: {
      type: "object",
      properties: {
        issueId: {
          type: "string",
          description: "The ID of the issue to comment on"
        },
        body: {
          type: "string",
          description: "The comment text (supports Markdown formatting for rich text)"
        }
      },
      required: ["issueId", "body"]
    }
  },
  {
    name: "health_check",
    description: "Verify that the Linear API connection is working and check authentication status. Use this to troubleshoot connection issues. Example: 'Check if Linear API is working'",
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
        result = await getMyIssues(args as { limit?: number });
        break;
      case 'get_issue': {
        // Type guard validation
        if (typeof args.issueId !== 'string') {
          throw new AppError('Issue ID is required', 400, 'VALIDATION_ERROR');
        }
        result = await getIssue({ issueId: args.issueId });
        break;
      }
      case 'get_workflow_states': {
        // Type guard validation
        if (typeof args.teamId !== 'string') {
          throw new AppError('Team ID is required', 400, 'VALIDATION_ERROR');
        }
        result = await getWorkflowStates({ teamId: args.teamId });
        break;
      }
      case 'add_comment': {
        // Type guard validation
        if (typeof args.issueId !== 'string' || typeof args.body !== 'string') {
          throw new AppError('Issue ID and comment body are required', 400, 'VALIDATION_ERROR');
        }
        result = await addComment({ issueId: args.issueId, body: args.body });
        break;
      }
      case 'health_check':
        result = await healthCheck();
        break;
      default:
        throw new AppError(`Unknown tool: ${name}`, 400, String(ErrorCode.InvalidRequest));
    }

    logger.debug(`Tool call ${name} completed successfully`);
    return { toolResult: result };

  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new McpError(
        ErrorCode.InvalidParams,
        `Validation error: ${validationErrors}`,
        { code: 'VALIDATION_ERROR', details: error.errors }
      );
    }

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