/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { Box, Text } from 'ink';
import type { ShellResultDisplay } from '@qwen-code/qwen-code-core';
import { useKeypress } from '../../hooks/useKeypress.js';

const PREVIEW_LINE_COUNT = 20;
const MUTED_STDOUT_COLOR = '#8a8a8a';
const MUTED_STDERR_COLOR = '#b77272';
const HINT_COLOR = '#747474';

interface ShellResultRendererProps {
  data: ShellResultDisplay;
  isFocused?: boolean;
}

export const ShellResultRenderer: FC<ShellResultRendererProps> = ({
  data,
  isFocused = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  useKeypress(
    (key) => {
      if (key.ctrl && key.name === 'o') {
        setExpanded((prev) => !prev);
      }
    },
    { isActive: isFocused },
  );

  const stdoutLines = useMemo(
    () => normalizeShellLines(data.stdout),
    [data.stdout],
  );
  const stderrLines = useMemo(
    () => normalizeShellLines(data.stderr),
    [data.stderr],
  );

  const stdoutPreview = useMemo(
    () => stdoutLines.slice(-PREVIEW_LINE_COUNT),
    [stdoutLines],
  );
  const stderrPreview = useMemo(
    () => stderrLines.slice(-PREVIEW_LINE_COUNT),
    [stderrLines],
  );

  const showExpandHint =
    stdoutLines.length > PREVIEW_LINE_COUNT ||
    stderrLines.length > PREVIEW_LINE_COUNT;

  return (
    <Box flexDirection="column" gap={1}>
      {renderSection({
        title: 'stdout',
        lines: expanded ? stdoutLines : stdoutPreview,
        color: MUTED_STDOUT_COLOR,
        emptyLabel: '(no stdout)',
        dimmed: !expanded,
      })}
      {renderSection({
        title: 'stderr',
        lines: expanded ? stderrLines : stderrPreview,
        color: MUTED_STDERR_COLOR,
        emptyLabel: '(no stderr)',
        dimmed: !expanded,
      })}
      {showExpandHint && (
        <Text color={HINT_COLOR} dimColor>
          Press Ctrl+O to {expanded ? 'collapse log' : 'expand full log'}
        </Text>
      )}
    </Box>
  );
};

function normalizeShellLines(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n');
  const trimmed = normalized.trim();
  if (!trimmed) return [];

  const lines = trimmed.split('\n');
  const result: string[] = [];
  let previousBlank = false;
  for (const line of lines) {
    const isBlank = line.trim().length === 0;
    if (isBlank) {
      if (!previousBlank) {
        result.push('');
      }
    } else {
      result.push(line);
    }
    previousBlank = isBlank;
  }
  return result;
}

function renderSection({
  title,
  lines,
  color,
  emptyLabel,
  dimmed,
}: {
  title: string;
  lines: string[];
  color: string;
  emptyLabel: string;
  dimmed: boolean;
}) {
  if (lines.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color={color} dimColor>
          {title}: {emptyLabel}
        </Text>
      </Box>
    );
  }
  return (
    <Box flexDirection="column">
      <Text color={color} dimColor>
        {title}:
      </Text>
      {lines.map((line, idx) => (
        <Text key={`${title}-${idx}`} color={color} dimColor={dimmed} wrap="wrap">
          {line || ' '}
        </Text>
      ))}
    </Box>
  );
}
