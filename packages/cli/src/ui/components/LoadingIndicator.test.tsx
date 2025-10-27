/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { LoadingIndicator } from './LoadingIndicator.js';
import { StreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';

interface CapturedStatusBarCall {
  streamingState: StreamingState;
  primaryText?: string;
  elapsedTime: number;
  queuedMessages: string[];
  maxQueuedMessages: number;
  width?: number;
}

const capturedCalls: CapturedStatusBarCall[] = [];

vi.mock('./StatusBar.js', () => ({
  StatusBar: (props: CapturedStatusBarCall) => {
    capturedCalls.push(props);
    return null;
  },
}));

const renderWithContext = (
  element: React.ReactElement,
  streamingStateValue: StreamingState,
) =>
  render(
    <StreamingContext.Provider value={streamingStateValue}>
      {element}
    </StreamingContext.Provider>,
  );

describe('<LoadingIndicator />', () => {
  const defaultProps = {
    currentLoadingPhrase: 'Loading...',
    elapsedTime: 5,
    width: 120,
  };

  beforeEach(() => {
    capturedCalls.length = 0;
  });

  afterEach(() => {
    capturedCalls.length = 0;
  });

  it('does not render StatusBar when idle and queue is empty', () => {
    renderWithContext(
      <LoadingIndicator {...defaultProps} />,
      StreamingState.Idle,
    );
    expect(capturedCalls).toHaveLength(0);
  });

  it('passes loading phrase and timer when responding', () => {
    renderWithContext(
      <LoadingIndicator {...defaultProps} />,
      StreamingState.Responding,
    );
    expect(capturedCalls).toHaveLength(1);
    const call = capturedCalls[0];
    expect(call.primaryText).toBe('Loading...');
    expect(call.elapsedTime).toBe(5);
    expect(call.streamingState).toBe(StreamingState.Responding);
  });

  it('prefers thought subject over fallback text', () => {
    renderWithContext(
      <LoadingIndicator
        currentLoadingPhrase="Fallback"
        thought={{ subject: 'Thinking...', description: 'Hidden detail' }}
        elapsedTime={3}
        width={100}
      />,
      StreamingState.Responding,
    );
    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0].primaryText).toBe('Thinking...');
  });

  it('forwards waiting state without cancel timer', () => {
    renderWithContext(
      <LoadingIndicator
        currentLoadingPhrase="Confirm action"
        elapsedTime={10}
        width={90}
      />,
      StreamingState.WaitingForConfirmation,
    );
    expect(capturedCalls).toHaveLength(1);
    const call = capturedCalls[0];
    expect(call.streamingState).toBe(StreamingState.WaitingForConfirmation);
    expect(call.primaryText).toBe('Confirm action');
  });

  it('passes queued messages and respects limit', () => {
    const queuedMessages = [
      'First queued request',
      'Second queued request',
      'Third queued request',
    ];

    renderWithContext(
      <LoadingIndicator
        {...defaultProps}
        queuedMessages={queuedMessages}
        maxQueuedMessages={2}
      />,
      StreamingState.Responding,
    );

    expect(capturedCalls).toHaveLength(1);
    const call = capturedCalls[0];
    expect(call.queuedMessages).toEqual(queuedMessages);
    expect(call.maxQueuedMessages).toBe(2);
  });

  it('renders status bar even when idle if queue has items', () => {
    renderWithContext(
      <LoadingIndicator
        {...defaultProps}
        queuedMessages={['Pending input']}
        maxQueuedMessages={3}
      />,
      StreamingState.Idle,
    );
    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0].streamingState).toBe(StreamingState.Idle);
  });
});
