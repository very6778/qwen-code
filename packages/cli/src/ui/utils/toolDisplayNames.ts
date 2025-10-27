/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */


const TOOL_NAME_ALIASES: Record<string, string> = {
  ReadFile: 'Read',
  readFile: 'Read',
  ReadManyFiles: 'Read',
  readManyFiles: 'Read',
  ReadFolder: 'List',
  readFolder: 'List',
};

export function getFriendlyToolName(rawName?: string): string {
  if (!rawName) {
    return 'Tool';
  }
  return TOOL_NAME_ALIASES[rawName] ?? rawName;
}

/**
 * Returns the description as-is for tool displays.
 * This provides the full path information in the format: ⏺ Read(path/to/file)
 */
export function getBatchedToolTarget(description?: string): string {
  if (!description) {
    return 'item';
  }

  const trimmed = description.trim().replace(/^['"]|['"]$/g, '');
  return trimmed || 'item';
}
