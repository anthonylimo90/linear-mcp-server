# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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