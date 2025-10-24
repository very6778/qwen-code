/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface MinimalTodoItemProps {
  todo: TodoItem;
}

const STATUS_ICONS = {
  pending: ' ',
  in_progress: '◓', // Half-filled circle for in-progress
  completed: '✓',
} as const;

export const MinimalTodoItem: React.FC<MinimalTodoItemProps> = ({ todo }) => {
  const statusIcon = STATUS_ICONS[todo.status];
  const isCompleted = todo.status === 'completed';
  const isInProgress = todo.status === 'in_progress';

  // For completed items: green checkmark + strikethrough content (muted)
  // For in-progress items: orange circle + normal content
  const contentColor = isCompleted ? '#747474' : undefined;
  const iconColor = isCompleted ? '#369e61' : isInProgress ? '#b99037' : undefined;

  return (
    <Box flexDirection="row" marginLeft={2}>
      <Text color={Colors.Gray}>⎿ [</Text>
      <Text
        color={iconColor}
        strikethrough={isCompleted}
      >
        {statusIcon}
      </Text>
      <Text color={Colors.Gray}>] </Text>
      <Text
        color={contentColor}
        strikethrough={isCompleted}
        dimColor={isCompleted}
      >
        {todo.content}
      </Text>
    </Box>
  );
};