/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useStdout } from 'ink';
import ansiEscapes from 'ansi-escapes';
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
}

export const StatusBar: React.FC<StatusBarProps> = ({
  streamingState,
  primaryText,
  elapsedTime,
  queuedMessages,
  maxQueuedMessages,
  width,
  rightContent,
}) => {
  const { stdout } = useStdout();
  const previousLineCountRef = useRef(0);
  const spinnerFrame = useSpinnerFrame(streamingState);

  const { content, lineCount } = useMemo(() => {
    const effectiveWidth = Math.max(width ?? DEFAULT_WIDTH, 10);
    const lines: string[] = [];

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

    const topSegments = [
      spinnerSegment,
      primarySegment,
      timerSegment,
      rightSegment,
    ].filter((segment) => segment);

    if (topSegments.length > 0) {
      const joined = topSegments.join(' ').replace(/\s+/g, ' ').trim();
      lines.push(truncateWithEllipsis(joined, effectiveWidth));
    }

    const queueLimit = Math.max(0, maxQueuedMessages);
    if (queuedMessages.length > 0 && queueLimit > 0) {
      const visibleQueued = queuedMessages.slice(0, queueLimit);
      const queueLines = visibleQueued.map((message) => {
        const normalized = normalizeQueuedMessage(message);
        const prefixed = `  ${normalized}`;
        return chalk.dim(truncateWithEllipsis(prefixed, effectiveWidth));
      });
      lines.push(...queueLines);

      if (queuedMessages.length > queueLimit) {
        const remaining = queuedMessages.length - queueLimit;
        lines.push(
          chalk.dim(
            truncateWithEllipsis(
              `  ...(+${remaining} more)`,
              effectiveWidth,
            ),
          ),
        );
      }
    }

    const filteredLines = lines.filter((line) => line.length > 0);
    return {
      content:
        filteredLines.length > 0
          ? filteredLines.join('\n')
          : streamingState === StreamingState.Idle
            ? ''
            : '',
      lineCount: filteredLines.length,
    };
  }, [
    elapsedTime,
    maxQueuedMessages,
    primaryText,
    queuedMessages,
    rightContent,
    spinnerFrame,
    streamingState,
    width,
  ]);

  useEffect(() => {
    if (!stdout || typeof stdout.write !== 'function') {
      return;
    }

    const previousLines = previousLineCountRef.current;

    stdout.write(ansiEscapes.cursorSavePosition);
    if (previousLines > 0) {
      stdout.write(ansiEscapes.cursorUp(previousLines));
      stdout.write(ansiEscapes.cursorTo(0));
      stdout.write(ansiEscapes.eraseDown);
    }

    if (content) {
      stdout.write(content);
    }

    previousLineCountRef.current = lineCount;
    stdout.write(ansiEscapes.cursorRestorePosition);

    return () => {
      if (!stdout || typeof stdout.write !== 'function') {
        return;
      }
      const linesToClear = previousLineCountRef.current;
      if (linesToClear > 0) {
        stdout.write(ansiEscapes.cursorSavePosition);
        stdout.write(ansiEscapes.cursorUp(linesToClear));
        stdout.write(ansiEscapes.cursorTo(0));
        stdout.write(ansiEscapes.eraseDown);
        stdout.write(ansiEscapes.cursorRestorePosition);
      }
      previousLineCountRef.current = 0;
    };
  }, [content, lineCount, stdout]);

  const placeholderLineCount =
    lineCount || (streamingState !== StreamingState.Idle ? 1 : 0);

  if (placeholderLineCount === 0) {
    return null;
  }

  return (
    <Box flexDirection="column">
      {Array.from({ length: placeholderLineCount }).map((_, index) => (
        <Text key={`status-placeholder-${index}`}>{' '}</Text>
      ))}
    </Box>
  );
};
