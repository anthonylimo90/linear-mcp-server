// Mock MCP JSON-RPC requests
export const mcpRequests = {
  listTools: {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  },
  
  searchIssues: {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'search_issues',
      arguments: {
        query: 'bug',
        teamId: 'team-1',
        limit: 10,
      },
    },
  },
  
  createIssue: {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'create_issue',
      arguments: {
        teamId: 'team-1',
        title: 'Test issue',
        description: 'Test description',
        assigneeId: 'me',
        priority: 2,
      },
    },
  },
  
  updateIssue: {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'update_issue',
      arguments: {
        issueId: 'issue-1',
        title: 'Updated title',
        description: 'Updated description',
        priority: 3,
      },
    },
  },
  
  getTeams: {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'get_teams',
      arguments: {},
    },
  },
  
  getMyIssues: {
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'get_my_issues',
      arguments: {
        limit: 20,
      },
    },
  },
  
  invalidTool: {
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'invalid_tool',
      arguments: {},
    },
  },
  
  invalidRequest: {
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: {
      name: 'search_issues',
      arguments: {
        // Missing required 'query' parameter
        teamId: 'team-1',
      },
    },
  },
};

// Expected MCP responses
export const mcpResponses = {
  listTools: {
    result: {
      tools: [
        {
          name: 'search_issues',
          description: 'Search for issues in Linear',
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.any(Object),
            required: ['query'],
          }),
        },
        {
          name: 'create_issue',
          description: 'Create a new issue in Linear',
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.any(Object),
            required: ['teamId', 'title'],
          }),
        },
        {
          name: 'update_issue',
          description: 'Update an existing issue in Linear',
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.any(Object),
            required: ['issueId'],
          }),
        },
        {
          name: 'get_teams',
          description: 'Get all teams in the workspace',
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.any(Object),
          }),
        },
        {
          name: 'get_my_issues',
          description: 'Get issues assigned to the current user in Linear',
          inputSchema: expect.objectContaining({
            type: 'object',
            properties: expect.any(Object),
          }),
        },
      ],
    },
    jsonrpc: '2.0',
    id: 1,
  },
  
  searchIssues: {
    result: {
      toolResult: {
        issues: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            identifier: expect.any(String),
            title: expect.any(String),
            url: expect.any(String),
          }),
        ]),
      },
    },
    jsonrpc: '2.0',
    id: 2,
  },
  
  createIssue: {
    result: {
      toolResult: expect.objectContaining({
        id: expect.any(String),
        identifier: expect.any(String),
        title: expect.any(String),
        url: expect.any(String),
      }),
    },
    jsonrpc: '2.0',
    id: 3,
  },
}; 