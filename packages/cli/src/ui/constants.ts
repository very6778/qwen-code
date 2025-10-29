/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const EstimatedArtWidth = 59;
const BoxBorderWidth = 1;
export const BOX_PADDING_X = 1;

// Calculate width based on art, padding, and border
export const UI_WIDTH =
  EstimatedArtWidth + BOX_PADDING_X * 2 + BoxBorderWidth * 2; // ~63

export const STREAM_DEBOUNCE_MS = 100;

export const SHELL_COMMAND_NAME = 'Shell Command';

// Tool status symbols used in ToolMessage component
export const TOOL_STATUS = {
  SUCCESS: '⏺',
  PENDING: '⏺',
  EXECUTING: '⏺',
  CONFIRMING: '⏺',
  CANCELED: '⏺',
  ERROR: '⏺',
} as const;

// Visual status icons for professional CLI appearance
export const VISUAL_STATUS_ICONS = {
  SUCCESS: '⏺',  // Medium white circle - successful operation (will be colored green)
  INFO: '⏺',     // Medium white circle - informational content
  ERROR: '⏺',    // Medium white circle - error/failed operation (will be colored red)
  PENDING: '⏺',  // Medium white circle - operation in progress (will be colored yellow)
} as const;
