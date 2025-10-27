/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { ParsedDiffLine } from '../../utils/diffParsing.js';
import { parseDiffWithLineNumbers } from '../../utils/diffParsing.js';
import { Colors } from '../../colors.js';

const PREVIEW_LINE_LIMIT = 80;
const REMOVED_BG_COLOR = '#5f2b3b';
const REMOVED_TEXT_COLOR = '#f7d6d6';
const ADDED_BG_COLOR = '#5f875f';
const ADDED_TEXT_COLOR = '#e6f5e6';
const CONTEXT_COLOR = '#bcbcbc';
const HUNK_COLOR = '#606060';
const PREVIEW_HINT_COLOR = '#747474';

export interface MinimalDiffPreviewProps {
  diffContent: string;
  showFullDiff: boolean;
}

export const MinimalDiffPreview: React.FC<MinimalDiffPreviewProps> = ({
  diffContent,
  showFullDiff,
}) => {
  const parsedLines = useMemo(
    () => parseDiffWithLineNumbers(diffContent),
    [diffContent],
  );

  const displayableLines = useMemo(
    () =>
      parsedLines.filter(
        (line) =>
          line.type === 'add' ||
          line.type === 'del' ||
          line.type === 'context' ||
          line.type === 'hunk',
      ),
    [parsedLines],
  );

  if (displayableLines.length === 0) {
    return (
      <Box marginLeft={2}>
        <Text color={Colors.Gray} dimColor>
          No changes detected.
        </Text>
      </Box>
    );
  }

  const shouldTruncate = !showFullDiff && displayableLines.length > PREVIEW_LINE_LIMIT;
  const linesToRender = useMemo(
    () =>
      shouldTruncate
        ? displayableLines.slice(0, PREVIEW_LINE_LIMIT)
        : displayableLines,
    [displayableLines, shouldTruncate],
  );

  const maxLineNumber = Math.max(
    0,
    ...linesToRender.map((line) => getDisplayLineNumber(line) ?? 0),
  );
  const gutterWidth = Math.max(2, maxLineNumber.toString().length);

  return (
    <Box flexDirection="column" marginLeft={2}>
      {linesToRender.map((line, index) => (
        <DiffRow
          key={`${line.type}-${line.oldLine ?? 'x'}-${line.newLine ?? 'y'}-${index}`}
          line={line}
          gutterWidth={gutterWidth}
        />
      ))}
      {shouldTruncate && (
        <Box marginTop={1}>
          <Text color={PREVIEW_HINT_COLOR} dimColor>
            Press Ctrl+O to expand diff ({displayableLines.length - linesToRender.length} more lines)
          </Text>
        </Box>
      )}
      {showFullDiff && displayableLines.length > PREVIEW_LINE_LIMIT && (
        <Box marginTop={1}>
          <Text color={PREVIEW_HINT_COLOR} dimColor>
            Press Ctrl+O to collapse diff preview
          </Text>
        </Box>
      )}
    </Box>
  );
};

interface DiffRowProps {
  line: ParsedDiffLine;
  gutterWidth: number;
}

const DiffRow: React.FC<DiffRowProps> = ({ line, gutterWidth }) => {
  if (line.type === 'hunk') {
    return (
      <Text color={HUNK_COLOR} dimColor>
        {line.content}
      </Text>
    );
  }

  const lineNumber = getDisplayLineNumber(line);
  const lineLabel =
    lineNumber !== undefined
      ? lineNumber.toString().padStart(gutterWidth)
      : ' '.repeat(gutterWidth);

  let backgroundColor: string | undefined;
  let prefixSymbol = ' ';
  let textColor = ADDED_TEXT_COLOR;

  if (line.type === 'add') {
    backgroundColor = ADDED_BG_COLOR;
    prefixSymbol = '+';
    textColor = ADDED_TEXT_COLOR;
  } else if (line.type === 'del') {
    backgroundColor = REMOVED_BG_COLOR;
    prefixSymbol = '-';
    textColor = REMOVED_TEXT_COLOR;
  } else {
    textColor = CONTEXT_COLOR;
  }

  return (
    <Box flexDirection="row">
      <Text color={Colors.Gray}>
        {lineLabel}{' '}
      </Text>
      <Text backgroundColor={backgroundColor} color={textColor}>
        {prefixSymbol} {line.content}
      </Text>
    </Box>
  );
};

function getDisplayLineNumber(line: ParsedDiffLine): number | undefined {
  if (line.type === 'del') {
    return line.oldLine;
  }
  if (line.type === 'add' || line.type === 'context') {
    return line.newLine ?? line.oldLine;
  }
  return undefined;
}
