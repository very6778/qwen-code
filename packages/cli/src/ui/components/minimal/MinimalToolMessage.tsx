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
import { useKeypress } from '../../hooks/useKeypress.js';
import type { Key } from '../../hooks/useKeypress.js';
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
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showFullDiff, setShowFullDiff] = React.useState(false);

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

  const hasShellDisplay = shellDisplay !== null;

  const { totalLines, hiddenLines } = React.useMemo(() => {
    if (hasShellDisplay) {
      return { totalLines: 0, hiddenLines: 0 };
    }

    if (isTodoTool) {
      return {
        totalLines: todoItems.length > 0 ? 1 : 0,
        hiddenLines: 0,
      };
    }

    if (!resultDisplay || hasDiffDisplay) {
      return { totalLines: 0, hiddenLines: 0 };
    }

    const content =
      typeof resultDisplay === 'string'
        ? resultDisplay
        : JSON.stringify(resultDisplay, null, 2);
    const totalLines = content.split('\n').length;
    const hiddenLines = isExpanded ? 0 : Math.max(0, totalLines - 3);
    return { totalLines, hiddenLines };
  }, [
    isTodoTool,
    todoItems.length,
    resultDisplay,
    hasDiffDisplay,
    hasShellDisplay,
    isExpanded,
  ]);

  useKeypress(
    (key: Key) => {
      if (key.ctrl && key.name === 'o') {
        if (hasDiffDisplay) {
          setShowFullDiff((prev) => !prev);
        } else if (!hasShellDisplay) {
          setIsExpanded((prev) => !prev);
        }
      }
    },
    {
      isActive: hasDiffDisplay || (!hasShellDisplay && hiddenLines > 0),
    },
  );

  return (
    <Box flexDirection="column" width="100%">
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
              <>
                Processed <Text bold>{totalLines}</Text>{' '}
                {totalLines === 1 ? 'line' : 'lines'}
                {hiddenLines > 0 && (
                  <Text color="#747474" dimColor>
                    {' '}
                    (ctrl+o to expand)
                  </Text>
                )}
              </>
            )}
          </Text>
        </Box>
      )}
    </Box>
  );
};
