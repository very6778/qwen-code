/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import type { ThoughtSummary } from '@qwen-code/qwen-code-core';
import { useStreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { StatusBar } from './StatusBar.js';

interface LoadingIndicatorProps {
  currentLoadingPhrase?: string;
  elapsedTime: number;
  thought?: ThoughtSummary | null;
  queuedMessages?: string[];
  maxQueuedMessages?: number;
  width?: number;
  rightContent?: string;
  linesBelow?: number;
  topPaddingLines?: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  currentLoadingPhrase,
  elapsedTime,
  thought,
  queuedMessages = [],
  maxQueuedMessages = 3,
  width,
  rightContent,
  linesBelow = 0,
  topPaddingLines = 0,
}) => {
  const streamingState = useStreamingContext();
  const { columns } = useTerminalSize();

  const primaryText = thought?.subject || currentLoadingPhrase;
  const effectiveWidth = width ?? columns ?? 80;

  // Ensure stable props to prevent unnecessary re-renders during streaming
  const stableProps = useMemo(() => ({
    streamingState,
    primaryText,
    elapsedTime,
    queuedMessages,
    maxQueuedMessages,
    width: effectiveWidth,
    rightContent,
    linesBelow,
    topPaddingLines,
  }), [
    streamingState,
    primaryText,
    elapsedTime,
    queuedMessages,
    maxQueuedMessages,
    effectiveWidth,
    rightContent,
    linesBelow,
    topPaddingLines,
  ]);

  if (
    streamingState === StreamingState.Idle &&
    queuedMessages.length === 0
  ) {
    return null;
  }

  return (
    <StatusBar {...stableProps} />
  );
};
