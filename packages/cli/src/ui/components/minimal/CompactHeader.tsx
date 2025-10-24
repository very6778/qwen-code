/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { TOOL_STATUS } from '../../constants.js';
import { Colors } from '../../colors.js';
import type { ToolCallStatus } from '../../types.js';

interface CompactHeaderProps {
  status: ToolCallStatus;
  toolName: string;
  target?: string;
  emphasis?: 'high' | 'medium' | 'low';
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  status,
  toolName,
  target,
  emphasis = 'medium',
}) => {
  // Semantic status icon with colors
  const getStatusIconWithColor = () => {
    switch (status) {
      case 'Success':
        return <Text color="#369e61">{TOOL_STATUS.SUCCESS}</Text>;
      case 'Error':
        return <Text color="#ad4331">{TOOL_STATUS.ERROR}</Text>;
      case 'Pending':
      case 'Executing':
        return <Text color="#369e61">{TOOL_STATUS.PENDING}</Text>;
      case 'Confirming':
      case 'Canceled':
        return <Text color={Colors.Gray || 'gray'}>{TOOL_STATUS.CONFIRMING}</Text>;
      default:
        return <Text color={Colors.Gray || 'gray'}>{TOOL_STATUS.CONFIRMING}</Text>;
    }
  };

  // Tool name formatting (Custom friendly names)
  const getToolNameDisplay = () => {
    // Custom tool name mappings
    const toolNameMap: Record<string, string> = {
      'ReadFile': 'Read',
      'ReadManyFiles': 'Read',
      'WriteFile': 'Write',
      'Edit': 'Edit',
      'SearchText': 'Search',
      'Shell': 'Shell',
      'WebSearch': 'Search',
      'ReadFolder': 'List',
      'Glob': 'Find',
      'Task': 'Task',
      'MCPClient': 'MCP',
      'MCPTool': 'MCP',
      'TodoWrite': 'Todo',
      'MemoryTool': 'Memory',
      // Keep some backward compatibility for tool names that might come as kebab-case
      'read-file': 'Read',
      'read-many-files': 'Read',
      'write-file': 'Write',
      'edit': 'Edit',
      'search': 'Search',
      'grep': 'Search',
      'ripGrep': 'Search',
      'shell': 'Shell',
      'web-fetch': 'Fetch',
      'web-search': 'Search',
      'ls': 'List',
      'glob': 'Find',
      'task': 'Task',
      'mcp-client': 'MCP',
      'mcp-tool': 'MCP',
      'todoWrite': 'Todo',
      'memoryTool': 'Memory',
    };

    // Return custom name if exists, otherwise format the original
    if (toolNameMap[toolName]) {
      return toolNameMap[toolName];
    }

    // Fallback: Remove dashes and capitalize
    const cleanName = toolName.replace(/-/g, '');
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  };

  // Target formatting (extract from description or use as-is)
  const getTargetDisplay = () => {
    // If target looks like a file path, clean it up
    if (target && (target.includes('/') || target.includes('\\'))) {
      return target;
    }
    return target;
  };

  return (
    <Box flexDirection="row" alignItems="center">
      {getStatusIconWithColor()}
      <Text> </Text>
      <Text bold>
        {getToolNameDisplay()}
      </Text>
      <Text>(</Text>
      <Text>{getTargetDisplay() || ''}</Text>
      <Text>)</Text>
    </Box>
  );
};