/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Complete mock telemetry system to replace all telemetry imports
import fs from 'node:fs';
import path from 'node:path';

// Mock types
export interface TelemetryTarget {
  endpoint: string;
  service: string;
}

export interface RequestContext {
  sessionId: string;
  model: string;
  timestamp: Date;
  userId?: string;
  promptId?: string;
}

export type TelemetryService = {
  recordEvent: (name: string, attributes?: Record<string, any>) => void;
  shutdown: () => Promise<void>;
  startSession?: (context: RequestContext) => void;
  endSession?: () => void;
};

export type Span = {
  setAttribute: (key: string, value: any) => void;
  addEvent: (name: string, attributes?: Record<string, any>) => void;
  end: () => void;
  recordException: (exception: Error) => void;
};

export type Counter = {
  add: (value: number, attributes?: Record<string, any>) => void;
};

export type Histogram = {
  record: (value: number, attributes?: Record<string, any>) => void;
};

export type Gauge = {
  record: (value: number, attributes?: Record<string, any>) => void;
};

export type Meter = {
  createCounter: (name: string, options?: any) => Counter;
  createHistogram: (name: string, options?: any) => Histogram;
  createGauge: (name: string, options?: any) => Gauge;
};

// Mock event classes
export class FileOperationEvent {
  type: 'file-operation';
  timestamp: Date;
  sessionId: string;
  operation: string;
  filePath: string;
  lines?: number;
  mimetype?: string;
  extension?: string;
  diffStat?: string;
  programming_language?: string;
  toolName?: string;

  constructor(toolName?: string, operation?: string, lines?: number, mimetype?: string, extension?: string, diffStat?: string, programming_language?: string) {
    this.type = 'file-operation';
    this.timestamp = new Date();
    this.toolName = toolName;
    this.operation = operation || '';
    this.lines = lines;
    this.mimetype = mimetype;
    this.extension = extension;
    this.diffStat = diffStat;
    this.programming_language = programming_language;
    this.sessionId = 'mock-session';
    this.filePath = 'mock-path';
  }
}

export class ToolCallEvent {
  type: 'tool-call';
  timestamp: Date;
  sessionId: string;
  toolName: string;
  result: 'success' | 'error';
  duration?: number;
  toolCall?: any; // CompletedToolCall object

  constructor(toolCall?: any) {
    this.type = 'tool-call';
    this.timestamp = new Date();
    this.sessionId = 'mock-session';
    this.toolCall = toolCall;

    // Extract info from CompletedToolCall if provided
    if (toolCall) {
      this.toolName = toolCall.toolInvocation?.toolName || 'unknown-tool';
      this.result = toolCall.error ? 'error' : 'success';
    } else {
      this.toolName = 'mock-tool';
      this.result = 'success';
    }
  }
}

export class makeChatCompressionEvent {
  type: 'chat-compression';
  timestamp: Date;
  sessionId: string;
  tokens_before?: number;
  tokens_after?: number;

  constructor(data: { sessionId?: string; tokens_before?: number; tokens_after?: number }) {
    this.type = 'chat-compression';
    this.timestamp = new Date();
    this.sessionId = data.sessionId || 'mock-session';
    this.tokens_before = data.tokens_before;
    this.tokens_after = data.tokens_after;
  }
}

export class NextSpeakerCheckEvent {
  type: 'next-speaker-check';
  timestamp: Date;
  sessionId: string;
  finishReason?: string;
  nextSpeaker?: string;

  constructor(sessionId: string, finishReason?: string, nextSpeaker?: string) {
    this.type = 'next-speaker-check';
    this.timestamp = new Date();
    this.sessionId = sessionId;
    this.finishReason = finishReason;
    this.nextSpeaker = nextSpeaker;
  }
}

export class StartSessionEvent {
  type: 'session-start';
  timestamp: Date;
  config?: any;
  toolRegistry?: any;

  constructor(config?: any, toolRegistry?: any) {
    this.type = 'session-start';
    this.timestamp = new Date();
    this.config = config;
    this.toolRegistry = toolRegistry;
  }
}

export class ContentRetryEvent {
  type: 'content-retry';
  timestamp: Date;
  sessionId: string;
  attempt?: number;
  error?: string;
  delayMs?: number;

  constructor(attempt?: number, error?: string, delayMs?: number) {
    this.type = 'content-retry';
    this.timestamp = new Date();
    this.sessionId = 'mock-session';
    this.attempt = attempt;
    this.error = error;
    this.delayMs = delayMs;
  }
}

export class ContentRetryFailureEvent {
  type: 'content-retry-failure';
  timestamp: Date;
  sessionId: string;
  maxAttempts?: number;
  error: string;

  constructor(maxAttempts?: number, error?: string) {
    this.type = 'content-retry-failure';
    this.timestamp = new Date();
    this.sessionId = 'mock-session';
    this.maxAttempts = maxAttempts;
    this.error = error || 'Unknown error';
  }
}

export class InvalidChunkEvent {
  type: 'invalid-chunk';
  timestamp: Date;
  sessionId: string;
  chunk: any;

  constructor(chunk?: any) {
    this.type = 'invalid-chunk';
    this.timestamp = new Date();
    this.sessionId = 'mock-session';
    this.chunk = chunk || 'Unknown chunk';
  }
}

export class LoopDetectedEvent {
  type: 'loop-detected';
  timestamp: Date;
  sessionId: string;
  loopType: string;

  constructor(sessionId: string, loopType: string) {
    this.type = 'loop-detected';
    this.timestamp = new Date();
    this.sessionId = sessionId;
    this.loopType = loopType;
  }
}

export class ApiErrorEvent {
  type: 'api-error';
  timestamp: Date;
  url: string;
  error: string;
  responseId?: string;
  model?: string;
  duration?: number;
  promptId?: string;
  authType?: string;
  extra?: any;

  constructor(
    responseId?: string,
    model?: string,
    error?: string,
    duration?: number,
    promptId?: string,
    authType?: string,
    url?: string,
    extra?: any
  ) {
    this.type = 'api-error';
    this.timestamp = new Date();
    this.responseId = responseId;
    this.model = model;
    this.error = error || 'Unknown error';
    this.duration = duration;
    this.promptId = promptId;
    this.authType = authType;
    this.url = url || 'mock-api-url';
    this.extra = extra;
  }
}

export class ApiRequestEvent {
  type: 'api-request';
  timestamp: Date;
  url: string;
  model?: string;
  sessionId?: string;
  requestText?: string;
  contents?: any;

  constructor(
    model?: string,
    sessionId?: string,
    requestText?: string,
    contents?: any,
    url?: string
  ) {
    this.type = 'api-request';
    this.timestamp = new Date();
    this.model = model;
    this.sessionId = sessionId;
    this.requestText = requestText;
    this.contents = contents;
    this.url = url || 'mock-api-url';
  }
}

export class ApiResponseEvent {
  type: 'api-response';
  timestamp: Date;
  url: string;
  statusCode: number;
  responseId?: string;
  model?: string;
  duration?: number;
  promptId?: string;
  authType?: string;
  usageMetadata?: any;
  responseText?: string;
  requestText?: string;
  providerRequestText?: string;
  providerResponseText?: string;

  constructor(
    responseId?: string,
    model?: string,
    duration?: number,
    promptId?: string,
    authType?: string,
    usageMetadata?: any,
    responseText?: string,
    url?: string,
    statusCode?: number,
    extra?: {
      requestText?: string;
      providerRequestText?: string;
      providerResponseText?: string;
    }
  ) {
    this.type = 'api-response';
    this.timestamp = new Date();
    this.responseId = responseId;
    this.model = model;
    this.duration = duration;
    this.promptId = promptId;
    this.authType = authType;
    this.usageMetadata = usageMetadata;
    this.responseText = responseText;
    this.url = url || 'mock-api-url';
    this.statusCode = statusCode || 200;
    this.requestText = extra?.requestText;
    this.providerRequestText = extra?.providerRequestText;
    this.providerResponseText = extra?.providerResponseText;
  }
}

// Mock enums
export const LoopType = {
  COMMAND_LOOP: 'command-loop',
  TOOL_LOOP: 'tool-loop',
  CONVERSATION_LOOP: 'conversation-loop',
  CONSECUTIVE_IDENTICAL_TOOL_CALLS: 'consecutive-identical-tool-calls',
  CHANTING_IDENTICAL_SENTENCES: 'chanting-identical-sentences',
  LLM_DETECTED_LOOP: 'llm-detected-loop'
} as const;

export const FileOperation = {
  READ: 'read',
  WRITE: 'write',
  EDIT: 'edit',
  DELETE: 'delete',
  CREATE: 'create',
  UPDATE: 'update'
} as const;

// Mock functions
export const logToolCall = (config: any, event: any, duration?: number) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Tool Call] ${event.toolName}: ${event.result} (${duration}ms)`);
  }
};

export const logFileOperation = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] File operation:`, event);
  }
};

export const logCliConfiguration = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] CLI Configuration:`, config, event);
  }
};

export const logChatCompression = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Chat compression:`, config, event);
  }
};

export const logNextSpeakerCheck = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Next speaker check:`, config, event);
  }
};

export const logLoopDetected = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Loop detected:`, config, event);
  }
};

export const logContentRetry = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Content retry:`, config, event);
  }
};

export const logContentRetryFailure = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Content retry failure:`, config, event);
  }
};

export const logInvalidChunk = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Invalid chunk:`, config, event);
  }
};

const MAIN_LOG_FILE_NAME = 'main-log.md';

function resolveMainLogPath(): string {
  const envPath = process.env['QWEN_MAIN_LOG_PATH'];
  if (envPath && envPath.trim().length > 0) {
    return path.resolve(envPath);
  }
  return path.resolve(process.cwd(), MAIN_LOG_FILE_NAME);
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return `"Failed to serialize payload: ${
      error instanceof Error ? error.message : String(error)
    }"`;
  }
}

export function appendToMainLog(kind: string, event: unknown) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${kind}] ${safeStringify(event)}\n`;
  try {
    fs.appendFileSync(resolveMainLogPath(), line);
  } catch (error) {
    if (process.env['NODE_ENV'] === 'development') {
      console.error('[Mock] Failed to write to main log file:', error);
    }
  }
}

export const logApiError = (_config: any, event: any) => {
  appendToMainLog('api-error', event);
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] API error:`, event);
  }
};

export const logApiRequest = (_config: any, event: any) => {
  appendToMainLog('api-request', event);
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] API request:`, event);
  }
};

export const logApiResponse = (_config: any, event: any) => {
  appendToMainLog('api-response', event);
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] API response:`, event);
  }
};

// Mock constants
export const TelemetryTarget: TelemetryTarget = {
  endpoint: 'mock://telemetry',
  service: 'qwen-code'
};

export const DEFAULT_OTLP_ENDPOINT = 'mock://otlp';
export const DEFAULT_TELEMETRY_TARGET = TelemetryTarget;

// Mock sessionId for usage in components
export const sessionId = 'mock-session-id';

// Mock initialization
export const initializeTelemetry = async (): Promise<TelemetryService> => {
  return {
    recordEvent: () => {},
    shutdown: async () => {}
  };
};

// Mock OpenTelemetry API
export const context = {
  active: () => ({ trace_id: 'mock-trace-id' }),
  setAttribute: () => {},
  getAttribute: () => undefined
};

export const trace = {
  getSpan: () => ({
    setAttribute: () => {},
    addEvent: () => {},
    end: () => {}
  }),
  SpanKind: {
    INTERNAL: 'INTERNAL',
    SERVER: 'SERVER',
    CLIENT: 'CLIENT',
    PRODUCER: 'PRODUCER',
    CONSUMER: 'CONSUMER'
  }
};

export const metrics = {
  getMeter: () => ({
    createCounter: () => ({ add: () => {} }),
    createHistogram: () => ({ record: () => {} }),
    createGauge: () => ({ record: () => {} })
  })
};

export const logs = {
  getLogger: () => ({
    emit: () => {},
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {}
  })
};

// Mock DefaultTelemetryService
export const DefaultTelemetryService: TelemetryService = {
  recordEvent: () => {},
  shutdown: async () => {}
};

// Mock QwenLogger for tests
export class QwenLogger {
  logChatCompressionEvent = () => {};
  logNextSpeakerCheckEvent = () => {};
}

// Mock QwenLogAttributes
export const QwenLogAttributes = {};

// Additional telemetry functions for CLI/UI
export const logUserPrompt = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] User prompt:`, config, event);
  }
};

export const logFlashFallback = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Flash fallback:`, config, event);
  }
};

export const logSlashCommand = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Slash command:`, config, event);
  }
};

export const logConversationFinishedEvent = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Conversation finished:`, config, event);
  }
};

export const logApiCancel = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] API cancel:`, config, event);
  }
};

export const logKittySequenceOverflow = (config: any, event: any) => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Kitty sequence overflow:`, config, event);
  }
};

// Mock telemetry shutdown functions
export const shutdownTelemetry = async (config?: any): Promise<void> => {
  if (process.env['NODE_ENV'] === 'development') {
    console.log(`[Mock] Telemetry shutdown`, config ? `with config` : 'without config');
  }
};

export const isTelemetrySdkInitialized = (): boolean => {
  return false; // Mock - always false since we don't use real telemetry
};

// Mock event classes for CLI/UI
export class UserPromptEvent {
  type: 'user-prompt';
  timestamp: Date;
  sessionId: string;
  content?: string;

  constructor(sessionId?: string, content?: string) {
    this.type = 'user-prompt';
    this.timestamp = new Date();
    this.sessionId = sessionId || 'mock-session';
    this.content = content;
  }
}

export class FlashFallbackEvent {
  type: 'flash-fallback';
  timestamp: Date;
  sessionId: string;
  reason?: string;

  constructor(sessionId?: string, reason?: string) {
    this.type = 'flash-fallback';
    this.timestamp = new Date();
    this.sessionId = sessionId || 'mock-session';
    this.reason = reason;
  }
}

export class SlashCommandEvent {
  type: 'slash-command';
  timestamp: Date;
  sessionId: string;
  command?: string;
  status?: string;

  constructor(sessionId?: string, command?: string, status?: string) {
    this.type = 'slash-command';
    this.timestamp = new Date();
    this.sessionId = sessionId || 'mock-session';
    this.command = command;
    this.status = status;
  }
}

// Alias for backward compatibility
export const makeSlashCommandEvent = SlashCommandEvent;

export const SlashCommandStatus = {
  SUCCESS: 'success',
  FAILED: 'failed',
  ERROR: 'error',
  PENDING: 'pending'
} as const;

export class ConversationFinishedEvent {
  type: 'conversation-finished';
  timestamp: Date;
  sessionId: string;
  reason?: string;

  constructor(sessionId?: string, reason?: string) {
    this.type = 'conversation-finished';
    this.timestamp = new Date();
    this.sessionId = sessionId || 'mock-session';
    this.reason = reason;
  }
}

export class ApiCancelEvent {
  type: 'api-cancel';
  timestamp: Date;
  sessionId: string;
  reason?: string;

  constructor(sessionId?: string, reason?: string) {
    this.type = 'api-cancel';
    this.timestamp = new Date();
    this.sessionId = sessionId || 'mock-session';
    this.reason = reason;
  }
}

export class KittySequenceOverflowEvent {
  type: 'kitty-sequence-overflow';
  timestamp: Date;
  sessionId: string;
  sequence?: string;

  constructor(sessionId?: string, sequence?: string) {
    this.type = 'kitty-sequence-overflow';
    this.timestamp = new Date();
    this.sessionId = sessionId || 'mock-session';
    this.sequence = sequence;
  }
}

// Mock type definitions with detailed structure
export interface SessionMetrics {
  totalTokens: number;
  totalTime: number;
  requestCount: number;
  models: {
    [modelName: string]: ModelMetrics;
  };
  tools: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    totalDurationMs: number;
    totalDecisions: {
      [toolName: string]: number;
    };
    byName: {
      [toolName: string]: ToolCallStats;
    };
  };
  files: {
    totalReads: number;
    totalWrites: number;
    totalEdits: number;
    totalLinesAdded: number;
    totalLinesRemoved: number;
  };
}

export interface ModelMetrics {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  tokens: {
    input: number;
    output: number;
    total: number;
    prompt: number;
    cached: number;
    thoughts: number;
    tool: number;
    candidates: number;
  };
  api: {
    totalRequests: number;
    totalTime: number;
    successRate: number;
    averageLatency: number;
    totalErrors: number;
    totalLatencyMs: number;
  };
}

export interface ToolCallStats {
  toolName: string;
  count: number;
  successRate: number;
  averageDuration: number;
  totalDecisions: number;
  successfulCalls: number;
  failedCalls: number;
  totalDuration: number;
  success: number;
  durationMs: number;
  decisions: {
    accept: number;
    reject: number;
    modify: number;
  };
}

// Mock telemetry service
export const uiTelemetryService = {
  recordEvent: (name: string, attributes?: Record<string, any>) => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Mock] UI Telemetry Event:`, name, attributes);
    }
  },
  shutdown: async () => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Mock] UI Telemetry Shutdown`);
    }
  },
  // Missing methods that are causing build errors
  resetLastPromptTokenCount: () => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Mock] Reset last prompt token count`);
    }
  },
  getMetrics: (): SessionMetrics => ({
    totalTokens: 0,
    totalTime: 0,
    requestCount: 0,
    models: {},
    tools: {
      totalCalls: 0,
      totalSuccess: 0,
      totalFail: 0,
      totalDurationMs: 0,
      totalDecisions: {},
      byName: {}
    },
    files: {
      totalReads: 0,
      totalWrites: 0,
      totalEdits: 0,
      totalLinesAdded: 0,
      totalLinesRemoved: 0
    }
  }),
  getLastPromptTokenCount: () => 0,
  on: (event: string, callback: Function) => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Mock] Telemetry on:`, event);
    }
  },
  off: (event: string, callback: Function) => {
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[Mock] Telemetry off:`, event);
    }
  }
};
