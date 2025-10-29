/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock telemetry service for backward compatibility during transition

export interface RequestContext {
  startTime: number;
  userPromptId?: string;
  isStreaming?: boolean;
  duration?: number;
  model?: string;
  authType?: string;
  error?: any;
  responseId?: string;
  promptId?: string;
  requestText?: string;
  responseText?: string;
  responseTokens?: number;
  statusCode?: number;
  // Add any other properties that might be used
  [key: string]: any;
}

export function createRequestContext(): RequestContext {
  return {
    startTime: Date.now(),
    userPromptId: 'mock-id',
    isStreaming: false,
    duration: 0,
    model: 'mock-model',
    authType: 'mock-auth',
  };
}

export function logRequestCompletion() {
  // No-op
}

export class DefaultTelemetryService implements TelemetryService {
  constructor(
    private config: Config,
    private enableOpenAILogging: boolean = false,
  ) {}

  private serializeForLogging(value: unknown): string | undefined {
    if (value === undefined) {
      return undefined;
    }
    const seen = new WeakSet();
    const replacer = (_key: string, val: unknown) => {
      if (typeof val === 'bigint') {
        return val.toString();
      }
      if (val && typeof val === 'object') {
        if (seen.has(val as object)) {
          return '[Circular]';
        }
        seen.add(val as object);
        if (val instanceof Map) {
          return Object.fromEntries(val);
        }
        if (val instanceof Set) {
          return Array.from(val);
        }
        if (typeof (val as { toJSON?: () => unknown }).toJSON === 'function') {
          try {
            return (val as { toJSON: () => unknown }).toJSON();
          } catch (error) {
            return `[toJSON error: ${
              error instanceof Error ? error.message : String(error)
            }]`;
          }
        }
        const tag = Object.prototype.toString.call(val);
        if (tag === '[object AbortSignal]') {
          return '[AbortSignal]';
        }
      }
      if (typeof val === 'function') {
        return `[Function ${(val as { name?: string }).name || 'anonymous'}]`;
      }
      if (val instanceof Error) {
        return {
          name: val.name,
          message: val.message,
          stack: val.stack,
        };
      }
      return val;
    };

    try {
      return JSON.stringify(value, replacer);
    } catch (error) {
      return `Failed to serialize: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }

  async logSuccess(
    context: RequestContext,
    response: GenerateContentResponse,
    openaiRequest?: OpenAI.Chat.ChatCompletionCreateParams,
    openaiResponse?: OpenAI.Chat.ChatCompletion,
  ): Promise<void> {
    // Log API response event for UI telemetry
    const responseEvent = new ApiResponseEvent(
      response.responseId || 'unknown',
      context.model,
      context.duration,
      context.userPromptId,
      context.authType,
      response.usageMetadata,
      this.serializeForLogging(response),
    );
    responseEvent.requestText = this.serializeForLogging(openaiRequest);
    responseEvent.providerRequestText = this.serializeForLogging(openaiRequest);
    responseEvent.providerResponseText =
      this.serializeForLogging(openaiResponse);

    logApiResponse(this.config, responseEvent);

    // Log interaction if enabled
    if (this.enableOpenAILogging && openaiRequest && openaiResponse) {
      await openaiLogger.logInteraction(openaiRequest, openaiResponse);
    }
  }

  async logError(
    context: RequestContext,
    error: unknown,
    openaiRequest?: OpenAI.Chat.ChatCompletionCreateParams,
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log API error event for UI telemetry
    const errorEvent = new ApiErrorEvent(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any)?.requestID || 'unknown',
      context.model,
      errorMessage,
      context.duration,
      context.userPromptId,
      context.authType,
    );
    errorEvent.extra = {
      errorType: (error as { type?: string })?.type,
      statusCode: (error as { code?: number })?.code,
      requestText: this.serializeForLogging(openaiRequest),
      stack: error instanceof Error ? error.stack : undefined,
    };
    logApiError(this.config, errorEvent);

    // Log error interaction if enabled
    if (this.enableOpenAILogging && openaiRequest) {
      await openaiLogger.logInteraction(
        openaiRequest,
        undefined,
        error as Error,
      );
    }
  }

  async logStreamingSuccess(
    context: RequestContext,
    responses: GenerateContentResponse[],
    openaiRequest?: OpenAI.Chat.ChatCompletionCreateParams,
    openaiChunks?: OpenAI.Chat.ChatCompletionChunk[],
  ): Promise<void> {
    // Get final usage metadata from the last response that has it
    const finalUsageMetadata = responses
      .slice()
      .reverse()
      .find((r) => r.usageMetadata)?.usageMetadata;

    let combinedResponseForLogging: OpenAI.Chat.ChatCompletion | undefined;
    if (openaiChunks && openaiChunks.length > 0) {
      combinedResponseForLogging = this.combineOpenAIChunksForLogging(
        openaiChunks,
      );
    }

    // Log API response event for UI telemetry
    const responseEvent = new ApiResponseEvent(
      responses[responses.length - 1]?.responseId || 'unknown',
      context.model,
      context.duration,
      context.userPromptId,
      context.authType,
      finalUsageMetadata,
      this.serializeForLogging(responses),
    );
    responseEvent.requestText = this.serializeForLogging(openaiRequest);
    responseEvent.providerRequestText = this.serializeForLogging(openaiRequest);
    responseEvent.providerResponseText = this.serializeForLogging(
      combinedResponseForLogging,
    );

    logApiResponse(this.config, responseEvent);

    // Log interaction if enabled - combine chunks only when needed
    if (
      this.enableOpenAILogging &&
      openaiRequest &&
      combinedResponseForLogging
    ) {
      await openaiLogger.logInteraction(
        openaiRequest,
        combinedResponseForLogging,
      );
    }
  }

  /**
   * Combine OpenAI chunks for logging purposes
   * This method consolidates all OpenAI stream chunks into a single ChatCompletion response
   * for telemetry and logging purposes, avoiding unnecessary format conversions
   */
  private combineOpenAIChunksForLogging(
    chunks: OpenAI.Chat.ChatCompletionChunk[],
  ): OpenAI.Chat.ChatCompletion {
    if (chunks.length === 0) {
      throw new Error('No chunks to combine');
    }

    const firstChunk = chunks[0];

    // Combine all content from chunks
    let combinedContent = '';
    const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];
    let finishReason:
      | 'stop'
      | 'length'
      | 'tool_calls'
      | 'content_filter'
      | 'function_call'
      | null = null;
    let usage:
      | {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        }
      | undefined;

    for (const chunk of chunks) {
      const choice = chunk.choices?.[0];
      if (choice) {
        // Combine text content
        if (choice.delta?.content) {
          combinedContent += choice.delta.content;
        }

        // Collect tool calls
        if (choice.delta?.tool_calls) {
          for (const toolCall of choice.delta.tool_calls) {
            if (toolCall.index !== undefined) {
              if (!toolCalls[toolCall.index]) {
                toolCalls[toolCall.index] = {
                  id: toolCall.id || '',
                  type: toolCall.type || 'function',
                  function: { name: '', arguments: '' },
                };
              }

              if (toolCall.function?.name) {
                toolCalls[toolCall.index].function.name +=
                  toolCall.function.name;
              }
              if (toolCall.function?.arguments) {
                toolCalls[toolCall.index].function.arguments +=
                  toolCall.function.arguments;
              }
            }
          }
        }

        // Get finish reason from the last chunk
        if (choice.finish_reason) {
          finishReason = choice.finish_reason;
        }
      }

      // Get usage from the last chunk that has it
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }

    // Create the combined ChatCompletion response
    const message: OpenAI.Chat.ChatCompletionMessage = {
      role: 'assistant',
      content: combinedContent || null,
      refusal: null,
    };

    // Add tool calls if any
    if (toolCalls.length > 0) {
      message.tool_calls = toolCalls.filter((tc) => tc.id); // Filter out empty tool calls
    }

    const combinedResponse: OpenAI.Chat.ChatCompletion = {
      id: firstChunk.id,
      object: 'chat.completion',
      created: firstChunk.created,
      model: firstChunk.model,
      choices: [
        {
          index: 0,
          message,
          finish_reason: finishReason || 'stop',
          logprobs: null,
        },
      ],
      usage: usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
      system_fingerprint: firstChunk.system_fingerprint,
    };

    return combinedResponse;
  }
}

export const DefaultTelemetryService = new TelemetryService();
