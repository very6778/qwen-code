# CLAUDE.md

This file provides comprehensive guidance for Claude Code (claude.ai/code) when working with the Qwen Code repository.

## Project Overview

Qwen Code is a CLI-based AI development workflow tool adapted from Google Gemini CLI, optimized for Qwen3-Coder models. It's a TypeScript monorepo with a tool-based architecture where the AI can execute various operations (file I/O, shell commands, web fetching, etc.) through a secure tool execution system.

## Complete Architecture

### Monorepo Structure

```
qwen-code/
├── packages/
│   ├── cli/                    # User-facing CLI interface (React Ink TUI)
│   ├── core/                   # Backend engine (AI communication + tool orchestration)
│   ├── test-utils/             # Shared testing utilities
│   └── vscode-ide-companion/   # VS Code extension for IDE integration
├── scripts/                    # Build and utility scripts
├── integration-tests/          # End-to-end testing suite
├── docs/                       # Comprehensive documentation
└── .github/                    # CI/CD workflows
```

### Package Dependencies

- **cli** depends on **core** and **test-utils**
- **core** is standalone with external AI provider dependencies
- **vscode-ide-companion** is standalone IDE extension
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
│   ├── editor.ts            # Editor integration
│   ├── gitUtils.ts          # Git helper functions
│   ├── workspaceContext.ts  # Workspace context management
│   └── formatters.ts        # Data formatting utilities
├── ide/                       # IDE integration
│   ├── ide-client.ts        # IDE communication client
│   ├── ideContext.ts        # IDE state management
│   ├── ide-installer.ts     # IDE extension installation
│   ├── detect-ide.ts        # IDE detection logic
│   └── process-utils.ts     # Process management
├── mcp/                       # Model Context Protocol
│   ├── oauth-provider.ts    # OAuth authentication
│   ├── oauth-token-storage.ts # Token persistence
│   └── token-storage/       # Token storage implementations
├── subagents/                 # Sub-agent system
│   ├── subagent-manager.ts  # Agent lifecycle management
│   ├── subagent.ts          # Individual agent implementation
│   ├── builtin-agents.ts    # Predefined agents
│   └── types.ts             # Agent type definitions
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
│   │   ├── messages/         # Message display components
│   │   └── subagents/        # Sub-agent management UI
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
├── zed-integration/           # Zed editor integration
│   ├── zedIntegration.ts     # Main integration logic
│   ├── acp.ts                # ACP protocol implementation
│   └── fileSystemService.ts  # File system operations
└── index.ts                  # CLI entry point
```

### VS Code Extension (`packages/vscode-ide-companion/src/`)

```
packages/vscode-ide-companion/src/
├── extension.ts              # Main extension entry point
├── server.ts                 # HTTP server for IDE communication
├── diff/                     # Diff handling for code edits
│   ├── diffProvider.ts       # Diff visualization
│   └── diffController.ts     # Diff state management
└── utils/                    # Extension utilities
    ├── authentication.ts     # IDE authentication
    └── workspace.ts          # Workspace management
```

## Key Architectural Patterns

### 1. Tool System Architecture

**Location**: `/packages/core/src/tools/`

- **Tool Interface**: All tools implement `ToolInvocation` interface with validation, execution, and confirmation
- **Tool Registry**: Central registration system in `tool-registry.ts`
- **Tool Categories**:
  - File System: `read-file`, `write-file`, `edit`, `ls`, `glob`
  - Search: `grep`, `ripGrep`, `web-search`
  - Execution: `shell`, `task`
  - Communication: `web-fetch`, `mcp-client`, `mcp-tool`
  - Management: `memoryTool`, `todoWrite`

### 2. Configuration Management

**Multi-layered system** in `/packages/core/src/config/`:

- **Environment Variables**: `.env` files
- **Project Settings**: `.qwen/settings.json` in project root
- **User Settings**: `~/.qwen/settings.json`
- **CLI Arguments**: Command-line overrides
- **Session Settings**: In-memory session overrides

**Key files**:
- `config.ts`: Main configuration loading and merging
- `storage.ts`: Persistent settings storage
- `models.ts`: Configuration data models and validation

### 3. AI Communication Layer

**Location**: `/packages/core/src/core/`

- **Content Generator Interface**: Abstraction over different AI providers
- **Providers**:
  - Google Gemini via `@google/genai`
  - OpenAI-compatible via `openai` package
  - Qwen via custom implementation
- **Streaming Support**: Real-time response streaming
- **Tool Orchestration**: `coreToolScheduler.ts` manages tool execution

### 4. IDE Integration System

**Location**: `/packages/core/src/ide/`

- **IDE Detection**: Automatic detection of VS Code, Zed, etc.
- **Communication**: HTTP-based communication protocol
- **Features**:
  - Diff visualization for code edits
  - Real-time file synchronization
  - Workspace context sharing
  - Authentication and security

### 5. Session Management

**Components**:
- **Token Limits**: Intelligent context window management
- **History Persistence**: Conversation history storage
- **Compression**: Smart context compression when limits reached
- **Memory Management**: Context memory and retrieval

### 6. Security Architecture

- **Sandboxing**: Docker/Podman containerization for tool execution
- **Confirmation System**: User confirmation for destructive operations
- **Trusted Folders**: Security boundaries for file access
- **Authentication**: OAuth2 and token-based auth for external services

## Development Workflows

### Adding New Tools

1. Create tool file in `/packages/core/src/tools/`
2. Implement `ToolInvocation` interface
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
2. Implement provider interface
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
- **IDE Integration**: `/docs/ide-integration.md`
- **Troubleshooting**: `/docs/troubleshooting.md`

## Development Notes

- **Node.js**: Version 20+ required
- **TypeScript**: Strict configuration with ES modules
- **Package Manager**: npm with workspaces
- **Code Style**: ESLint + Prettier with pre-commit hooks
- **Testing**: Comprehensive test coverage required
- **Security**: Docker-based sandboxing for tool execution
- **Performance**: Terminal benchmarking and optimization