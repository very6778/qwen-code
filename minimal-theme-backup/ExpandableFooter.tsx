/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import type { Key } from '../../hooks/useKeypress.js';

interface ExpandableFooterProps {
  isExpanded: boolean;
  onToggle: () => void;
  itemCount?: number;
  hiddenCount?: number;
}

export const ExpandableFooter: React.FC<ExpandableFooterProps> = ({
  isExpanded,
  onToggle,
  itemCount = 0,
  hiddenCount = 0,
}) => {
  useKeypress(
    (key: Key) => {
      if (key.ctrl && key.name === 'e') {
        onToggle();
      }
    },
    { isActive: true },
  );

  return (
    <Box flexDirection="row" marginTop={1}>
      <Text color={Colors.Gray}>
        {isExpanded ? '↑ Collapse' : '↓ Expand'} ({hiddenCount} hidden items)
      </Text>
      <Text color={Colors.MutedGray} dimColor>
        {' '}
        (ctrl+e to toggle)
      </Text>
    </Box>
  );
};