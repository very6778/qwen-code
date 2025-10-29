# Subagents

> **⚠️ Status: This feature is currently not available in Qwen Code.**
> The sub-agent system has been removed in the current version to streamline the CLI and focus on core functionality.

This documentation is preserved for historical reference and may be reintroduced in future versions.

Subagents were specialized AI assistants that handled specific types of tasks within Qwen Code. They allowed you to delegate focused work to AI agents that were configured with task-specific prompts, tools, and behaviors.

## What are Subagents?

Subagents were independent AI assistants that:

- **Specialized in specific tasks** - Each subagent was configured with a focused system prompt for particular types of work
- **Had separate context** - They maintained their own conversation history, separate from your main chat
- **Used controlled tools** - You could configure which tools each subagent had access to
- **Worked autonomously** - Once given a task, they worked independently until completion or failure
- **Provided detailed feedback** - You could see their progress, tool usage, and execution statistics in real-time

## Key Benefits

- **Task Specialization**: Created agents optimized for specific workflows (testing, documentation, refactoring, etc.)
- **Context Isolation**: Kept specialized work separate from your main conversation
- **Reusability**: Saved and reused agent configurations across projects and sessions
- **Controlled Access**: Limited which tools each agent could use for security and focus
- **Progress Visibility**: Monitored agent execution with real-time progress updates

## How Subagents Worked

1. **Configuration**: You created subagent configurations that defined their behavior, tools, and system prompts
2. **Delegation**: The main AI could automatically delegate tasks to appropriate subagents
3. **Execution**: Subagents worked independently, using their configured tools to complete tasks
4. **Results**: They returned results and execution summaries back to the main conversation

## Getting Started

> **Note:** This section describes the previous functionality. Sub-agent commands are currently not available in Qwen Code.

### Previous Quick Start

1. **Create your first subagent**:

   ```
   /agents create
   ```

   Follow the guided wizard to create a specialized agent.

2. **Manage existing agents**:

   ```
   /agents manage
   ```

   View and manage your configured subagents.

3. **Use subagents automatically**:
   Simply ask the main AI to perform tasks that match your subagents' specializations. The AI would automatically delegate appropriate work.

### Previous Example Usage

```
User: "Please write comprehensive tests for the authentication module"

AI: I'll delegate this to your testing specialist subagent.
[Delegates to "testing-expert" subagent]
[Shows real-time progress of test creation]
[Returns with completed test files and execution summary]
```

## Management

> **Note:** These commands were available in previous versions but are currently disabled.

### Previous CLI Commands

Subagents were managed through the `/agents` slash command and its subcommands:

#### `/agents create`

Created a new subagent through a guided step wizard.

**Previous Usage:**

```
/agents create
```

#### `/agents manage`

Opened an interactive management dialog for viewing and managing existing subagents.

**Previous Usage:**

```
/agents manage
```

### Storage Locations

Subagents were stored as Markdown files in two locations:

- **Project-level**: `.qwen/agents/` (took precedence)
- **User-level**: `~/.qwen/agents/` (fallback)

This allowed you to have both project-specific agents and personal agents that worked across all projects.

> **Current Status:** These directories may still exist if you previously used sub-agents, but the system no longer reads or processes them.

### File Format

Subagents were configured using Markdown files with YAML frontmatter. This format was human-readable and easy to edit with any text editor.

## Current Alternatives (2025)

Since the sub-agent system has been streamlined out of Qwen Code, here are the current approaches for handling specialized tasks:

### Direct AI Assistance

The main Qwen Code AI now handles all tasks directly without delegation:

- **Task Specialization**: Simply describe your specific needs in detail
- **Context Awareness**: The AI maintains full context of your project and conversation
- **Tool Access**: Full access to all tools (file operations, shell commands, web search, etc.)
- **Continuous Conversation**: No context switching between different agents

### Example Usage

Instead of relying on specialized sub-agents, you can now:

```
User: "Please write comprehensive unit tests for the authentication module. I need tests for login, logout, password reset, and token validation. Use Jest and include mocking for the database calls."

User: "Create detailed API documentation for the user management endpoints. Include request/response examples, error codes, and authentication requirements."

User: "Review this React component for performance issues and suggest optimizations. I'm concerned about unnecessary re-renders and bundle size."
```

### Benefits of the Simplified Approach

- **Simplified Workflow**: No need to configure or manage separate agents
- **Better Context**: The AI maintains complete understanding of your project
- **Faster Response**: Direct communication without delegation overhead
- **Full Tool Access**: No restrictions on which tools can be used for specific tasks
- **Easier Debugging**: Single conversation history to review and troubleshoot

### Best Practices for Task Specialization

To get the best results for specialized tasks:

1. **Be Specific**: Clearly describe what you need, including technologies, frameworks, and standards
2. **Provide Context**: Include relevant details about your project structure and requirements
3. **Request Iterations**: Ask for step-by-step approaches or multiple options when appropriate
4. **Use Examples**: Provide code examples or references to guide the AI
5. **Give Constraints**: Specify any limitations, coding standards, or architectural patterns to follow

## Future Development

The sub-agent system may be reintroduced in future versions with:

- Improved configuration management
- Better integration with the core AI system
- Enhanced security and isolation features
- Performance optimizations for complex workflows

If you were a heavy user of sub-agents, consider providing feedback through GitHub issues to help shape the future implementation.

## Migration Guide

### For Previous Sub-Agent Users

If you previously used sub-agents, here's how to migrate your workflows:

#### Testing Specialist → Direct Testing Requests

Instead of configuring a testing specialist sub-agent:

```
Old way: /agents create testing-expert
New way: "Please act as a testing specialist and create comprehensive unit tests for..."
```

#### Documentation Writer → Direct Documentation Requests

Instead of using a documentation writer sub-agent:

```
Old way: Have documentation-writer subagent create API docs
New way: "Please create comprehensive API documentation for..."
```

#### Code Reviewer → Direct Review Requests

Instead of delegating to a code reviewer sub-agent:

```
Old way: Get code-reviewer subagent to check this implementation
New way: "Please review this code for security, performance, and maintainability issues..."
```

### Converting Existing Agent Configurations

If you have existing agent configurations you'd like to preserve, you can:

1. **Save the files**: Copy your agent files to a backup location
2. **Extract the system prompts**: Save the specialized prompts as snippets
3. **Use them as references**: Include relevant parts of these prompts in your requests

#### Example Migration

**Previous testing-expert agent:**

```markdown
---
name: testing-expert
description: Writes comprehensive unit tests, integration tests, and handles test automation
---

You are a testing specialist focused on creating high-quality, maintainable tests...
```

**Current approach:**

```
"Please act as a testing specialist with expertise in unit testing, integration testing, and test automation. Create comprehensive tests following best practices..."
```

## Archive Reference

For historical reference and potential future restoration, the complete sub-agent documentation is preserved below. All examples and configurations are written in the past tense to reflect their discontinued status.

#### Basic Structure

```markdown
---
name: agent-name
description: Brief description of when and how to use this agent
tools: tool1, tool2, tool3 # Optional
---

System prompt content goes here.
Multiple paragraphs are supported.
You can use ${variable} templating for dynamic content.
```

#### Example Usage

```markdown
---
name: project-documenter
description: Creates project documentation and README files
---

You are a documentation specialist for the ${project_name} project.

Your task: ${task_description}

Working directory: ${current_directory}
Generated on: ${timestamp}

Focus on creating clear, comprehensive documentation that helps both
new contributors and end users understand the project.
```

## Using Subagents Effectively

### Automatic Delegation

Qwen Code proactively delegates tasks based on:

- The task description in your request
- The description field in subagent configurations
- Current context and available tools

To encourage more proactive subagent use, include phrases like "use PROACTIVELY" or "MUST BE USED" in your description field.

### Explicit Invocation

Request a specific subagent by mentioning it in your command:

```
> Let the testing-expert subagent create unit tests for the payment module
> Have the documentation-writer subagent update the API reference
> Get the react-specialist subagent to optimize this component's performance
```

## Examples

### Development Workflow Agents

#### Testing Specialist

Perfect for comprehensive test creation and test-driven development.

```markdown
---
name: testing-expert
description: Writes comprehensive unit tests, integration tests, and handles test automation with best practices
tools: read_file, write_file, read_many_files, run_shell_command
---

You are a testing specialist focused on creating high-quality, maintainable tests.

Your expertise includes:

- Unit testing with appropriate mocking and isolation
- Integration testing for component interactions
- Test-driven development practices
- Edge case identification and comprehensive coverage
- Performance and load testing when appropriate

For each testing task:

1. Analyze the code structure and dependencies
2. Identify key functionality, edge cases, and error conditions
3. Create comprehensive test suites with descriptive names
4. Include proper setup/teardown and meaningful assertions
5. Add comments explaining complex test scenarios
6. Ensure tests are maintainable and follow DRY principles

Always follow testing best practices for the detected language and framework.
Focus on both positive and negative test cases.
```

**Use Cases:**

- "Write unit tests for the authentication service"
- "Create integration tests for the payment processing workflow"
- "Add test coverage for edge cases in the data validation module"

#### Documentation Writer

Specialized in creating clear, comprehensive documentation.

```markdown
---
name: documentation-writer
description: Creates comprehensive documentation, README files, API docs, and user guides
tools: read_file, write_file, read_many_files, web_search
---

You are a technical documentation specialist for ${project_name}.

Your role is to create clear, comprehensive documentation that serves both
developers and end users. Focus on:

**For API Documentation:**

- Clear endpoint descriptions with examples
- Parameter details with types and constraints
- Response format documentation
- Error code explanations
- Authentication requirements

**For User Documentation:**

- Step-by-step instructions with screenshots when helpful
- Installation and setup guides
- Configuration options and examples
- Troubleshooting sections for common issues
- FAQ sections based on common user questions

**For Developer Documentation:**

- Architecture overviews and design decisions
- Code examples that actually work
- Contributing guidelines
- Development environment setup

Always verify code examples and ensure documentation stays current with
the actual implementation. Use clear headings, bullet points, and examples.
```

**Use Cases:**

- "Create API documentation for the user management endpoints"
- "Write a comprehensive README for this project"
- "Document the deployment process with troubleshooting steps"

#### Code Reviewer

Focused on code quality, security, and best practices.

```markdown
---
name: code-reviewer
description: Reviews code for best practices, security issues, performance, and maintainability
tools: read_file, read_many_files
---

You are an experienced code reviewer focused on quality, security, and maintainability.

Review criteria:

- **Code Structure**: Organization, modularity, and separation of concerns
- **Performance**: Algorithmic efficiency and resource usage
- **Security**: Vulnerability assessment and secure coding practices
- **Best Practices**: Language/framework-specific conventions
- **Error Handling**: Proper exception handling and edge case coverage
- **Readability**: Clear naming, comments, and code organization
- **Testing**: Test coverage and testability considerations

Provide constructive feedback with:

1. **Critical Issues**: Security vulnerabilities, major bugs
2. **Important Improvements**: Performance issues, design problems
3. **Minor Suggestions**: Style improvements, refactoring opportunities
4. **Positive Feedback**: Well-implemented patterns and good practices

Focus on actionable feedback with specific examples and suggested solutions.
Prioritize issues by impact and provide rationale for recommendations.
```

**Use Cases:**

- "Review this authentication implementation for security issues"
- "Check the performance implications of this database query logic"
- "Evaluate the code structure and suggest improvements"

### Technology-Specific Agents

#### React Specialist

Optimized for React development, hooks, and component patterns.

```markdown
---
name: react-specialist
description: Expert in React development, hooks, component patterns, and modern React best practices
tools: read_file, write_file, read_many_files, run_shell_command
---

You are a React specialist with deep expertise in modern React development.

Your expertise covers:

- **Component Design**: Functional components, custom hooks, composition patterns
- **State Management**: useState, useReducer, Context API, and external libraries
- **Performance**: React.memo, useMemo, useCallback, code splitting
- **Testing**: React Testing Library, Jest, component testing strategies
- **TypeScript Integration**: Proper typing for props, hooks, and components
- **Modern Patterns**: Suspense, Error Boundaries, Concurrent Features

For React tasks:

1. Use functional components and hooks by default
2. Implement proper TypeScript typing
3. Follow React best practices and conventions
4. Consider performance implications
5. Include appropriate error handling
6. Write testable, maintainable code

Always stay current with React best practices and avoid deprecated patterns.
Focus on accessibility and user experience considerations.
```

**Use Cases:**

- "Create a reusable data table component with sorting and filtering"
- "Implement a custom hook for API data fetching with caching"
- "Refactor this class component to use modern React patterns"

#### Python Expert

Specialized in Python development, frameworks, and best practices.

```markdown
---
name: python-expert
description: Expert in Python development, frameworks, testing, and Python-specific best practices
tools: read_file, write_file, read_many_files, run_shell_command
---

You are a Python expert with deep knowledge of the Python ecosystem.

Your expertise includes:

- **Core Python**: Pythonic patterns, data structures, algorithms
- **Frameworks**: Django, Flask, FastAPI, SQLAlchemy
- **Testing**: pytest, unittest, mocking, test-driven development
- **Data Science**: pandas, numpy, matplotlib, jupyter notebooks
- **Async Programming**: asyncio, async/await patterns
- **Package Management**: pip, poetry, virtual environments
- **Code Quality**: PEP 8, type hints, linting with pylint/flake8

For Python tasks:

1. Follow PEP 8 style guidelines
2. Use type hints for better code documentation
3. Implement proper error handling with specific exceptions
4. Write comprehensive docstrings
5. Consider performance and memory usage
6. Include appropriate logging
7. Write testable, modular code

Focus on writing clean, maintainable Python code that follows community standards.
```

**Use Cases:**

- "Create a FastAPI service for user authentication with JWT tokens"
- "Implement a data processing pipeline with pandas and error handling"
- "Write a CLI tool using argparse with comprehensive help documentation"

## Best Practices

### Design Principles

#### Single Responsibility Principle

Each subagent should have a clear, focused purpose.

**✅ Good:**

```markdown
---
name: testing-expert
description: Writes comprehensive unit tests and integration tests
---
```

**❌ Avoid:**

```markdown
---
name: general-helper
description: Helps with testing, documentation, code review, and deployment
---
```

**Why:** Focused agents produce better results and are easier to maintain.

#### Clear Specialization

Define specific expertise areas rather than broad capabilities.

**✅ Good:**

```markdown
---
name: react-performance-optimizer
description: Optimizes React applications for performance using profiling and best practices
---
```

**❌ Avoid:**

```markdown
---
name: frontend-developer
description: Works on frontend development tasks
---
```

**Why:** Specific expertise leads to more targeted and effective assistance.

#### Actionable Descriptions

Write descriptions that clearly indicate when to use the agent.

**✅ Good:**

```markdown
description: Reviews code for security vulnerabilities, performance issues, and maintainability concerns
```

**❌ Avoid:**

```markdown
description: A helpful code reviewer
```

**Why:** Clear descriptions help the main AI choose the right agent for each task.

### Configuration Best Practices

#### System Prompt Guidelines

**Be Specific About Expertise:**

```markdown
You are a Python testing specialist with expertise in:

- pytest framework and fixtures
- Mock objects and dependency injection
- Test-driven development practices
- Performance testing with pytest-benchmark
```

**Include Step-by-Step Approaches:**

```markdown
For each testing task:

1. Analyze the code structure and dependencies
2. Identify key functionality and edge cases
3. Create comprehensive test suites with clear naming
4. Include setup/teardown and proper assertions
5. Add comments explaining complex test scenarios
```

**Specify Output Standards:**

```markdown
Always follow these standards:

- Use descriptive test names that explain the scenario
- Include both positive and negative test cases
- Add docstrings for complex test functions
- Ensure tests are independent and can run in any order
```

## Security Considerations

- **Tool Restrictions**: Subagents only have access to their configured tools
- **Sandboxing**: All tool execution follows the same security model as direct tool use
- **Audit Trail**: All subagent actions are logged and visible in real-time
- **Access Control**: Project and user-level separation provides appropriate boundaries
- **Sensitive Information**: Avoid including secrets or credentials in agent configurations
- **Production Environments**: Consider separate agents for production vs development environments
