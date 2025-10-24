/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock telemetry utilities
import type { RequestContext } from './types.js';

// Mock telemetry utility functions
export function createRequestContext(
  sessionId: string,
  model: string,
  userId?: string
): RequestContext {
  return {
    sessionId,
    model,
    timestamp: new Date(),
    userId
  };
}

export function sanitizeAttributes(
  attributes: Record<string, any>
): Record<string, string | number | boolean> {
  // Mock implementation
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

export function generateTraceId(): string {
  return `mock-trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSpanId(): string {
  return Math.random().toString(36).substr(2, 16);
}

// Mock event builders
export const createFileOperationEvent = (
  operation: 'read' | 'write' | 'edit',
  filePath: string,
  sessionId: string
) => ({
  type: 'file-operation',
  operation,
  filePath,
  sessionId,
  timestamp: new Date()
});

export const createToolCallEvent = (
  toolName: string,
  result: 'success' | 'error',
  sessionId: string,
  duration?: number
) => ({
  type: 'tool-call',
  toolName,
  result,
  sessionId,
  duration,
  timestamp: new Date()
});

export const createChatCompressionEvent = (sessionId: string) => ({
  type: 'chat-compression',
  sessionId,
  timestamp: new Date()
});

// Mock missing utility functions
export function getProgrammingLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'rb': 'ruby',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'sh': 'bash',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'md': 'markdown'
  };
  return languageMap[ext || ''] || 'unknown';
}