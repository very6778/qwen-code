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
  // Hierarchical fields
  expansionType?: 'ANALYSIS-DRIVEN' | 'RESEARCH-BASED' | 'MULTI-COMPONENT';
  expansionHint?: string;
  parentId?: string;
  depth?: number;
  hasSubtasks?: boolean;
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

  // Build hierarchy from flat list
  const hierarchy = buildTodoHierarchy(todos);

  return (
    <Box flexDirection="column">
      {hierarchy.map((todo) => (
        <TodoItemRow key={todo.id} todo={todo} level={0} />
      ))}
    </Box>
  );
};

/**
 * Builds hierarchical tree from flat todo list
 */
function buildTodoHierarchy(todos: TodoItem[]): TodoItem[] {
  const idMap = new Map<string, TodoItem & { children: TodoItem[] }>();
  const rootItems: (TodoItem & { children: TodoItem[] })[] = [];

  // First pass: create todos with children arrays
  todos.forEach(todo => {
    idMap.set(todo.id, { ...todo, children: [] });
  });

  // Second pass: build parent-child relationships
  todos.forEach(todo => {
    const item = idMap.get(todo.id)!;

    if (todo.parentId && idMap.has(todo.parentId)) {
      const parent = idMap.get(todo.parentId)!;
      parent.children.push(item);
    } else {
      rootItems.push(item);
    }
  });

  // Sort by creation order (maintain original order as much as possible)
  const sortByOrder = (items: (TodoItem & { children: TodoItem[] })[]) => {
    return items.sort((a, b) => {
      // First sort by depth (shallower first)
      const depthDiff = (a.depth || 0) - (b.depth || 0);
      if (depthDiff !== 0) return depthDiff;

      // Then by status order (pending, in_progress, completed)
      const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      return 0;
    });
  };

  return sortByOrder(rootItems);
}

interface TodoItemRowProps {
  todo: TodoItem & { children?: TodoItem[] };
  level: number;
}

const TodoItemRow: React.FC<TodoItemRowProps> = ({ todo, level }) => {
  const statusIcon = STATUS_ICONS[todo.status];
  const isCompleted = todo.status === 'completed';
  const isInProgress = todo.status === 'in_progress';
  const hasChildren = todo.children && todo.children.length > 0;

  // Use the same color for both status icon and text, like RadioButtonSelect
  let itemColor = isCompleted
    ? Colors.Foreground
    : isInProgress
      ? Colors.AccentGreen
      : Colors.Foreground;

  // Deep level items get slightly different coloring
  if (level >= 4) {
    itemColor = isCompleted
      ? Colors.Foreground
      : isInProgress
        ? Colors.AccentGreen
        : Colors.Gray; // Use Gray instead of DimForeground
  }

  const indent = '  '.repeat(level);

  return (
    <Box flexDirection="column" width="100%">
      <Box flexDirection="row" minHeight={1}>
        {/* Indent for hierarchy */}
        <Box width={level * 2}>
          <Text>{indent}</Text>
        </Box>

        {/* Status Icon */}
        <Box width={3}>
          <Text color={itemColor}>{statusIcon}</Text>
        </Box>

        {/* Content */}
        <Box flexGrow={1}>
          <Text color={itemColor} strikethrough={isCompleted} wrap="wrap">
            {todo.content}
          </Text>

          {/* Expansion Type Badge */}
          {todo.expansionType && (
            <Text color={Colors.AccentGreen}>
              {' '}
              [{todo.expansionType}]
            </Text>
          )}

          {/* Has Subtasks Indicator */}
          {hasChildren && (
            <Text color={Colors.AccentBlue}>
              {' '}
              ({todo.children?.length} alt görev)
            </Text>
          )}
        </Box>
      </Box>

      {/* Expansion Hint */}
      {todo.expansionHint && (
        <Box flexDirection="row" marginLeft={level * 2 + 3}>
          <Text color={Colors.Gray} italic>
            💡 {todo.expansionHint}
          </Text>
        </Box>
      )}

      {/* Render Children Recursively */}
      {hasChildren && todo.children!.map((child) => (
        <TodoItemRow
          key={child.id}
          todo={child}
          level={level + 1}
        />
      ))}
    </Box>
  );
};
