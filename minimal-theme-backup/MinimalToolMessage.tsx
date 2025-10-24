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
import type { Config } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../../hooks/useKeypress.js';
import type { Key } from '../../hooks/useKeypress.js';

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

export const MinimalToolMessage: React.FC<MinimalToolMessageProps> = ({
  name,
  description,
  resultDisplay,
  status,
  availableTerminalHeight,
  terminalWidth,
  emphasis = 'medium',
  renderOutputAsMarkdown = true,
  config,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Handle expand shortcut
  useKeypress(
    (key: Key) => {
      if (key.ctrl && key.name === 'o') {
        setIsExpanded(!isExpanded);
      }
    },
    { isActive: true },
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

  // Calculate content metrics
  const getContentMetrics = () => {
    if (!resultDisplay) {
      return { totalLines: 0, hiddenLines: 0 };
    }

    const content =
      typeof resultDisplay === 'string'
        ? resultDisplay
        : JSON.stringify(resultDisplay, null, 2);
    const totalLines = content.split('\n').length;
    const hiddenLines = isExpanded ? 0 : Math.max(0, totalLines - 3);

    return { totalLines, hiddenLines };
  };

  const { totalLines, hiddenLines } = getContentMetrics();


  // Get action verb for display
  const getActionVerb = () => {
    switch (toolName) {
      case 'read-file':
        return 'Read';
      case 'write-file':
        return 'Write';
      case 'edit':
        return 'Edit';
      case 'search':
      case 'grep':
        return 'Found';
      case 'shell':
        return 'Shell';
      default:
        return 'Processed';
    }
  };

  return (
    <Box flexDirection="column" width="100%">
      {/* Compact Header */}
      <CompactHeader
        status={status}
        toolName={toolName}
        target={target}
        emphasis={emphasis}
      />

      {/* Child Content with Indentation */}
      <Box marginLeft={2}>
        <Text color={Colors.Gray}>⎿ </Text>
        <Text>{getActionVerb()}</Text>
        <Text> </Text>
        <Text bold>{totalLines}</Text>
        <Text> lines</Text>

        {/* Muted Footer */}
        {hiddenLines > 0 && (
          <Text color={Colors.Gray} dimColor>
            (ctrl+o to expand)
          </Text>
        )}
      </Box>
    </Box>
  );
};