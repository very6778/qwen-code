/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Text, Box } from 'ink';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { Colors } from '../../colors.js';
import { SCREEN_READER_MODEL_PREFIX } from '../../textConstants.js';

interface GeminiMessageProps {
  text: string;
  isPending: boolean;
  availableTerminalHeight?: number;
  terminalWidth: number;
}

export const GeminiMessage: React.FC<GeminiMessageProps> = ({
  text,
  isPending,
  availableTerminalHeight,
  terminalWidth,
}) => {
  const prefix = '  '; // Two spaces to maintain layout without icon
  const prefixWidth = prefix.length;
  const sanitizedText = normalizeLeadingEmptyLines(text);

  return (
    <Box flexDirection="row">
      <Box width={prefixWidth}>
        <Text
          color={Colors.Gray}
          aria-label={SCREEN_READER_MODEL_PREFIX}
        >
          {prefix}
        </Text>
      </Box>
      <Box flexGrow={1} flexDirection="column" paddingLeft={1} paddingRight={4}>
        <MarkdownDisplay
          text={sanitizedText}
          isPending={isPending}
          availableTerminalHeight={availableTerminalHeight}
          terminalWidth={terminalWidth}
        />
      </Box>
    </Box>
  );
};

const ZERO_WIDTH_CHAR_REGEX = /[\u200B\u200C\u200D\uFEFF]/g;

function normalizeLeadingEmptyLines(value: string): string {
  if (!value) {
    return value;
  }

  const lines = value.split(/\r?\n/);
  let startIndex = 0;

  while (startIndex < lines.length) {
    const logicalLine =
      lines[startIndex].length > 0
        ? lines[startIndex].replace(ZERO_WIDTH_CHAR_REGEX, '')
        : lines[startIndex];

    if (logicalLine.trim().length > 0) {
      break;
    }
    startIndex++;
  }

  if (startIndex === 0) {
    return value;
  }

  return lines.slice(startIndex).join('\n');
}
