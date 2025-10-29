/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import cliSpinners from 'cli-spinners';
import stringWidth from 'string-width';
import sliceAnsi from 'slice-ansi';
import chalk from 'chalk';
import { StreamingState } from '../types.js';
import { formatDuration } from '../utils/formatters.js';
import { Colors } from '../colors.js';

const WAITING_SYMBOL = '⠏';
const DEFAULT_WIDTH = 80;

const truncateWithEllipsis = (input: string, maxWidth: number): string => {
  if (maxWidth <= 0) {
    return '';
  }
  if (stringWidth(input) <= maxWidth) {
    return input;
  }
  const ellipsis = '...';
  const sliceWidth = Math.max(0, maxWidth - stringWidth(ellipsis));
  const sliced = sliceAnsi(input, 0, sliceWidth);
  return sliced + ellipsis;
};

const normalizeQueuedMessage = (message: string): string =>
  message.replace(/\s+/g, ' ').trim();

const colorize = (color: string | undefined, text: string): string => {
  if (!color) {
    return text;
  }
  try {
    if (color.startsWith('#')) {
      return chalk.hex(color)(text);
    }
  } catch (_error) {
    // Fall through to return plain text.
  }
  return text;
};

const useSpinnerFrame = (streamingState: StreamingState) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (streamingState !== StreamingState.Responding) {
      setFrameIndex(0);
      return;
    }

    const spinner = cliSpinners.dots;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % spinner.frames.length);
    }, spinner.interval);

    return () => {
      clearInterval(interval);
    };
  }, [streamingState]);

  if (streamingState === StreamingState.WaitingForConfirmation) {
    return WAITING_SYMBOL;
  }

  if (streamingState !== StreamingState.Responding) {
    return '';
  }
  const spinner = cliSpinners.dots;
  return spinner.frames[frameIndex] ?? '';
};

interface StatusBarProps {
  streamingState: StreamingState;
  primaryText?: string;
  elapsedTime: number;
  queuedMessages: string[];
  maxQueuedMessages: number;
  width?: number;
  rightContent?: string;
  linesBelow?: number;
  topPaddingLines?: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  streamingState,
  primaryText,
  elapsedTime,
  queuedMessages,
  maxQueuedMessages,
  width,
  rightContent,
  linesBelow = 0,
  topPaddingLines = 0,
}) => {
  const spinnerFrame = useSpinnerFrame(streamingState);

  const content = useMemo(() => {
    const effectiveWidth = Math.max(width ?? DEFAULT_WIDTH, 10);
    const lines: React.ReactElement[] = [];

    const spinnerSegment = spinnerFrame
      ? colorize(Colors.AccentGreen, spinnerFrame)
      : '';

    const timerSegment =
      streamingState !== StreamingState.WaitingForConfirmation &&
      streamingState !== StreamingState.Idle
        ? colorize(
            Colors.Gray,
            `(esc to cancel, ${
              elapsedTime < 60
                ? `${elapsedTime}s`
                : formatDuration(elapsedTime * 1000)
            })`,
          )
        : '';

    const primarySegment = primaryText
      ? colorize(
          Colors.AccentGreen,
          truncateWithEllipsis(primaryText, effectiveWidth),
        )
      : '';

    const rightSegment = rightContent
      ? colorize(Colors.Gray, truncateWithEllipsis(rightContent, effectiveWidth))
      : '';

    // Build main status line
    const topSegments = [
      spinnerSegment,
      primarySegment,
      timerSegment,
      rightSegment,
    ].filter((segment) => segment);

    // Add queued messages first so they appear above the indicator line
    const queueLimit = Math.max(0, maxQueuedMessages);
    if (queuedMessages.length > 0 && queueLimit > 0) {
      const visibleQueued = queuedMessages.slice(0, queueLimit);
      visibleQueued.forEach((message, index) => {
        const normalized = normalizeQueuedMessage(message);
        const prefixed = `  ${normalized}`;
        lines.push(
          <Text key={`queue-${index}`} color="gray">
            {chalk.dim(truncateWithEllipsis(prefixed, effectiveWidth))}
          </Text>
        );
      });

      if (queuedMessages.length > queueLimit) {
        const remaining = queuedMessages.length - queueLimit;
        lines.push(
          <Text key="more" color="gray">
            {chalk.dim(
              truncateWithEllipsis(
                `  ...(+${remaining} more)`,
                effectiveWidth,
              ),
            )}
          </Text>
        );
      }
    }

    if (topSegments.length > 0) {
      const joined = topSegments.join(' ').replace(/\s+/g, ' ').trim();
      lines.push(<Text key="main">{joined}</Text>);
    }

    return lines;
  }, [
    elapsedTime,
    maxQueuedMessages,
    primaryText,
    queuedMessages,
    rightContent,
    spinnerFrame,
    streamingState,
    width,
    topPaddingLines,
  ]);

  // Don't render if idle and no content
  if (
    streamingState === StreamingState.Idle &&
    queuedMessages.length === 0 &&
    !primaryText
  ) {
    return null;
  }

  return (
    <Box flexDirection="column">
      {topPaddingLines > 0 && Array.from({ length: topPaddingLines }).map((_, index) => (
        <Text key={`padding-${index}`}> </Text>
      ))}
      {content}
      {linesBelow > 0 && Array.from({ length: linesBelow }).map((_, index) => (
        <Text key={`below-${index}`}> </Text>
      ))}
    </Box>
  );
};
