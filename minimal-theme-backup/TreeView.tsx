/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';

interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
  depth: number;
}

interface TreeViewProps {
  nodes: TreeNode[];
  maxHeight?: number;
  expandedPaths?: Set<string>;
  onToggle?: (path: string) => void;
}

export const TreeView: React.FC<TreeViewProps> = ({
  nodes,
  maxHeight,
  expandedPaths = new Set(),
  onToggle,
}) => {
  const renderNode = (node: TreeNode, index: number) => {
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const prefix = '  '.repeat(node.depth) + (hasChildren ? (isExpanded ? '▼ ' : '▶ ') : '• ');

    return (
      <Box key={`${node.path}-${index}`} flexDirection="column">
        <Box flexDirection="row">
          <Text color={Colors.Gray}>{prefix}</Text>
          <Text>{node.name}</Text>
        </Box>
        {hasChildren && isExpanded && (
          <Box flexDirection="column">
            {node.children?.map((child, idx) => renderNode(child, idx))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column" maxHeight={maxHeight}>
      {nodes.map((node, index) => renderNode(node, index))}
    </Box>
  );
};