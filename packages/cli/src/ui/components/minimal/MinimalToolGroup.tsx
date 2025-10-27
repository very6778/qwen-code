/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useMemo } from 'react';
import { Box } from 'ink';
import type {
  IndividualToolCallDisplay,
} from '../../types.js';
import { ToolCallStatus } from '../../types.js';
import { MinimalToolMessage } from './MinimalToolMessage.js';
import { ToolConfirmationMessage } from '../messages/ToolConfirmationMessage.js';
import type { Config } from '@qwen-code/qwen-code-core';

interface MinimalToolGroupProps {
  toolCalls: IndividualToolCallDisplay[];
  groupId: number;
  availableTerminalHeight?: number;
  terminalWidth: number;
  config: Config;
  isFocused?: boolean;
}

export const MinimalToolGroup: React.FC<MinimalToolGroupProps> = ({
  toolCalls,
  availableTerminalHeight,
  terminalWidth,
  config,
  isFocused = true,
  }) => {

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
  const availableTerminalHeightPerToolMessage = availableTerminalHeight
    ? Math.max(
        Math.floor(
          (availableTerminalHeight - 1) /
            Math.max(1, countToolCallsWithResults),
        ),
        1,
      )
    : undefined;

  // Single line spacing between tool calls
  return (
    <Box flexDirection="column" marginBottom={0}>
      {/* Tool messages with single line spacing */}
      {toolCalls.map((tool, index) => {
        const isConfirming = toolAwaitingApproval?.callId === tool.callId;
        return (
          <Box
            key={tool.callId}
            flexDirection="column"
            marginBottom={index === toolCalls.length - 1 ? 0 : 1}
          >
            <MinimalToolMessage
              name={tool.name}
              description={tool.description}
              resultDisplay={tool.resultDisplay}
              status={tool.status}
              confirmationDetails={tool.confirmationDetails}
              availableTerminalHeight={availableTerminalHeightPerToolMessage}
              terminalWidth={terminalWidth}
              emphasis={
                isConfirming ? 'high' : toolAwaitingApproval ? 'low' : 'medium'
              }
              renderOutputAsMarkdown={tool.renderOutputAsMarkdown}
              config={config}
            />
            {tool.status === ToolCallStatus.Confirming &&
              isConfirming &&
              tool.confirmationDetails && (
                <ToolConfirmationMessage
                  confirmationDetails={tool.confirmationDetails}
                  config={config}
                  isFocused={isFocused}
                  availableTerminalHeight={availableTerminalHeightPerToolMessage}
                  terminalWidth={terminalWidth}
                />
              )}
          </Box>
        );
      })}
    </Box>
  );
};

