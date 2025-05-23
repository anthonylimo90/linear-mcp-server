# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2025-01-02

### Fixed
- **MCP Communication Issues**: Resolved JSON parsing errors in Cursor and other MCP clients
  - Fixed logger configuration to output to stderr instead of stdout using `destination: 2`
  - Made startup configuration logging conditional (debug mode only) to prevent interference
  - Changed info-level operational logs to debug-level to ensure clean JSON-RPC communication
  - Ensured complete compliance with MCP stdio protocol requirements
- **Client Compatibility**: Improved compatibility with Cursor IDE, Claude Desktop, and other MCP clients
  - Eliminated "Unexpected token" and "Expected ',' or ']'" JSON parsing errors
  - Ensured clean separation between JSON-RPC messages (stdout) and logging (stderr)

### Changed
- **Logging Behavior**: Reduced default logging verbosity for MCP operations
  - Startup and operational messages moved to debug level
  - Configuration logging only appears in development mode with debug level enabled
  - Error logging maintained for critical issues

### Technical Improvements
- **MCP Protocol Compliance**: Full adherence to Model Context Protocol stdio communication standards
- **Better Debugging**: Conditional logging that doesn't interfere with client communication
- **Production Ready**: Clean JSON output suitable for all MCP client integrations

## [0.3.0] - 2025-01-02

### Added
- **Issue Update Functionality**: New `update_issue` tool for modifying existing Linear issues
  - Update issue title, description, assignee, priority, and workflow state
  - Support for reassigning issues using 'me' keyword or specific user IDs
  - Support for unassigning issues using empty string
  - Full validation and error handling for all update operations
- **Enhanced Issue Information**: Issues now include comprehensive team and project data
  - Team information with ID, name, and key
  - Project information with ID, name, URL, and status
  - Optimized async processing for fetching related data
- **Increased Query Limits**: Updated default and maximum limits for better productivity
  - Default limit increased from 10 to 50 issues
  - Maximum limit raised to 250 issues with performance optimizations
  - Smart rate limiting to prevent API throttling
- **Enhanced Service Layer**: Extended `LinearService` with update capabilities
  - New `updateIssue()` method with comprehensive parameter support
  - Improved error handling and logging for update operations
  - Better type safety with updated interfaces

### Changed
- **Issue Response Format**: Enhanced issue objects to include team and project information
- **API Performance**: Optimized concurrent fetching of issue metadata (team, project, state, assignee)
- **Type Definitions**: Extended `Issue` interface with team and project fields
- **Service Methods**: Updated search methods to support higher limits and better performance

### Fixed
- **Rate Limiting**: Improved handling of Linear API rate limits with better error messages
- **Type Safety**: Enhanced type definitions for update operations
- **Async Processing**: Better error handling in concurrent API calls

### Technical Improvements
- **Update Operations**: Full CRUD support for Linear issues through MCP interface
- **Data Enrichment**: Issues now provide complete context with team and project information
- **Performance**: Optimized parallel processing for enhanced response times
- **Scalability**: Support for larger result sets with intelligent limit management

## [0.2.0] - 2025-01-01

### Added
- **Type Safety**: Comprehensive TypeScript interfaces for all requests and responses
- **Service Layer**: New `LinearService` class with singleton pattern for API interactions
- **Configuration Management**: Centralized configuration with environment variable validation
- **Enhanced Error Handling**: Custom `AppError` class and structured error responses
- **Advanced Logging**: Improved logging with Pino integration and multiple log levels
- **Performance Optimization**: Parallel async processing using `Promise.all()` for faster responses
- **Documentation**: Comprehensive README with API reference and troubleshooting guide
- **Development Tools**: Example environment file and improved development workflow
- **Client Integration**: Support for Claude Desktop, VS Code, Cursor, and Continue.dev
- **Automatic Setup**: Interactive setup script for easy Claude Desktop configuration
- **Quick Start Guide**: 3-step setup process for immediate use

### Changed
- **Server Architecture**: Refactored to use proper MCP server initialization with capabilities
- **Tool Schema**: Updated to use correct `inputSchema` format for MCP compliance
- **Error Handling**: Centralized error handling with consistent error response format
- **Code Organization**: Restructured into logical modules (utils, services, types)
- **Async Processing**: Optimized issue fetching with concurrent API calls

### Fixed
- **MCP Compliance**: Fixed server initialization to properly support MCP protocol
- **Type Issues**: Resolved all TypeScript compilation errors and type safety issues
- **Performance**: Eliminated sequential async operations in favor of parallel processing
- **Tool Definitions**: Corrected tool schema format for proper MCP client compatibility

### Technical Improvements
- **Project Structure**: Organized code into logical modules:
  - `src/types.ts` - Type definitions
  - `src/utils/` - Utility functions (config, error, logger)
  - `src/services/` - Business logic services
- **Design Patterns**: Implemented singleton pattern for service management
- **Error Boundaries**: Comprehensive error handling at all application layers
- **Graceful Shutdown**: Added proper signal handling for clean server shutdown

## [0.1.0] - 2024-12-01

### Added
- Initial release of Linear MCP Server
- Basic search, create, and list functionality for Linear issues and teams
- MCP protocol implementation with stdio transport
- Linear API integration
- Basic error handling and logging 