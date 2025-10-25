/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type ParsedDiffLineType = 'add' | 'del' | 'context' | 'hunk' | 'other';

export interface ParsedDiffLine {
  type: ParsedDiffLineType;
  oldLine?: number;
  newLine?: number;
  content: string;
}

const HUNK_HEADER_REGEX = /^@@ -(\d+),?\d* \+(\d+),?\d* @@/;

/**
 * Parses a unified diff string into structured lines with line numbers.
 * Exported so both the standard and minimal diff renderers can share logic.
 */
export function parseDiffWithLineNumbers(diffContent: string): ParsedDiffLine[] {
  const lines = diffContent.split('\n');
  const result: ParsedDiffLine[] = [];
  let currentOldLine = 0;
  let currentNewLine = 0;
  let inHunk = false;

  for (const line of lines) {
    const hunkMatch = line.match(HUNK_HEADER_REGEX);
    if (hunkMatch) {
      currentOldLine = parseInt(hunkMatch[1], 10);
      currentNewLine = parseInt(hunkMatch[2], 10);
      inHunk = true;
      result.push({ type: 'hunk', content: line });
      // Adjust counters so the first actual line in the hunk gets the proper number.
      currentOldLine--;
      currentNewLine--;
      continue;
    }

    if (!inHunk) {
      // Skip headers / metadata outside of hunks.
      if (
        line.startsWith('--- ') ||
        line.startsWith('+++ ') ||
        line.startsWith('diff --git') ||
        line.startsWith('index ') ||
        line.startsWith('similarity index') ||
        line.startsWith('rename from') ||
        line.startsWith('rename to') ||
        line.startsWith('new file mode') ||
        line.startsWith('deleted file mode')
      ) {
        continue;
      }
      if (line.trim() === '') {
        continue;
      }

      result.push({ type: 'other', content: line });
      continue;
    }

    if (line.startsWith('+')) {
      currentNewLine++;
      result.push({
        type: 'add',
        newLine: currentNewLine,
        content: line.substring(1),
      });
      continue;
    }

    if (line.startsWith('-')) {
      currentOldLine++;
      result.push({
        type: 'del',
        oldLine: currentOldLine,
        content: line.substring(1),
      });
      continue;
    }

    if (line.startsWith(' ')) {
      currentOldLine++;
      currentNewLine++;
      result.push({
        type: 'context',
        oldLine: currentOldLine,
        newLine: currentNewLine,
        content: line.substring(1),
      });
      continue;
    }

    if (line.startsWith('\\')) {
      result.push({ type: 'other', content: line });
    }
  }

  return result;
}
