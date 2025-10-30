/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Text } from 'ink';
import { Colors } from '../colors.js';
import { tokenLimit } from '@qwen-code/qwen-code-core';

export const ContextUsageDisplay = ({
  promptTokenCount,
  model,
}: {
  promptTokenCount: number;
  model: string;
}) => {
  const limit = tokenLimit(model);
  const used = Math.max(promptTokenCount, 0);
  const remaining = Math.max(limit - used, 0);
  const percentLeft = limit > 0 ? (remaining / limit) * 100 : 0;

  return (
    <Text color={Colors.Gray}>
      ({percentLeft.toFixed(percentLeft >= 99 ? 1 : 0)}% left · {used.toLocaleString()}/{limit.toLocaleString()} tokens)
    </Text>
  );
};
