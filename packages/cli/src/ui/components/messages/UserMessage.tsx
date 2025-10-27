/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Text, Box } from 'ink';
import { Colors } from '../../colors.js';
import { SCREEN_READER_USER_PREFIX } from '../../textConstants.js';
import { isSlashCommand as checkIsSlashCommand } from '../../utils/commandUtils.js';

interface UserMessageProps {
  text: string;
  terminalWidth?: number;
}

export const UserMessage: React.FC<UserMessageProps> = ({ text, terminalWidth = 80 }) => {
  const prefix = '> ';
  const isSlashCommand = checkIsSlashCommand(text);

  const textColor = isSlashCommand ? Colors.AccentPurple : Colors.Gray;
  const frameLineColor = isSlashCommand ? Colors.AccentPurple : '#53626e';

  const horizontalLine = '─'.repeat(Math.max(0, terminalWidth));

  return (
    <Box flexDirection="column">
      <Text color={frameLineColor}>{horizontalLine}</Text>
      <Box
        flexDirection="row"
      >
        <Text color={textColor} aria-label={SCREEN_READER_USER_PREFIX}>
          {prefix}
        </Text>
        <Box flexGrow={1}>
          <Text wrap="wrap" color={textColor}>
            {text}
          </Text>
        </Box>
      </Box>
      <Text color={frameLineColor}>{horizontalLine}</Text>
    </Box>
  );
};
