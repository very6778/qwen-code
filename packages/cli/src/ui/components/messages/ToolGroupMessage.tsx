/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useMemo } from 'react';
import { Box, Text } from 'ink';
import type {
  IndividualToolCallDisplay,
  ToolGroupDisplayMode,
} from '../../types.js';
import { ToolCallStatus } from '../../types.js';
import { ToolMessage } from './ToolMessage.js';
import { ToolConfirmationMessage } from './ToolConfirmationMessage.js';
import { Colors } from '../../colors.js';
import type { Config } from '@qwen-code/qwen-code-core';
import { SHELL_COMMAND_NAME } from '../../constants.js';
import {
  getFriendlyToolName,
  getBatchedToolTarget,
} from '../../utils/toolDisplayNames.js';

interface ToolGroupMessageProps {
  groupId: number;
  toolCalls: IndividualToolCallDisplay[];
  availableTerminalHeight?: number;
  terminalWidth: number;
  config: Config;
  isFocused?: boolean;
  displayMode?: ToolGroupDisplayMode;
}

// Main component renders the border and maps the tools using ToolMessage
export const ToolGroupMessage: React.FC<ToolGroupMessageProps> = ({
  toolCalls,
  availableTerminalHeight,
  terminalWidth,
  config,
  isFocused = true,
  displayMode,
}) => {
  if (displayMode === 'batched') {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        width="100%"
        marginLeft={1}
        borderColor={Colors.Gray}
        gap={1}
        paddingX={1}
        paddingY={1}
      >
        <BatchedToolGroupContent toolCalls={toolCalls} />
      </Box>
    );
  }

  const hasPending = !toolCalls.every(
    (t) => t.status === ToolCallStatus.Success,
  );
  const isShellCommand = toolCalls.some((t) => t.name === SHELL_COMMAND_NAME);
  const borderColor =
    hasPending || isShellCommand ? Colors.AccentYellow : Colors.Gray;

  const staticHeight = /* border */ 2 + /* marginBottom */ 1;
  // This is a bit of a magic number, but it accounts for the border and
  // marginLeft.
  const innerWidth = terminalWidth - 4;

  // only prompt for tool approval on the first 'confirming' tool in the list
  // note, after the CTA, this automatically moves over to the next 'confirming' tool
  const toolAwaitingApproval = useMemo(
    () => toolCalls.find((tc) => tc.status === ToolCallStatus.Confirming),
    [toolCalls],
  );

  let countToolCallsWithResults = 0;
  for (const tool of toolCalls) {
    if (tool.resultDisplay !== undefined && tool.resultDisplay !== '') {
      countToolCallsWithResults++;
    }
  }
  const countOneLineToolCalls = toolCalls.length - countToolCallsWithResults;
  const availableTerminalHeightPerToolMessage = availableTerminalHeight
    ? Math.max(
        Math.floor(
          (availableTerminalHeight - staticHeight - countOneLineToolCalls) /
            Math.max(1, countToolCallsWithResults),
        ),
        1,
      )
    : undefined;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      /*
        This width constraint is highly important and protects us from an Ink rendering bug.
        Since the ToolGroup can typically change rendering states frequently, it can cause
        Ink to render the border of the box incorrectly and span multiple lines and even
        cause tearing.
      */
      width="100%"
      marginLeft={1}
      borderDimColor={hasPending}
      borderColor={borderColor}
      gap={1}
    >
      {toolCalls.map((tool) => {
        const isConfirming = toolAwaitingApproval?.callId === tool.callId;
        return (
          <Box key={tool.callId} flexDirection="column" minHeight={1}>
            <Box flexDirection="row" alignItems="center">
              <ToolMessage
                callId={tool.callId}
                name={tool.name}
                description={tool.description}
                resultDisplay={tool.resultDisplay}
                status={tool.status}
                confirmationDetails={tool.confirmationDetails}
                availableTerminalHeight={availableTerminalHeightPerToolMessage}
                terminalWidth={innerWidth}
                emphasis={
                  isConfirming
                    ? 'high'
                    : toolAwaitingApproval
                      ? 'low'
                      : 'medium'
                }
                renderOutputAsMarkdown={tool.renderOutputAsMarkdown}
                config={config}
                isFocused={isFocused}
              />
            </Box>
            {tool.status === ToolCallStatus.Confirming &&
              isConfirming &&
              tool.confirmationDetails && (
                <ToolConfirmationMessage
                  confirmationDetails={tool.confirmationDetails}
                  config={config}
                  isFocused={isFocused}
                  availableTerminalHeight={
                    availableTerminalHeightPerToolMessage
                  }
                  terminalWidth={innerWidth}
                />
              )}
          </Box>
        );
      })}
    </Box>
  );
};

const BatchedToolGroupContent: React.FC<{
  toolCalls: IndividualToolCallDisplay[];
}> = ({ toolCalls }) => {
  if (toolCalls.length === 0) {
    return null;
  }

  const friendlyName = getFriendlyToolName(toolCalls[0]?.name);
  const targets = toolCalls.map((tool) =>
    getBatchedToolTarget(tool.description),
  );

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row" alignItems="center">
        <Text color={Colors.AccentGreen}>⏺</Text>
        <Text> </Text>
        <Text bold>{friendlyName}</Text>
      </Box>
      <Box flexDirection="row" paddingLeft={1}>
        <Text color={Colors.Gray}>⎿ </Text>
        <Text wrap="wrap">{targets.join(', ')}</Text>
      </Box>
    </Box>
  );
};
