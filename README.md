# Linear MCP Server

A [Model Context Protocol (MCP)](https://github.com/ModelContextProtocol/spec) server that provides tools for interacting with [Linear](https://linear.app) issue tracking system. This enables AI agents to search and create issues in Linear through a standardized interface.

## Features

- **Search Issues**: Search for issues in Linear with filters for team, status, and assignee
- **Create Issues**: Create new issues in Linear with title, description, assignee, and priority
- **Update Issues**: Modify existing issues including title, description, assignee, priority, and workflow state
- **List Teams**: Get a list of all teams in your Linear workspace
- **Get My Issues**: Retrieve issues assigned to the current user with enhanced filtering
- **Enhanced Issue Data**: Issues include comprehensive team and project information for better context
- **Type Safety**: Fully typed interfaces for requests and responses with comprehensive TypeScript support
- **Error Handling**: Comprehensive error handling with structured error responses
- **Logging**: Advanced logging with multiple levels and structured data using Pino
- **Service Architecture**: Clean service layer with singleton pattern for optimal performance
- **Configuration Management**: Environment-based configuration with validation
- **Performance Optimized**: Parallel async processing for faster response times with support for up to 250 issues
- **MCP Protocol Compliance**: Full adherence to Model Context Protocol standards with clean JSON-RPC communication

## Quick Start

Get up and running with Claude Desktop in 3 simple steps:

```bash
# 1. Clone and build
git clone https://github.com/yourusername/linear-mcp-server.git
cd linear-mcp-server
npm install && npm run build

# 2. Get your Linear API key from https://linear.app/settings/api
# Then run the setup script
npm run setup:claude your_linear_api_key_here

# 3. Restart Claude Desktop and start using Linear tools!
```

After setup, try asking Claude:
- "Search for issues assigned to me in Linear"
- "Create a new bug report in Linear"
- "Update the description of issue ENG-123"
- "Assign issue ENG-456 to me and set priority to high"
- "Show me all teams in Linear"
- "Get my recent Linear issues with project information"

## Architecture

```
src/
├── index.ts              # Main MCP server entry point
├── types.ts              # TypeScript interfaces and type definitions
├── utils/
│   ├── config.ts         # Configuration management with validation
│   ├── error.ts          # Error handling utilities and custom error classes
│   └── logger.ts         # Enhanced logging with Pino integration
└── services/
    └── linearService.ts  # Linear API service layer with singleton pattern
```

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/linear-mcp-server.git
cd linear-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
LINEAR_API_KEY=your_linear_api_key
LOG_LEVEL=info
NODE_ENV=development
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| LINEAR_API_KEY | Your Linear API key | - | ✅ Yes |
| LOG_LEVEL | Logging level (trace, debug, info, warn, error) | info | No |
| NODE_ENV | Environment (development, production) | development | No |
| PORT | Port for HTTP server (if used) | 3000 | No |
| ENABLE_RATE_LIMIT | Enable rate limiting | false | No |
| RATE_LIMIT_MAX | Maximum requests per window | 100 | No |
| RATE_LIMIT_WINDOW_MS | Rate limit window in milliseconds | 60000 | No |

### Getting Your Linear API Key

1. Go to [Linear Settings](https://linear.app/settings/api)
2. Click "Create API Key"
3. Give it a descriptive name and select appropriate scopes
4. Copy the generated key to your `.env` file

## Usage

### Run as MCP Server

The primary use case is as an MCP server that connects via stdio:

```bash
npm start
```

### Development Mode

For development with watch mode:

```bash
npm run watch
```

### Integration with MCP Clients

This server is designed to work with MCP-compatible clients. The server communicates via stdio transport and provides five main tools:

- `search_issues` - Search and filter Linear issues with enhanced team/project information
- `create_issue` - Create new issues in Linear
- `update_issue` - Modify existing issues including title, description, assignee, priority, and state
- `get_my_issues` - Get issues assigned to the current user with comprehensive filtering
- `get_teams` - List all teams in the workspace

## Client Integration

### Claude Desktop Integration

To use this server with Claude Desktop, you have two options:

#### Option 1: Automatic Setup (Recommended)

Use our setup script for easy configuration:

```bash
# Build the project first
npm run build

# Run the setup script
npm run setup:claude

# Or pass your API key directly
npm run setup:claude your_linear_api_key_here
```

The script will automatically:
- Detect your operating system
- Find the Claude Desktop config file
- Add the Linear MCP server configuration
- Use your API key from `.env` or command line

#### Option 2: Manual Setup

Add it manually to your Claude configuration:

#### macOS/Linux
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linear": {
      "command": "node",
      "args": ["/path/to/your/linear-mcp-server/build/index.js"],
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  }
}
```

#### Windows
Edit `%APPDATA%/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linear": {
      "command": "node",
      "args": ["C:\\path\\to\\your\\linear-mcp-server\\build\\index.js"],
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  }
}
```

### VS Code Integration

For VS Code with MCP extension support:

1. Install an MCP-compatible extension (e.g., "MCP Client")
2. Add server configuration to VS Code settings:

```json
{
  "mcp.servers": {
    "linear": {
      "command": "node",
      "args": ["/path/to/your/linear-mcp-server/build/index.js"],
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  }
}
```

### Cursor IDE Integration

For Cursor IDE with MCP support:

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Search for "MCP" or "Model Context Protocol"
3. Add server configuration:

```json
{
  "mcp.servers": {
    "linear": {
      "command": "node",
      "args": ["/path/to/your/linear-mcp-server/build/index.js"],
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  }
}
```

Or use the Cursor command palette:
1. Press Cmd/Ctrl + Shift + P
2. Type "MCP: Add Server"
3. Enter the server details when prompted

### Continue.dev Integration

For Continue.dev (VS Code/JetBrains extension):

Add to your `~/.continue/config.json`:

```json
{
  "mcpServers": {
    "linear": {
      "command": "node",
      "args": ["/path/to/your/linear-mcp-server/build/index.js"],
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  }
}
```

### Other MCP Clients

For any MCP-compatible client, use these connection details:

- **Transport**: stdio
- **Command**: `node /path/to/linear-mcp-server/build/index.js`
- **Environment**: Set `LINEAR_API_KEY` to your Linear API key

### Using with NPX (Alternative)

You can also install and run globally using npx:

```bash
# Install globally
npm install -g linear-mcp-server

# Use with Claude Desktop
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["linear-mcp-server"],
      "env": {
        "LINEAR_API_KEY": "your_linear_api_key_here"
      }
    }
  }
}
```

### Docker Integration

Run the server in a Docker container:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY build/ ./build/
EXPOSE 3000
CMD ["node", "build/index.js"]
```

```bash
# Build and run
docker build -t linear-mcp-server .
docker run -e LINEAR_API_KEY=your_key linear-mcp-server
```

### Verification

After setting up the integration, verify it's working:

1. **Claude Desktop**: Look for Linear tools in the available tools list
2. **VS Code**: Check the MCP extension status for successful connection
3. **Command Line**: Test the server directly:

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm start
```

You should see a response listing the five available tools: `search_issues`, `create_issue`, `update_issue`, `get_teams`, and `get_my_issues`.

## API Reference

### Tool: `search_issues`

Search for issues in Linear with advanced filtering options.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query"
    },
    "teamId": {
      "type": "string", 
      "description": "Team ID to filter by"
    },
    "status": {
      "type": "string",
      "description": "Status to filter by"
    },
    "assigneeId": {
      "type": "string",
      "description": "Assignee ID to filter by. Use 'me' to filter by the current user"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of issues to return"
    }
  },
  "required": ["query"]
}
```

**Response**:
```json
{
  "issues": [
    {
      "id": "issue-id",
      "identifier": "TEAM-123", 
      "title": "Issue title",
      "description": "Issue description",
      "status": "In Progress",
      "url": "https://linear.app/team/issue/TEAM-123",
      "assignee": "John Doe",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "team": {
        "id": "team-id",
        "name": "Team Name",
        "key": "TEAM"
      },
      "project": {
        "id": "project-id",
        "name": "Project Name",
        "url": "https://linear.app/project/project-id",
        "status": "Active"
      }
    }
  ]
}
```

### Tool: `create_issue`

Create a new issue in Linear with full customization options.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "teamId": {
      "type": "string",
      "description": "Team ID"
    },
    "title": {
      "type": "string", 
      "description": "Issue title"
    },
    "description": {
      "type": "string",
      "description": "Issue description"
    },
    "assigneeId": {
      "type": "string",
      "description": "Assignee ID. Use 'me' to assign to the current user"
    },
    "priority": {
      "type": "number",
      "description": "Issue priority (0-4)"
    }
  },
  "required": ["teamId", "title"]
}
```

**Response**:
```json
{
  "id": "issue-id",
  "identifier": "TEAM-123",
  "title": "Issue title", 
  "url": "https://linear.app/team/issue/TEAM-123"
}
```

### Tool: `update_issue`

Update an existing issue in Linear with comprehensive modification options.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "issueId": {
      "type": "string",
      "description": "Issue ID to update"
    },
    "title": {
      "type": "string",
      "description": "New issue title"
    },
    "description": {
      "type": "string",
      "description": "New issue description"
    },
    "assigneeId": {
      "type": "string",
      "description": "New assignee ID. Use 'me' to assign to current user, empty string to unassign"
    },
    "priority": {
      "type": "number",
      "description": "New issue priority (0-4)"
    },
    "stateId": {
      "type": "string",
      "description": "New workflow state ID"
    }
  },
  "required": ["issueId"]
}
```

**Response**:
```json
{
  "id": "issue-id",
  "identifier": "TEAM-123",
  "title": "Updated issue title",
  "url": "https://linear.app/team/issue/TEAM-123",
  "status": "In Progress"
}
```

### Tool: `get_my_issues`

Get issues assigned to the current user with enhanced filtering and information.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "number",
      "description": "Maximum number of issues to return (default: 50, max: 250)"
    }
  }
}
```

**Response**:
```json
{
  "issues": [
    {
      "id": "issue-id",
      "identifier": "TEAM-123",
      "title": "Issue title",
      "description": "Issue description",
      "status": "In Progress",
      "url": "https://linear.app/team/issue/TEAM-123",
      "assignee": "John Doe",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "team": {
        "id": "team-id",
        "name": "Team Name",
        "key": "TEAM"
      },
      "project": {
        "id": "project-id",
        "name": "Project Name",
        "url": "https://linear.app/project/project-id",
        "status": "Active"
      }
    }
  ]
}
```

### Tool: `get_teams`

Get all teams in the workspace.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {}
}
```

**Response**:
```json
{
  "teams": [
    {
      "id": "team-id",
      "name": "Team Name",
      "key": "TEAM",
      "description": "Team description"
    }
  ]
}
```

## Development

### Project Structure

- **`src/index.ts`**: Main server entry point with MCP protocol handling
- **`src/types.ts`**: TypeScript type definitions for all interfaces
- **`src/utils/`**: Utility modules for configuration, logging, and error handling
- **`src/services/`**: Business logic layer for Linear API interactions

### Key Design Patterns

- **Singleton Pattern**: Used for services to ensure single instance management
- **Error Boundary Pattern**: Comprehensive error handling at all levels
- **Configuration Pattern**: Centralized configuration with validation
- **Service Layer Pattern**: Clean separation between API logic and MCP handling

### Available Scripts

```bash
npm run build        # Build TypeScript to JavaScript
npm run watch        # Watch mode for development
npm start            # Start the MCP server
npm test             # Run tests (when implemented)
npm run setup:claude # Auto-configure Claude Desktop
npm run repair:claude # Fix malformed Claude Desktop config
```

## Troubleshooting

### Common Issues

1. **"Missing LINEAR_API_KEY"**: Ensure your `.env` file exists and contains a valid Linear API key
2. **"Server does not support tools"**: This indicates an MCP client compatibility issue
3. **"Failed to fetch teams"**: Check your Linear API key permissions
4. **JSON syntax errors in Claude config**: Use the repair script to fix malformed configuration files

### MCP Communication Issues

If you encounter JSON parsing errors or communication issues with MCP clients (Cursor, Claude Desktop, etc.):

#### Symptoms
- "Expected ',' or ']' after array element in JSON at position X"
- "Unexpected token 'X' is not valid JSON" 
- Client shows "Client error for command" repeatedly
- MCP tools not appearing or failing to execute

#### Root Cause
These issues typically occur when **log output interferes with JSON-RPC communication**. The MCP protocol requires:
- **stdout**: JSON-RPC messages ONLY
- **stderr**: All logging output

#### Solutions

**✅ Server-Side (Already Fixed in v0.3.1+)**
The server now properly separates logging from JSON-RPC communication:
```bash
# Logs go to stderr, JSON-RPC to stdout
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node build/index.js
```

**✅ Client-Side Verification**
1. **Restart your MCP client** (Cursor, Claude Desktop, etc.) after updating
2. **Check client logs** for successful connection messages
3. **Test basic functionality**: Try listing tools or calling a simple tool

**✅ Manual Testing**
```bash
# Test tools list (should return clean JSON)
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node build/index.js

# Test simple tool call
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "get_teams", "arguments": {}}}' | node build/index.js
```

**✅ Debug Mode**
For troubleshooting, enable debug logging (outputs to stderr):
```env
LOG_LEVEL=debug
NODE_ENV=development
```

If issues persist after updating to v0.3.1+, please check that you're using the latest build:
```bash
npm run build  # Rebuild with latest fixes
```

### JSON Configuration Errors

If you see JSON parsing errors like "Unexpected token" or "is not valid JSON" in **Claude Desktop configuration**:

#### Quick Fix
```bash
# Run the repair script to fix JSON syntax issues
npm run repair:claude

# Then try setting up again
npm run setup:claude
```

#### Manual Fix
1. Close Claude Desktop completely
2. Navigate to the config file location:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`
3. Delete the config file (a backup will be created automatically)
4. Run the setup script again: `npm run setup:claude`

### Debugging

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file:

```env
LOG_LEVEL=debug
```

This will provide detailed logs of all API calls and server operations.

## Performance

The server is optimized for performance with:

- **Parallel Processing**: Concurrent API calls using `Promise.all()`
- **Singleton Pattern**: Efficient resource management
- **Structured Logging**: Minimal performance overhead
- **TypeScript**: Compile-time optimizations

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/linear-mcp-server.git`
3. Install dependencies: `npm install`
4. Create a `.env` file with your Linear API key
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow the existing code organization patterns
- Add appropriate error handling
- Include JSDoc comments for public APIs
- Ensure all tests pass
