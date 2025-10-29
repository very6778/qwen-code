# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qwen Code is a streamlined CLI-based AI development workflow tool adapted from Google Gemini CLI, optimized for Qwen3-Coder models. It's a TypeScript monorepo with a tool-based architecture where the AI can execute various operations (file I/O, shell commands, web fetching, etc.) through a secure tool execution system.

**Current Status**: The project has been simplified to focus on core AI development workflow functionality. Sub-agent and IDE integration features have been removed to streamline the user experience.

## Complete Architecture

### Monorepo Structure

```
qwen-code/
├── packages/
│   ├── cli/                    # User-facing CLI interface (React Ink TUI)
│   ├── core/                   # Backend engine (AI communication + tool orchestration)
│   ├── test-utils/             # Shared testing utilities
│   └── vscode-ide-companion/   # VS Code extension (archived - no longer maintained)
├── scripts/                    # Build and utility scripts
├── integration-tests/          # End-to-end testing suite
├── docs/                       # Comprehensive documentation
└── .github/                    # CI/CD workflows
```

### Package Dependencies

- **cli** depends on **core** and **test-utils**
- **core** is standalone with external AI provider dependencies
- **vscode-ide-companion** is archived (IDE integration removed)
- **test-utils** shared across all packages

## Development Commands

```bash
# Build and development
npm run build              # Build all packages
npm run build:all          # Build + sandbox + VSCode extension
npm run build:packages     # Build only workspace packages
npm run build:sandbox      # Build Docker sandbox
npm run build:vscode       # Build VS Code extension
npm run start              # Start development server
npm run debug              # Start with Node.js debugging

# Testing
npm run test               # Run all tests across workspaces
npm run test:ci            # Run tests with coverage
npm run test:watch         # Watch mode
npm run test:e2e           # End-to-end integration tests
npm run test:integration:all  # All integration test variants
npm run test:terminal-bench   # Terminal performance benchmarks

# Code quality
npm run lint               # ESLint with TypeScript rules
npm run lint:fix           # Auto-fix linting issues
npm run lint:ci            # Strict linting for CI
npm run format             # Prettier formatting
npm run typecheck          # TypeScript type checking
npm run preflight          # Complete CI pipeline locally

# Utilities
npm run clean              # Clean build artifacts
npm run bundle             # Create distribution bundle
npm run generate           # Generate git commit info
```

## Detailed File Structure

### Core Package (`packages/core/src/`)

```
packages/core/src/
├── config/                    # Configuration management
│   ├── config.ts             # Main configuration logic
│   ├── storage.ts            # Settings persistence
│   ├── models.ts             # Configuration data models
│   └── flashFallback.test.ts
├── core/                      # AI communication engine
│   ├── client.ts             # Main AI client
│   ├── contentGenerator.ts   # Content generation interface
│   ├── geminiChat.ts         # Gemini chat implementation
│   ├── geminiRequest.ts      # Request handling
│   ├── coreToolScheduler.ts  # Tool execution orchestration
│   ├── nonInteractiveToolExecutor.ts
│   ├── openaiContentGenerator/  # OpenAI provider support
│   │   ├── provider/        # Different OpenAI providers
│   │   ├── converter.ts     # Message format conversion
│   │   └── index.ts
│   ├── prompts.ts           # System prompts and templates
│   ├── tokenLimits.ts       # Token management
│   └── turn.ts              # Conversation turn handling
├── tools/                     # Core tool implementations
│   ├── tools.ts             # Tool interface definitions
│   ├── tool-registry.ts     # Tool registration system
│   ├── tool-error.ts        # Error handling
│   ├── tool-names.ts        # Tool name constants
│   ├── read-file.ts         # File reading operations
│   ├── write-file.ts        # File writing operations
│   ├── edit.ts              # File editing with diff
│   ├── ls.ts                # Directory listing
│   ├── glob.ts              # Pattern matching
│   ├── grep.ts              # Text search
│   ├── ripGrep.ts           # Advanced search with ripgrep
│   ├── shell.ts             # Shell command execution
│   ├── web-fetch.ts         # HTTP requests
│   ├── web-search.ts        # Web search functionality
│   ├── memoryTool.ts        # Memory/context management
│   ├── todoWrite.ts         # Task management
│   ├── task.ts              # Background task execution
│   ├── read-many-files.ts   # Bulk file operations
│   ├── mcp-client.ts        # MCP server connections
│   ├── mcp-tool.ts          # MCP tool execution
│   └── mcp-client-manager.ts # MCP client lifecycle
├── services/                  # Business logic services
│   ├── fileSystemService.ts  # File operations abstraction
│   ├── fileDiscoveryService.ts # Project file discovery
│   ├── gitService.ts        # Git operations
│   ├── shellExecutionService.ts # Shell command execution
│   └── chatRecordingService.ts # Conversation persistence
├── utils/                     # Utility functions
│   ├── filesearch/           # File search algorithms
│   │   ├── crawler.ts       # File system crawling
│   │   ├── fileSearch.ts    # Search implementation
│   │   └── ignore.ts        # Gitignore-style patterns
│   ├── request-tokenizer/   # Token counting utilities
│   ├── gitUtils.ts          # Git helper functions
│   └── formatters.ts        # Data formatting utilities
├── mcp/                       # Model Context Protocol
│   ├── oauth-provider.ts    # OAuth authentication
│   ├── oauth-token-storage.ts # Token persistence
│   └── token-storage/       # Token storage implementations
├── telemetry/                 # Analytics and monitoring
│   ├── loggers.ts           # Logging infrastructure
│   ├── metrics.ts           # Metrics collection
│   ├── clearcut-logger/     # Specific logger implementation
│   └── qwen-logger/         # Qwen-specific logging
├── qwen/                      # Qwen-specific functionality
│   ├── qwenContentGenerator.ts # Qwen API integration
│   ├── qwenOAuth2.ts        # Qwen authentication
│   └── sharedTokenManager.ts # Token sharing management
└── index.ts                  # Public API exports
```

### CLI Package (`packages/cli/src/`)

```
packages/cli/src/
├── ui/                        # React Ink UI components
│   ├── App.tsx               # Main application component
│   ├── components/           # Reusable UI components
│   │   ├── Header.tsx        # Application header
│   │   ├── Footer.tsx        # Application footer
│   │   ├── InputPrompt.tsx   # User input handling
│   │   └── messages/         # Message display components
│   ├── contexts/             # React contexts
│   │   ├── SessionContext.tsx # Session state management
│   │   ├── SettingsContext.tsx # Settings state
│   │   └── StreamingContext.tsx # Streaming state
│   ├── hooks/                # Custom React hooks
│   │   ├── useGeminiStream.ts # AI response streaming
│   │   ├── useInputHistory.ts # Command history
│   │   ├── useThemeCommand.ts # Theme management
│   │   └── useAuthCommand.ts  # Authentication handling
│   ├── commands/             # UI command handlers
│   │   ├── helpCommand.ts    # Help system
│   │   ├── settingsCommand.ts # Settings management
│   │   └── themeCommand.ts   # Theme switching
│   ├── themes/               # Color themes
│   │   ├── default.ts        # Default theme
│   │   ├── dracula.ts        # Dracula theme
│   │   └── theme-manager.ts  # Theme management logic
│   └── utils/                # UI utilities
│       ├── MarkdownDisplay.tsx # Markdown rendering
│       ├── commandUtils.ts   # Command processing
│       └── displayUtils.ts   # Display utilities
├── commands/                  # CLI command implementations
│   ├── mcp/                  # MCP management commands
│   │   ├── add.ts           # Add MCP server
│   │   ├── list.ts          # List MCP servers
│   │   └── remove.ts        # Remove MCP server
│   ├── extensions/           # Extension management
│   │   ├── install.ts       # Install extensions
│   │   ├── uninstall.ts     # Uninstall extensions
│   │   └── list.ts          # List extensions
│   └── mcp.ts                # MCP command router
├── config/                    # Configuration handling
│   ├── config.ts             # Configuration loading
│   ├── settings.ts           # Settings management
│   ├── auth.ts               # Authentication configuration
│   └── trustedFolders.ts     # Security settings
├── services/                  # CLI business logic
│   ├── CommandService.ts     # Command execution service
│   ├── BuiltinCommandLoader.ts # Built-in command loading
│   └── prompt-processors/    # Input preprocessing
│       ├── argumentProcessor.ts
│       ├── atFileProcessor.ts
│       └── shellProcessor.ts
├── utils/                     # CLI utilities
│   ├── gitUtils.ts          # Git operations
│   ├── installationInfo.ts   # Installation detection
│   ├── sandbox.ts            # Sandbox configuration
│   └── version.ts            # Version management
└── index.ts                  # CLI entry point
```

### VS Code Extension (Archived)

The VS Code extension (`packages/vscode-ide-companion/`) is no longer maintained as part of the project simplification. IDE integration features have been removed to focus on core CLI functionality.

```
packages/vscode-ide-companion/src/
├── extension.ts              # Main extension entry point (archived)
├── server.ts                 # HTTP server for IDE communication (archived)
├── diff/                     # Diff handling for code edits (archived)
└── utils/                    # Extension utilities (archived)
```

## Key Architectural Patterns

### 1. Multi-Provider AI Architecture with Pluggable Content Generators

**Location**: `/packages/core/src/core/`

The system uses a sophisticated provider-based architecture that supports multiple AI providers through a unified interface:

- **Content Generator Interface**: Abstract base class that defines common operations like `generateContent`, `generateContentStream`, `countTokens`, and `embedContent`
- **Provider Pattern**: Different AI providers (Gemini, OpenAI, Qwen, ZAI, etc.) implement specialized providers that handle API-specific logic
- **Dynamic Provider Selection**: The `determineProvider()` function automatically selects the appropriate provider based on configuration, model names, and endpoints
- **Specialized Qwen Integration**: Custom `QwenContentGenerator` extends `OpenAIContentGenerator` with OAuth token management and automatic refresh capabilities

### 2. Declarative Tool System with Execution Lifecycle

**Location**: `/packages/core/src/tools/`

The tool architecture is highly sophisticated with clear separation of concerns:

- **Tool Interface Hierarchy**:
  - `ToolBuilder` - Base interface for tool registration
  - `DeclarativeTool` - Abstract base class with validation logic
  - `BaseDeclarativeTool` - Concrete implementation with JSON schema validation
  - `ToolInvocation` - Represents a validated, ready-to-execute tool call

- **Tool Registry Pattern**: Centralized `ToolRegistry` manages tool discovery, registration, and provides function declarations to AI models
- **Tool Discovery**: Supports multiple discovery mechanisms:
  - Static registration of core tools
  - Dynamic discovery via command-line tools
  - MCP (Model Context Protocol) server integration

### 3. Sophisticated Configuration System with Multiple Layers

**Location**: `/packages/core/src/config/`

The configuration system is multi-layered and hierarchical:

- **Configuration Sources** (in priority order):
  1. CLI arguments (highest)
  2. Session overrides
  3. Project settings (`.qwen/settings.json`)
  4. User settings (`~/.qwen/settings.json`)
  5. Environment variables
  6. Default values (lowest)

- **Config Class Design**: The main `Config` class acts as a configuration orchestrator that:
  - Manages initialization order
  - Provides type-safe accessors
  - Handles configuration validation
  - Manages dependent services (tool registry, file service, etc.)

### 4. Advanced Tool Execution with Confirmation Flow

**Location**: `/packages/core/src/core/coreToolScheduler.ts`

The tool execution system includes sophisticated approval and confirmation mechanisms:

- **CoreToolScheduler**: Manages tool execution lifecycle with states:
  - `validating` → `scheduled` → `executing` → `success/error/cancelled`
  - `awaiting_approval` for interactive confirmation
- **Approval Modes**: Multiple approval strategies:
  - `DEFAULT` - Standard confirmation for destructive operations
  - `PLAN` - Read-only mode for planning
  - `AUTO_EDIT` - Automatic approval for certain operations
  - `YOLO` - Execute without confirmation
- **Tool Confirmation Details**: Rich confirmation system with different types (edit, execute, MCP, info)

### 5. MCP (Model Context Protocol) Integration

**Location**: `/packages/core/src/mcp/` and `/packages/core/src/tools/mcp-*.ts`

The system has deep MCP integration for external tool and prompt providers:

- **MCP Client Management**: `McpClientManager` handles multiple MCP servers
- **Transport Support**: Multiple transport types (stdio, SSE, HTTP, WebSocket)
- **OAuth Integration**: `MCPOAuthProvider` handles OAuth authentication for MCP servers
- **Dynamic Tool Discovery**: MCP servers can expose tools that are automatically registered

### 6. Streaming and State Management Architecture

**Location**: `/packages/cli/src/`

The CLI uses React Ink with sophisticated state management:

- **Streaming Context**: Global state for managing AI response streaming
- **Message Queue**: Handles user input during streaming to prevent lost input
- **History Management**: Comprehensive conversation history with persistence
- **Real-time Updates**: Live tool execution output streaming

### 7. Multi-Model Support with Automatic Fallback

The system supports multiple AI models with intelligent fallback:

- **Model Switching**: Dynamic model switching during sessions
- **Flash Fallback**: Automatic fallback to faster models when quota limits are reached
- **Vision Model Auto-Switch**: Automatic detection and switching for vision-capable models
- **User Tier Awareness**: Different behavior based on user subscription tiers

### 8. File System Abstraction and Filtering

**Location**: `/packages/core/src/services/fileDiscoveryService.ts`

Sophisticated file system handling with respect for version control:

- **FileDiscoveryService**: Centralized file discovery with git-aware filtering
- **Multi-layer Filtering**: Supports both `.gitignore` and `.qwenignore` patterns
- **Workspace Context**: Manages multiple include directories and project structure
- **Security Boundaries**: Trusted folder system for security restrictions

### 9. Service Layer Architecture

Clean separation of business logic through services:

- **FileSystemService**: Abstracted file operations
- **GitService**: Git operations and integration
- **ShellExecutionService**: Secure shell command execution
- **ChatRecordingService**: Conversation persistence

### 10. OAuth and Authentication Management

**Location**: `/packages/core/src/qwen/` and `/packages/core/src/mcp/`

Sophisticated authentication system supporting multiple providers:

- **Qwen OAuth**: Custom OAuth2 implementation with automatic token refresh
- **Shared Token Manager**: Centralized token management across components
- **Multiple Auth Types**: Support for API keys, OAuth, Google credentials, etc.
- **Authentication State Management**: Rich authentication state with timeout handling

## Key Design Patterns Used

1. **Provider Pattern** - For AI provider abstraction
2. **Registry Pattern** - For tool and prompt management
3. **Strategy Pattern** - For different approval modes and authentication methods
4. **Observer Pattern** - For streaming updates and state changes
5. **Factory Pattern** - For creating content generators and providers
6. **Command Pattern** - For tool execution with undo/redo capabilities
7. **State Machine** - For tool execution lifecycle and connection states

## Simplified Architecture

**Note**: IDE integration and sub-agent systems have been removed as part of project simplification.

- **Removed Features**:
  - IDE detection and communication
  - Sub-agent delegation system
  - Diff visualization in IDEs
  - Workspace context sharing with IDEs

- **Current Focus**: Core CLI-based AI workflow with direct tool execution

## Development Workflows

### Adding New Tools

1. Create tool file in `/packages/core/src/tools/`
2. Extend `BaseDeclarativeTool` class and implement `invoke()` method
3. Add to tool registry in `/packages/core/src/config/config.ts`
4. Add tests alongside tool file
5. Update documentation in `/docs/tools/`

### Adding CLI Commands

1. Create command in `/packages/cli/src/commands/`
2. Add command handler in `/packages/cli/src/ui/commands/`
3. Register in command service
4. Add tests and documentation

### Adding New AI Providers

1. Create provider in `/packages/core/src/core/openaiContentGenerator/provider/`
2. Implement provider interface extending `ContentGenerator`
3. Add configuration options
4. Add authentication handling
5. Add tests

## Testing Strategy

### Unit Tests

- **Framework**: Vitest
- **Location**: Alongside source files (`.test.ts`)
- **Coverage**: Integrated coverage reporting

### Integration Tests

- **Location**: `/integration-tests/`
- **Types**:
  - Sandbox variants (none, docker, podman)
  - Terminal benchmarks
  - E2E workflow tests

### Test Utilities

- **Location**: `/packages/test-utils/`
- **Contents**: Mock implementations, test helpers, fixtures

## Build and Deployment

### Build Process

1. **TypeScript Compilation**: Individual package compilation
2. **Bundling**: esbuild for optimized bundles
3. **Asset Copy**: Static asset management
4. **Package Preparation**: npm package preparation

### CI/CD Pipeline

- **Platform**: GitHub Actions
- **Stages**: Lint → Test → Build → Package → Release
- **Artifacts**: npm packages, Docker images, VS Code extensions

## Important Configuration Files

- **Root**: `package.json`, `tsconfig.json`, `esbuild.config.js`
- **Core**: `/packages/core/package.json`, tool configurations
- **CLI**: `/packages/cli/package.json`, React/Ink dependencies
- **VS Code**: `/packages/vscode-ide-companion/package.json`, extension manifest

## Documentation

- **Architecture**: `/docs/architecture.md`
- **Tools**: `/docs/tools/` (individual tool documentation)
- **Core API**: `/docs/core/`
- **Sub-agents**: `/docs/subagents.md` (historical reference - feature removed)
- **Troubleshooting**: `/docs/troubleshooting.md`

## Development Notes

- **Node.js**: Version 20+ required
- **TypeScript**: Strict configuration with ES modules
- **Package Manager**: npm with workspaces
- **Code Style**: ESLint + Prettier with pre-commit hooks
- **Testing**: Comprehensive test coverage required
- **Security**: Docker-based sandboxing for tool execution
- **Performance**: Terminal benchmarking and optimization

## Core Analysis Principle

**ALWAYS Analyze Before Acting:** Even with direct implementation requests, never make changes without first understanding the current structure, gathering relevant information, and analyzing the codebase. This analysis step must precede any implementation/modification work.

## Claude Code Core Principles

* Use tools when necessary.
* Work iteratively with checkpoints; for long/expensive or risky steps, request confirmation before proceeding.
* Never use emojis unless explicitly requested.
* Keep replies concise — under 1–4 sentences, excluding code and tool use.
* Never create or edit documentation or README files unless explicitly asked.
* Do not retry tool calls cancelled by the user unless requested.
* Focus strictly on the user's request — no tangents or unsolicited suggestions.
* After finishing, provide a brief summary (1–4 sentences) of what I did.
* Be mindful of token usage while ensuring completeness.
* If nearing token/context limits, summarize progress and ask whether to continue.
* Respond in the same language the user speaks

## Token Economy
* Prefer targeted reads/snippets for large files; avoid full-file reads unless necessary.

## Response Guidelines

Do exactly what the user asks — no more, no less.
Incorrect behaviors:
* Don't suggest improvements unless asked.
* Don't explain alternatives unless the user asks "how should I…".
* Don't add extra analysis or context.
* Don't offer to perform related tasks unless requested.
* No hacks, no unsafe shortcuts.
* Don't abandon tasks due to unexpected issues — debug systematically.

If the user asks how to approach something, first explain the plan briefly, then ask if they want me to implement it.
If the user asks me to do something clearly, I proceed with the implementation without asking for confirmation.

## Coding Conventions

* Understand the existing codebase structure and style before editing.
* Match surrounding code style and patterns.
* Use only existing dependencies; if adding a new one is required, ask first.
* Be cautious about security — never expose secrets, API keys, or credentials in any code or logs.