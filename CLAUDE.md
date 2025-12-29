# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Linear MCP Server is a Model Context Protocol server that enables AI agents to interact with Linear issue tracking. It communicates via stdio transport and provides 9 tools for managing Linear issues, teams, and workflow states.

## Common Commands

```bash
# Build & Run
npm run build         # Build TypeScript to JavaScript (output: build/)
npm start             # Start the MCP server (stdio transport)
npm run watch         # Watch mode for development

# Testing
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode for tests
npm run test:unit     # Run unit tests only
npm run test:integration  # Run integration tests only
npm test -- tests/unit/services/linearService.test.ts  # Run a single test file

# Linting & Formatting
npm run lint          # Check for linting errors
npm run lint:fix      # Fix auto-fixable linting errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without changes
```

## Pre-commit Hooks

Husky runs `lint-staged` on commit, which:
- Runs ESLint with auto-fix on staged `.ts` files
- Formats staged files with Prettier

To skip hooks (not recommended): `git commit --no-verify`

## Architecture

The server uses ES modules (`"type": "module"`) and TypeScript with strict mode.

### Key Layers

1. **MCP Server Layer** (`src/index.ts`): Handles MCP protocol, tool registration, request routing. Uses `@modelcontextprotocol/sdk` for stdio transport.

2. **Service Layer** (`src/services/linearService.ts`): Singleton `LinearService` class wrapping the Linear SDK. Features:
   - Rate limiting: 10 requests/second via `p-throttle`
   - Caching: viewer (5min), teams (10min), workflow states (15min per team)
   - Retry logic with exponential backoff (max 3 retries)
   - Special `"me"` assigneeId resolves to current user

3. **Validation Layer** (`src/utils/validation.ts`): Zod schemas for all tool inputs. Schemas are reused for type inference.

4. **Types** (`src/types.ts`): All request/response interfaces. The `Issue` type differs from Linear SDK's `Issue` - it's a formatted/flattened version.

### Data Flow

Tool call -> `src/index.ts` handler -> Zod validation -> `linearService` method -> Linear SDK -> Response formatting via `formatIssue()` -> MCP response

### Important Patterns

- **Logging**: Uses Pino. All logs go to stderr (required for MCP - stdout is reserved for JSON-RPC)
- **Error handling**: `AppError` class in `src/utils/error.ts` with status codes. Zod errors converted to `McpError`
- **Configuration**: `src/utils/config.ts` validates environment variables. `LINEAR_API_KEY` is required.

## Testing

Tests use Jest with `ts-jest/presets/default-esm`. The `__mocks__/p-throttle.js` mock bypasses rate limiting in tests.

Test structure:
- `tests/unit/` - Unit tests for individual modules
- `tests/integration/` - MCP server integration tests
- `tests/fixtures/` - Mock data for Linear API responses
- `tests/helpers/mocks.ts` - Shared mock utilities

## Environment Variables

Required:
- `LINEAR_API_KEY` - Linear API key

Optional:
- `LOG_LEVEL` - trace, debug, info, warn, error (default: info)
- `NODE_ENV` - development or production

## Debug Logging

Enable verbose logging for troubleshooting:

```bash
# Server debug logging (logs to stderr, won't interfere with MCP JSON-RPC)
LOG_LEVEL=debug npm start

# Test debug mode (runs tests sequentially with verbose output)
npm run test:debug
```

Debug logs include:
- API calls to Linear with parameters
- Cache hits/misses for viewer, teams, workflow states
- Retry attempts on transient failures
- Request/response timing
