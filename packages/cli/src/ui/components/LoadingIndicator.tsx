/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  currentLoadingPhrase,
  elapsedTime,
  thought,
  queuedMessages = [],
  maxQueuedMessages = 3,
  width,
  rightContent,
}) => {
  const streamingState = useStreamingContext();
  const { columns } = useTerminalSize();

  if (
    streamingState === StreamingState.Idle &&
    queuedMessages.length === 0
  ) {
    return null;
  }

  const primaryText = thought?.subject || currentLoadingPhrase;
  const effectiveWidth = width ?? columns ?? 80;

  return (
    <StatusBar
      streamingState={streamingState}
      primaryText={primaryText}
      elapsedTime={elapsedTime}
      queuedMessages={queuedMessages}
      maxQueuedMessages={maxQueuedMessages}
      width={effectiveWidth}
      rightContent={rightContent}
    />
  );
};
