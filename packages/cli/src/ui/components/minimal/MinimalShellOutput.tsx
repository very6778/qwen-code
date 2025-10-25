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

const PREVIEW_LINE_COUNT = 12;
const MUTED_STDOUT_COLOR = '#8a8a8a';
const MUTED_STDERR_COLOR = '#b77272';
const HINT_COLOR = '#747474';

interface MinimalShellOutputProps {
  display: ShellResultDisplay;
  isFocused?: boolean;
}

export const MinimalShellOutput: FC<MinimalShellOutputProps> = ({
  display,
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
    () => splitIntoLines(display.stdout),
    [display.stdout],
  );
  const stderrLines = useMemo(
    () => splitIntoLines(display.stderr),
    [display.stderr],
  );

  const stdoutPreview = useMemo(
    () => stdoutLines.slice(-PREVIEW_LINE_COUNT),
    [stdoutLines],
  );
  const stderrPreview = useMemo(
    () => stderrLines.slice(-PREVIEW_LINE_COUNT),
    [stderrLines],
  );

  const showHint =
    stdoutLines.length > PREVIEW_LINE_COUNT ||
    stderrLines.length > PREVIEW_LINE_COUNT;

  return (
    <Box flexDirection="column" marginLeft={2} gap={1}>
      {renderSection({
        label: 'stdout',
        lines: expanded ? stdoutLines : stdoutPreview,
        color: MUTED_STDOUT_COLOR,
        dimmed: !expanded,
      })}
      {renderSection({
        label: 'stderr',
        lines: expanded ? stderrLines : stderrPreview,
        color: MUTED_STDERR_COLOR,
        dimmed: !expanded,
      })}
      {showHint && (
        <Text color={HINT_COLOR} dimColor>
          (ctrl+o to {expanded ? 'collapse' : 'expand'})
        </Text>
      )}
    </Box>
  );
};

function splitIntoLines(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n');
  const trimmed = normalized.replace(/\n+$/u, '');
  if (!trimmed) {
    return [];
  }
  return trimmed.split('\n');
}

function renderSection({
  label,
  lines,
  color,
  dimmed,
}: {
  label: string;
  lines: string[];
  color: string;
  dimmed: boolean;
}) {
  if (lines.length === 0) {
    return (
      <Text color={color} dimColor>
        {label}: (empty)
      </Text>
    );
  }
  return (
    <Box flexDirection="column">
      <Text color={color} dimColor>
        {label}:
      </Text>
      {lines.map((line, index) => (
        <Text key={`${label}-${index}`} color={color} dimColor={dimmed} wrap="wrap">
          {line || ' '}
        </Text>
      ))}
    </Box>
  );
}
