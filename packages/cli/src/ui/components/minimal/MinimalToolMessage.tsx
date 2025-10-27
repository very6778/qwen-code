/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import type { ToolCallStatus } from '../../types.js';
import { Colors } from '../../colors.js';
import { CompactHeader } from './CompactHeader.js';
import { MinimalTodoItem } from './MinimalTodoItem.js';
import { MinimalDiffPreview } from './MinimalDiffPreview.js';
import type { Config, ShellResultDisplay } from '@qwen-code/qwen-code-core';
import { MinimalShellOutput } from './MinimalShellOutput.js';

export interface MinimalToolMessageProps {
  name: string;
  description?: string;
  resultDisplay?: unknown;
  status: ToolCallStatus;
  confirmationDetails?: any;
  availableTerminalHeight?: number;
  terminalWidth: number;
  emphasis?: 'high' | 'medium' | 'low';
  renderOutputAsMarkdown?: boolean;
  config: Config;
}

const isDiffDisplay = (
  resultDisplay: unknown,
): resultDisplay is { fileDiff: string } => {
  return (
    !!resultDisplay &&
    typeof resultDisplay === 'object' &&
    'fileDiff' in resultDisplay &&
    typeof (resultDisplay as { fileDiff?: unknown }).fileDiff === 'string'
  );
};

const isShellDisplay = (
  resultDisplay: unknown,
): resultDisplay is ShellResultDisplay => {
  return (
    !!resultDisplay &&
    typeof resultDisplay === 'object' &&
    'type' in resultDisplay &&
    (resultDisplay as { type?: string }).type === 'shell_output'
  );
};

export const MinimalToolMessage: React.FC<MinimalToolMessageProps> = ({
  name,
  description,
  resultDisplay,
  status,
  availableTerminalHeight: _availableTerminalHeight,
  terminalWidth: _terminalWidth,
  emphasis = 'medium',
  renderOutputAsMarkdown: _renderOutputAsMarkdown = true,
  config: _config,
}) => {
  const [showFullDiff] = React.useState(true); // Always show full diff

  const diffDisplay = React.useMemo(
    () =>
      isDiffDisplay(resultDisplay)
        ? (resultDisplay as { fileDiff: string })
        : null,
    [resultDisplay],
  );
  const hasDiffDisplay = diffDisplay !== null;

  const shellDisplay = React.useMemo(
    () => (isShellDisplay(resultDisplay) ? resultDisplay : null),
    [resultDisplay],
  );

  // Parse tool name to get operation and target
  const parseToolDetails = () => {
    // Extract target from description or resultDisplay
    let target = description;

    // For read-file, extract file path from result or description
    if (name === 'read-file' && typeof resultDisplay === 'string') {
      // Try to extract file path from result
      const pathMatch = resultDisplay.match(
        /\/.*?\.(ts|tsx|js|jsx|json|md|css|html|py|java|cpp|c|go|rs)/,
      );
      if (pathMatch) {
        target = pathMatch[0];
      }
    }

    if (typeof target === 'string') {
      const trimmedTarget = target.trim();
      const arrowIndex = trimmedTarget.indexOf(' => ');
      const colonIndex = trimmedTarget.indexOf(':');

      // If the description follows "path: snippet => snippet" format, keep only the path.
      if (
        arrowIndex !== -1 &&
        colonIndex !== -1 &&
        colonIndex < arrowIndex
      ) {
        target = trimmedTarget.slice(0, colonIndex).trim() || trimmedTarget;
      } else {
        target = trimmedTarget;
      }
    }

    return { toolName: name, target: target || description };
  };

  const { toolName, target } = parseToolDetails();

  const isTodoTool = React.useMemo(() => {
    return (
      (toolName === 'todoWrite' || toolName === 'TodoWrite') &&
      resultDisplay &&
      typeof resultDisplay === 'object' &&
      resultDisplay !== null &&
      'type' in resultDisplay &&
      (resultDisplay as { type?: string }).type === 'todo_list'
    );
  }, [toolName, resultDisplay]);

  const todoItems = React.useMemo(() => {
    if (!isTodoTool) return [];
    const todoResult = resultDisplay as { todos?: unknown[] } | undefined;
    return Array.isArray(todoResult?.todos) ? todoResult.todos ?? [] : [];
  }, [isTodoTool, resultDisplay]);

  const summaryText =
    typeof resultDisplay === 'string' ? resultDisplay.trim() : undefined;

  const formattedSummary = React.useMemo(() => {
    if (!summaryText) return null;

    const rangeMatch = summaryText.match(
      /^Read lines (\d+)-(\d+) of \d+ from .+$/,
    );
    if (rangeMatch) {
      const start = Number.parseInt(rangeMatch[1], 10);
      const end = Number.parseInt(rangeMatch[2], 10);
      const displayStart = start > 1 ? start - 1 : start;
      const displayEnd = end;
      return (
        <>
          Read lines{' '}
          <Text bold>
            {displayStart}-{displayEnd}
          </Text>
        </>
      );
    }

    const simpleRangeMatch = summaryText.match(
      /^Read lines (\d+)-(\d+)$/,
    );
    if (simpleRangeMatch) {
      const start = Number.parseInt(simpleRangeMatch[1], 10);
      const end = Number.parseInt(simpleRangeMatch[2], 10);
      const displayStart = start > 1 ? start - 1 : start;
      const displayEnd = end;
      return (
        <>
          Read lines{' '}
          <Text bold>
            {displayStart}-{displayEnd}
          </Text>
        </>
      );
    }

    const countMatch = summaryText.match(
      /^Read (\d+) lines? from .+$/,
    );
    if (countMatch) {
      return (
        <>
          Read <Text bold>{countMatch[1]}</Text>{' '}
          {Number(countMatch[1]) === 1 ? 'line' : 'lines'}
        </>
      );
    }

    const truncatedAllMatch = summaryText.match(
      /^Read all (\d+) lines from .+ \(some lines were shortened\)$/,
    );
    if (truncatedAllMatch) {
      return (
        <>
          Read all <Text bold>{truncatedAllMatch[1]}</Text> lines (some
          lines were shortened)
        </>
      );
    }

    const truncatedRangeMatch = summaryText.match(
      /^Read lines (\d+)-(\d+) of \d+ from .+ \(some lines were shortened\)$/,
    );
    if (truncatedRangeMatch) {
      const start = Number.parseInt(truncatedRangeMatch[1], 10);
      const end = Number.parseInt(truncatedRangeMatch[2], 10);
      const displayStart = start > 1 ? start - 1 : start;
      const displayEnd = end;
      return (
        <>
          Read lines{' '}
          <Text bold>
            {displayStart}-{displayEnd}
          </Text>{' '}
          (some lines were shortened)
        </>
      );
    }

    return <>{summaryText}</>;
  }, [summaryText]);

  // Always show full content - no hidden lines

  return (
    <Box flexDirection="column" width="100%" marginBottom={1}>
      {/* Compact Header */}
      <CompactHeader
        status={status}
        toolName={toolName}
        target={target}
        emphasis={emphasis}
      />

      {/* Todo Items or Regular Content */}
      {isTodoTool ? (
        <Box flexDirection="column">
          {todoItems.map((todo: any) => (
            <MinimalTodoItem key={todo.id} todo={todo} />
          ))}
        </Box>
      ) : hasDiffDisplay ? (
        diffDisplay && (
          <MinimalDiffPreview
            diffContent={diffDisplay.fileDiff}
            showFullDiff={showFullDiff}
          />
        )
      ) : shellDisplay ? (
        <MinimalShellOutput display={shellDisplay} />
      ) : (
        <Box marginLeft={2}>
          <Text color={Colors.Gray}>⎿ </Text>
          <Text wrap="wrap">
            {formattedSummary ? (
              formattedSummary
            ) : (
              // Show full content directly instead of summary
              <Text>
                {typeof resultDisplay === 'string'
                  ? resultDisplay
                  : JSON.stringify(resultDisplay, null, 2)}
              </Text>
            )}
          </Text>
        </Box>
      )}
    </Box>
  );
};
