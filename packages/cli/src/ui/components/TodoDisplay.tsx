/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface TodoDisplayProps {
  todos: TodoItem[];
}

const STATUS_ICONS = {
  pending: '○',
  in_progress: '◐',
  completed: '●',
} as const;

export const TodoDisplay: React.FC<TodoDisplayProps> = ({ todos }) => {
  if (!todos || todos.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column">
      {todos.map((todo, index) => (
        <TodoItemRow
          key={todo.id}
          todo={todo}
          isLast={index === todos.length - 1}
        />
      ))}
    </Box>
  );
};

interface TodoItemRowProps {
  todo: TodoItem;
  isLast?: boolean;
}

const TodoItemRow: React.FC<TodoItemRowProps> = ({ todo, isLast = false }) => {
  const statusIcon = STATUS_ICONS[todo.status];
  const isCompleted = todo.status === 'completed';
  const isInProgress = todo.status === 'in_progress';

  // Use the same color for both status icon and text
  const itemColor = isCompleted
    ? Colors.Foreground
    : isInProgress
      ? Colors.AccentGreen
      : Colors.Foreground;

  return (
    <Box
      flexDirection="row"
      minHeight={1}
      marginBottom={isLast ? 0 : 1}
    >
      {/* Status Icon */}
      <Box width={3}>
        <Text color={itemColor}>{statusIcon}</Text>
      </Box>

      {/* Content */}
      <Box flexGrow={1}>
        <Text color={itemColor} strikethrough={isCompleted} wrap="wrap">
          {todo.content}
        </Text>
      </Box>
    </Box>
  );
};
