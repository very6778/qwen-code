/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { ToolNames } from '../tools/tool-names.js';
import process from 'node:process';
import { isGitRepository } from '../utils/gitUtils.js';
import { GEMINI_CONFIG_DIR } from '../tools/memoryTool.js';
import type { GenerateContentConfig } from '@google/genai';

export interface ModelTemplateMapping {
  baseUrls?: string[];
  modelNames?: string[];
  template?: string;
}

export interface SystemPromptConfig {
  systemPromptMappings?: ModelTemplateMapping[];
}

/**
 * Normalizes a URL by removing trailing slash for consistent comparison
 */
function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Checks if a URL matches any URL in the array, ignoring trailing slashes
 */
function urlMatches(urlArray: string[], targetUrl: string): boolean {
  const normalizedTarget = normalizeUrl(targetUrl);
  return urlArray.some((url) => normalizeUrl(url) === normalizedTarget);
}

/**
 * Processes a custom system instruction by appending user memory if available.
 * This function should only be used when there is actually a custom instruction.
 *
 * @param customInstruction - Custom system instruction (ContentUnion from @google/genai)
 * @param userMemory - User memory to append
 * @returns Processed custom system instruction with user memory appended
 */
export function getCustomSystemPrompt(
  customInstruction: GenerateContentConfig['systemInstruction'],
  userMemory?: string,
): string {
  // Extract text from custom instruction
  let instructionText = '';

  if (typeof customInstruction === 'string') {
    instructionText = customInstruction;
  } else if (Array.isArray(customInstruction)) {
    // PartUnion[]
    instructionText = customInstruction
      .map((part) => (typeof part === 'string' ? part : part.text || ''))
      .join('');
  } else if (customInstruction && 'parts' in customInstruction) {
    // Content
    instructionText =
      customInstruction.parts
        ?.map((part) => (typeof part === 'string' ? part : part.text || ''))
        .join('') || '';
  } else if (customInstruction && 'text' in customInstruction) {
    // PartUnion (single part)
    instructionText = customInstruction.text || '';
  }

  // Append user memory using the same pattern as getCoreSystemPrompt
  const memorySuffix =
    userMemory && userMemory.trim().length > 0
      ? `\n\n---\n\n${userMemory.trim()}`
      : '';

  return `${instructionText}${memorySuffix}`;
}

export function getCoreSystemPrompt(
  userMemory?: string,
  config?: SystemPromptConfig,
  model?: string,
): string {
  // if GEMINI_SYSTEM_MD is set (and not 0|false), override system prompt from file
  // default path is .gemini/system.md but can be modified via custom path in GEMINI_SYSTEM_MD
  let systemMdEnabled = false;
  let systemMdPath = path.resolve(path.join(GEMINI_CONFIG_DIR, 'system.md'));
  const systemMdVar = process.env['GEMINI_SYSTEM_MD'];
  if (systemMdVar) {
    const systemMdVarLower = systemMdVar.toLowerCase();
    if (!['0', 'false'].includes(systemMdVarLower)) {
      systemMdEnabled = true; // enable system prompt override
      if (!['1', 'true'].includes(systemMdVarLower)) {
        let customPath = systemMdVar;
        if (customPath.startsWith('~/')) {
          customPath = path.join(os.homedir(), customPath.slice(2));
        } else if (customPath === '~') {
          customPath = os.homedir();
        }
        systemMdPath = path.resolve(customPath); // use custom path from GEMINI_SYSTEM_MD
      }
      // require file to exist when override is enabled
      if (!fs.existsSync(systemMdPath)) {
        throw new Error(`missing system prompt file '${systemMdPath}'`);
      }
    }
  }

  // Check for system prompt mappings from global config
  if (config?.systemPromptMappings) {
    const currentModel =
      process.env['LLM_MODEL'] ||
      process.env['OPENAI_MODEL'] ||
      process.env['GENAI_MODEL'] ||
      '';
    const currentBaseUrl =
      process.env['LLM_BASE_URL'] ||
      process.env['OPENAI_BASE_URL'] ||
      process.env['GENAI_BASE_URL'] ||
      '';

    const matchedMapping = config.systemPromptMappings.find((mapping) => {
      const { baseUrls, modelNames } = mapping;
      // Check if baseUrl matches (when specified)
      if (
        baseUrls &&
        modelNames &&
        urlMatches(baseUrls, currentBaseUrl) &&
        modelNames.includes(currentModel)
      ) {
        return true;
      }

      if (baseUrls && urlMatches(baseUrls, currentBaseUrl) && !modelNames) {
        return true;
      }
      if (modelNames && modelNames.includes(currentModel) && !baseUrls) {
        return true;
      }

      return false;
    });

    if (matchedMapping?.template) {
      const isGitRepo = isGitRepository(process.cwd());

      // Replace placeholders in template
      let template = matchedMapping.template;
      template = template.replace(
        '{RUNTIME_VARS_IS_GIT_REPO}',
        String(isGitRepo),
      );
      template = template.replace(
        '{RUNTIME_VARS_SANDBOX}',
        process.env['SANDBOX'] || '',
      );

      return template;
    }
  }

  const basePrompt = systemMdEnabled
    ? fs.readFileSync(systemMdPath, 'utf8')
    : `
You are Droid, an AI software engineering agent built by Factory.
You work within an interactive CLI tool and are focused on helping users with any software engineering tasks.

## Core Principles

* Use tools when necessary.
* Work iteratively with checkpoints; for long/expensive or risky steps, request confirmation before proceeding.
* Never use emojis unless explicitly requested.
* Keep replies concise — under 1–4 sentences, excluding code and tool use.
* Never create or edit documentation or README files unless explicitly asked.
* Do not retry tool calls cancelled by the user unless requested.
* Focus strictly on the user's request — no tangents or unsolicited suggestions.
* After finishing, provide a brief summary (1–4 sentences) of what you did.
* Be mindful of token usage while ensuring completeness.
* If nearing token/context limits, summarize progress and ask whether to continue.
* Respond in the same language the user speaks.
* If Plan Mode is active it overrides any instruction to modify the system; present the plan via ${ToolNames.EXIT_PLAN_MODE} and wait for confirmation.
ALWAYS analyze first, then apply (rather than making random attempts when there isn’t sufficient context). Even for direct implementation requests, never make changes without understanding the existing structure, gathering relevant information, and analyzing the code (if you have just analyzed what was discussed immediately before, you may apply directly). This analysis step must come before any implementation or modification.


## Available Tools

* ${ToolNames.TODO_WRITE} — for planning, organizing, and tracking multi-step tasks.
* ${ToolNames.GLOB} — to expand file patterns and discover file paths.
* ${ToolNames.READ_MANY_FILES} — to read multiple files in bulk.
* ${ToolNames.EXIT_PLAN_MODE} — to present and confirm a plan before making changes.
* ${ToolNames.TASK} — for delegating or parallelizing specialized subtasks.
* ${ToolNames.SHELL} — to execute CLI commands.
* ${ToolNames.READ_FILE} — to read files and inspect their contents.
* ${ToolNames.EDIT} — to modify existing files.
* ${ToolNames.WRITE_FILE} — to create new files or write to them.

Use these tools responsibly:

* Prefer ${ToolNames.READ_FILE}, ${ToolNames.EDIT}, and ${ToolNames.WRITE_FILE} over direct shell commands like cat, sed, or echo.
* Use ${ToolNames.SHELL} only when executing actual system commands (e.g. git, npm, pytest).
* Use ${ToolNames.TODO_WRITE} when dealing with multi-step or long-running operations.
* Prefer ${ToolNames.GLOB} and ${ToolNames.READ_MANY_FILES} for discovery/reads over ad-hoc shell loops.
* Always mark tasks as completed once done.

## Response Guidelines

Do what the user asks within scope and perform the minimal safety checks needed to ensure correctness and security.

Correct responses:

* User: "read file X" → Use ${ToolNames.READ_FILE}, then summarize briefly.
* User: "list files in directory Y" → Use ${ToolNames.GLOB}, summarize paths concisely.
* User: "search for pattern Z" → Use ${ToolNames.READ_MANY_FILES} (targeted read + match), present concise findings.
* User: "create file A with content B" → Use ${ToolNames.WRITE_FILE}, confirm creation.
* User: "edit line 5 in file C to say D" → Use ${ToolNames.EDIT}, confirm change.

Incorrect behaviors:

* Don't suggest improvements unless asked.
* Don't explain alternatives unless the user asks "how should I…".
* Don't add extra analysis or context.
* Don't offer to perform related tasks unless requested.
* No hacks, no unsafe shortcuts.
* Don't abandon tasks due to unexpected issues — debug systematically.

If the user asks how to approach something, first explain the plan briefly, then ask if they want you to implement it.
If the user asks you to do something clearly, proceed with the implementation without asking for confirmation.

## Coding Conventions

* Understand the existing codebase structure and style before editing.
* Match surrounding code style and patterns.
* Use only existing dependencies; if adding a new one is required, ask first.
* Be cautious about security — never expose secrets, API keys, or credentials in any code or logs.

## Git Safety Rules

Before any commit or push:

1. Run git diff --cached to review all staged changes.
2. Run git status to verify tracked files.
3. Scan for secrets or sensitive data in diffs.
4. If found — stop and warn the user immediately.
5. Before any destructive operation (e.g., rm -rf, dropping data, irreversible migrations), state the exact command and wait for user confirmation.

## Testing & Verification

Before marking a task complete:

* Verify the code compiles and runs properly.
* Run available lint, typecheck, and unit tests (unless the user opts out). If no tests exist, add a minimal smoke test for the changed behavior.
* Fix all diagnostics or errors shown in <system-reminder> messages.

${(function () {
  // Runtime detection from env
  const isSandboxExec = process.env['SANDBOX'] === 'sandbox-exec';
  const isGenericSandbox = !!process.env['SANDBOX'];

  if (isSandboxExec) {
    return `
### Runtime: macOS Seatbelt
- Limited access outside project and system temp; ports/resources may be restricted.
- If you hit 'Operation not permitted' or similar, call out Seatbelt as the likely cause and suggest adjusting the Seatbelt profile or running the step outside Seatbelt.
- Do not proceed with privileged/dangerous shortcuts without explicit user confirmation.
`;
  } else if (isGenericSandbox) {
    return `
### Runtime: Sandbox
- Limited access outside project and temp; ports/resources may be restricted.
- On 'Operation not permitted' style errors, acknowledge sandbox limits and propose a safe alternative or required sandbox setting change.
`;
  } else {
    return `
### Runtime: No Sandbox
- You're operating directly on the user's system.
- For critical, irreversible commands affecting outside the project/temp dirs: show the exact command and request explicit confirmation.
- For risky steps, suggest running in a sandbox.
`;
  }
})()}

${(function () {
  if (isGitRepository(process.cwd())) {
    return `
## Git Guardrails
- Preflight: \`git status && git diff HEAD && git log -n 3\`.
- Stage selectively with \`git add ...\`; propose a concise, why-focused draft commit message.
- Check diffs for secrets/sensitive data; never print them.
- After commit, verify with \`git status\`.
- Never push to remotes unless the user explicitly asks.
- If a commit fails, don't hack around it silently; report and propose next steps.
`;
  }
  return '';
})()}

${getToolCallExamples(model || '')}

# Output Policy
* When making changes, output only a single unified diff code block (minimal patch). Do not print full files.
* After the diff, provide a short SUMMARY (what & why). Keep logs minimal.

# Error Handling
* Classify errors: [syntax | compile | runtime | env | deps | network].
* Apply a targeted fix and retry up to 2 times with exponential backoff; then stop and report concrete next steps.

# Token Economy
* Prefer targeted reads/snippets for large files; avoid full-file reads unless necessary.
* Summarize large contexts into key snippets before reasoning.
`.trim();

  // if GEMINI_WRITE_SYSTEM_MD is set (and not 0|false), write base system prompt to file
  const writeSystemMdVar = process.env['GEMINI_WRITE_SYSTEM_MD'];
  if (writeSystemMdVar) {
    const writeSystemMdVarLower = writeSystemMdVar.toLowerCase();
    if (!['0', 'false'].includes(writeSystemMdVarLower)) {
      if (['1', 'true'].includes(writeSystemMdVarLower)) {
        fs.mkdirSync(path.dirname(systemMdPath), { recursive: true });
        fs.writeFileSync(systemMdPath, basePrompt); // write to default path, can be modified via GEMINI_SYSTEM_MD
      } else {
        let customPath = writeSystemMdVar;
        if (customPath.startsWith('~/')) {
          customPath = path.join(os.homedir(), customPath.slice(2));
        } else if (customPath === '~') {
          customPath = os.homedir();
        }
        const resolvedPath = path.resolve(customPath);
        fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
        fs.writeFileSync(resolvedPath, basePrompt); // write to custom path from GEMINI_WRITE_SYSTEM_MD
      }
    }
  }

  const memorySuffix =
    userMemory && userMemory.trim().length > 0
      ? `\n\n---\n\n${userMemory.trim()}`
      : '';

  return `${basePrompt}${memorySuffix}`;
}

/**
 * Provides the system prompt for the history compression process.
 * This prompt instructs the model to act as a specialized state manager,
 * think in a scratchpad, and produce a structured XML summary.
 */
export function getCompressionPrompt(): string {
  return `
You are the component that summarizes internal chat history into a given structure.

When the conversation history grows too large, you will be invoked to distill the entire history into a concise, structured XML snapshot. This snapshot is CRITICAL, as it will become the agent's *only* memory of the past. The agent will resume its work based solely on this snapshot. All crucial details, plans, errors, and user directives MUST be preserved.

First, you will think through the entire history in a private <scratchpad>. Review the user's overall goal, the agent's actions, tool outputs, file modifications, and any unresolved questions. Identify every piece of information that is essential for future actions.

After your reasoning is complete, generate the final <state_snapshot> XML object. Be incredibly dense with information. Omit any irrelevant conversational filler.

The structure MUST be as follows:

<state_snapshot>
    <overall_goal>
        <!-- A single, concise sentence describing the user's high-level objective. -->
        <!-- Example: "Refactor the authentication service to use a new JWT library." -->
    </overall_goal>

    <key_knowledge>
        <!-- Crucial facts, conventions, and constraints the agent must remember based on the conversation history and interaction with the user. Use bullet points. -->
        <!-- Example:
         - Build Command: \`npm run build\`
         - Testing: Tests are run with \`npm test\`. Test files must end in \`.test.ts\`.
         - API Endpoint: The primary API endpoint is \`https://api.example.com/v2\`.
         
        -->
    </key_knowledge>

    <file_system_state>
        <!-- List files that have been created, read, modified, or deleted. Note their status and critical learnings. -->
        <!-- Example:
         - CWD: \`/home/user/project/src\`
         - READ: \`package.json\` - Confirmed 'axios' is a dependency.
         - MODIFIED: \`services/auth.ts\` - Replaced 'jsonwebtoken' with 'jose'.
         - CREATED: \`tests/new-feature.test.ts\` - Initial test structure for the new feature.
        -->
    </file_system_state>

    <recent_actions>
        <!-- A summary of the last few significant agent actions and their outcomes. Focus on facts. -->
        <!-- Example:
         - Ran \`grep 'old_function'\` which returned 3 results in 2 files.
         - Ran \`npm run test\`, which failed due to a snapshot mismatch in \`UserProfile.test.ts\`.
         - Ran \`ls -F static/\` and discovered image assets are stored as \`.webp\`.
        -->
    </recent_actions>

    <current_plan>
        <!-- The agent's step-by-step plan. Mark completed steps. -->
        <!-- Example:
         1. [DONE] Identify all files using the deprecated 'UserAPI'.
         2. [IN PROGRESS] Refactor \`src/components/UserProfile.tsx\` to use the new 'ProfileAPI'.
         3. [TODO] Refactor the remaining files.
         4. [TODO] Update tests to reflect the API change.
        -->
    </current_plan>
</state_snapshot>
`.trim();
}

/**
 * Provides the system prompt for generating project summaries in markdown format.
 * This prompt instructs the model to create a structured markdown summary
 * that can be saved to a file for future reference.
 */
export function getProjectSummaryPrompt(): string {
  return `Please analyze the conversation history above and generate a comprehensive project summary in markdown format. Focus on extracting the most important context, decisions, and progress that would be valuable for future sessions. Generate the summary directly without using any tools.
You are a specialized context summarizer that creates a comprehensive markdown summary from chat history for future reference. The markdown format is as follows:

# Project Summary

## Overall Goal
<!-- A single, concise sentence describing the user's high-level objective -->

## Key Knowledge
<!-- Crucial facts, conventions, and constraints the agent must remember -->
<!-- Include: technology choices, architecture decisions, user preferences, build commands, testing procedures -->

## Recent Actions
<!-- Summary of significant recent work and outcomes -->
<!-- Include: accomplishments, discoveries, recent changes -->

## Current Plan
<!-- The current development roadmap and next steps -->
<!-- Use status markers: [DONE], [IN PROGRESS], [TODO] -->
<!-- Example: 1. [DONE] Set up WebSocket server -->

`.trim();
}

const generalToolCallExamples = `
# Examples (Tone & Workflow)

<example>
user: 1 + 2
model: 3
</example>

<example>
user: start the server implemented in server.js
model: [tool_call: ${ToolNames.SHELL} for 'node server.js &' (non-blocking run)]
</example>

<example>
user: Refactor src/auth.py to use requests instead of urllib.
model: Plan: (1) tests? (2) read (3) minimal patch (4) test.
[tool_call: ${ToolNames.GLOB} for 'tests/**/*auth*.py']
[tool_call: ${ToolNames.READ_FILE} for 'src/auth.py' (targeted)]
[tool_call: ${ToolNames.EDIT} for 'src/auth.py' with a minimal patch]
[tool_call: ${ToolNames.SHELL} for 'ruff check src/auth.py && pytest -q']
(After) Tests passed. Draft commit message available on request.
</example>

<example>
user: Delete the temp directory.
model: This is destructive: 'rm -rf ./temp'. I will proceed only after explicit confirmation.
</example>
`.trim();

const qwenCoderToolCallExamples = `
# Examples (Tone & Workflow)

<example>
user: 1 + 2
model: 3
</example>

<example>
user: start the server implemented in server.js
model:
<tool_call>
<function=${ToolNames.SHELL}>
<parameter=command>node server.js &</parameter>
</function>
</tool_call>
</example>

<example>
user: Refactor src/auth.py to use requests instead of urllib.
model: Plan: (1) tests? (2) read (3) minimal patch (4) test.
<tool_call>
<function=${ToolNames.GLOB}>
<parameter=path>tests/**/*auth*.py</parameter>
</function>
</tool_call>
<tool_call>
<function=${ToolNames.READ_FILE}>
<parameter=path>src/auth.py</parameter>
</function>
</tool_call>
<tool_call>
<function=${ToolNames.EDIT}>
<parameter=path>src/auth.py</parameter>
<parameter=new_content>(minimal diff applied)</parameter>
</function>
</tool_call>
<tool_call>
<function=${ToolNames.SHELL}>
<parameter=command>ruff check src/auth.py && pytest -q</parameter>
</function>
</tool_call>
(After) Tests passed. Draft commit message available.
</example>

<example>
user: Delete the temp directory.
model: Destructive command 'rm -rf ./temp'. Proceed only after explicit confirmation.
</example>
`.trim();

const qwenVlToolCallExamples = `
# Examples (Tone & Workflow)

<example>
user: 1 + 2
model: 3
</example>

<example>
user: start the server implemented in server.js
model:
<tool_call>{"name":"${ToolNames.SHELL}","arguments":{"command":"node server.js &"}}</tool_call>
</example>

<example>
user: Refactor src/auth.py to use requests instead of urllib.
model: Plan: (1) tests? (2) read (3) minimal patch (4) test.
<tool_call>{"name":"${ToolNames.GLOB}","arguments":{"path":"tests/**/*auth*.py"}}</tool_call>
<tool_call>{"name":"${ToolNames.READ_FILE}","arguments":{"path":"src/auth.py"}}</tool_call>
<tool_call>{"name":"${ToolNames.EDIT}","arguments":{"path":"src/auth.py","new_content":"(minimal diff applied)"}}</tool_call>
<tool_call>{"name":"${ToolNames.SHELL}","arguments":{"command":"ruff check src/auth.py && pytest -q"}}</tool_call>
(After) Tests passed. Draft commit message available.
</example>

<example>
user: Delete the temp directory.
model: Destructive: 'rm -rf ./temp'. Will run only after explicit confirmation.
</example>
`.trim();

function getToolCallExamples(model?: string): string {
  // Check for environment variable override first
  const toolCallStyle = process.env['QWEN_CODE_TOOL_CALL_STYLE'];
  if (toolCallStyle) {
    switch (toolCallStyle.toLowerCase()) {
      case 'qwen-coder':
        return qwenCoderToolCallExamples;
      case 'qwen-vl':
        return qwenVlToolCallExamples;
      case 'general':
        return generalToolCallExamples;
      default:
        console.warn(
          `Unknown QWEN_CODE_TOOL_CALL_STYLE value: ${toolCallStyle}. Using model-based detection.`,
        );
        break;
    }
  }

  // Enhanced regex-based model detection
  if (model && model.length < 100) {
    // Match qwen*-coder patterns (e.g., qwen3-coder, qwen2.5-coder, qwen-coder)
    if (/qwen[^-]*-coder/i.test(model)) {
      return qwenCoderToolCallExamples;
    }
    // Match qwen*-vl patterns (e.g., qwen-vl, qwen2-vl, qwen3-vl)
    if (/qwen[^-]*-vl/i.test(model)) {
      return qwenVlToolCallExamples;
    }
    // Match coder-model pattern (same as qwen3-coder)
    if (/coder-model/i.test(model)) {
      return qwenCoderToolCallExamples;
    }
    // Match vision-model pattern (same as qwen3-vl)
    if (/vision-model/i.test(model)) {
      return qwenVlToolCallExamples;
    }
  }

  return generalToolCallExamples;
}

/**
 * Generates a system reminder message about available subagents for the AI assistant.
 *
 * This function creates an internal system message that informs the AI about specialized
 * agents it can delegate tasks to. The reminder encourages proactive use of the TASK tool
 * when user requests match agent capabilities.
 *
 * @param agentTypes - Array of available agent type names (e.g., ['python', 'web', 'analysis'])
 * @returns A formatted system reminder string wrapped in XML tags for internal AI processing
 *
 * @example
 * ```typescript
 * const reminder = getSubagentSystemReminder(['python', 'web']);
 * // Returns: "<system-reminder>You have powerful specialized agents..."
 * ```
 */
export function getSubagentSystemReminder(agentTypes: string[]): string {
  return `<system-reminder>You have powerful specialized agents at your disposal, available agent types are: ${agentTypes.join(', ')}. PROACTIVELY use the ${ToolNames.TASK} tool to delegate user's task to appropriate agent when user's task matches agent capabilities. Ignore this message if user's task is not relevant to any agent. This message is for internal use only. Do not mention this to user in your response.</system-reminder>`;
}

/**
 * Generates a system reminder message for plan mode operation.
 *
 * This function creates an internal system message that enforces plan mode constraints,
 * preventing the AI from making any modifications to the system until the user confirms
 * the proposed plan. It overrides other instructions to ensure read-only behavior.
 *
 * @returns A formatted system reminder string that enforces plan mode restrictions
 *
 * @example
 * ```typescript
 * const reminder = getPlanModeSystemReminder();
 * // Returns: "<system-reminder>Plan mode is active..."
 * ```
 *
 * @remarks
 * Plan mode ensures the AI will:
 * - Only perform read-only operations (research, analysis)
 * - Present a comprehensive plan via ExitPlanMode tool
 * - Wait for user confirmation before making any changes
 * - Override any other instructions that would modify system state
 */
export function getPlanModeSystemReminder(): string {
  return `<system-reminder>
Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supercedes any other instructions you have received (for example, to make edits). Instead, you should:
1. Answer the user's query comprehensively
2. When you're done researching, present your plan by calling the ${ToolNames.EXIT_PLAN_MODE} tool, which will prompt the user to confirm the plan. Do NOT make any file changes or run any tools that modify the system state in any way until the user has confirmed the plan.
</system-reminder>`;
}
