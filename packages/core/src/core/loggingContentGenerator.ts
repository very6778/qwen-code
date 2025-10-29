/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CountTokensParameters,
  CountTokensResponse,
  EmbedContentParameters,
  EmbedContentResponse,
  GenerateContentParameters,
  GenerateContentResponseUsageMetadata,
  GenerateContentResponse,
} from '@google/genai';
// Import telemetry functions from mock system
import {
  logApiRequest,
  logApiResponse,
  logApiError,
  ApiRequestEvent,
  ApiResponseEvent,
  ApiErrorEvent,
} from '../telemetry-mocks.js';

import type { Config } from '../config/config.js';
import type { ContentGenerator } from './contentGenerator.js';
import { isStructuredError } from '../utils/quotaErrorDetection.js';

interface StructuredError {
  status: number;
}

/**
 * A decorator that wraps a ContentGenerator to add logging to API calls.
 */
export class LoggingContentGenerator implements ContentGenerator {
  constructor(
    private readonly wrapped: ContentGenerator,
    private readonly config: Config,
  ) {}

  getWrapped(): ContentGenerator {
    return this.wrapped;
  }

  private serializeForLogging(value: unknown): string {
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
        const constructorName = (val as { constructor?: { name?: string } })
          .constructor?.name;
        if (constructorName === 'AbortSignal') {
          return '[AbortSignal]';
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
      return `"Failed to serialize: ${
        error instanceof Error ? error.message : String(error)
      }"`;
    }
  }

  private logApiRequest(
    request: GenerateContentParameters,
    model: string,
    promptId: string,
  ): void {
    const requestText = this.serializeForLogging(request);
    logApiRequest(
      this.config,
      new ApiRequestEvent(model, promptId, requestText, request.contents),
    );
  }

  private _logApiResponse(
    responseId: string,
    durationMs: number,
    prompt_id: string,
    usageMetadata?: GenerateContentResponseUsageMetadata,
    responseText?: string,
    extra?: {
      requestText?: string;
      providerRequestText?: string;
      providerResponseText?: string;
    },
  ): void {
    logApiResponse(
      this.config,
      new ApiResponseEvent(
        responseId,
        this.config.getModel(),
        durationMs,
        prompt_id,
        this.config.getContentGeneratorConfig()?.authType,
        usageMetadata,
        responseText,
        undefined,
        undefined,
        extra,
      ),
    );
  }

  private _logApiError(
    requestText: string | undefined,
    durationMs: number,
    error: unknown,
    prompt_id: string,
    responseId?: string,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof Error ? error.name : 'unknown';
    const statusCode = isStructuredError(error)
      ? (error as StructuredError).status
      : undefined;

    logApiError(
      this.config,
      new ApiErrorEvent(
        responseId,
        this.config.getModel(),
        errorMessage,
        durationMs,
        prompt_id,
        this.config.getContentGeneratorConfig()?.authType,
        undefined,
        {
          errorType,
          statusCode,
          requestText,
          stack: error instanceof Error ? error.stack : undefined,
        },
      ),
    );
  }

  async generateContent(
    req: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const startTime = Date.now();
    const serializedRequest = this.serializeForLogging(req);
    this.logApiRequest(req, req.model, userPromptId);
    try {
      const response = await this.wrapped.generateContent(req, userPromptId);
      const durationMs = Date.now() - startTime;
      this._logApiResponse(
        response.responseId ?? '',
        durationMs,
        userPromptId,
        response.usageMetadata,
        this.serializeForLogging(response),
        {
          requestText: serializedRequest,
        },
      );
      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this._logApiError(
        serializedRequest,
        durationMs,
        error,
        userPromptId,
      );
      throw error;
    }
  }

  async generateContentStream(
    req: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const startTime = Date.now();
    const serializedRequest = this.serializeForLogging(req);
    this.logApiRequest(req, req.model, userPromptId);

    let stream: AsyncGenerator<GenerateContentResponse>;
    try {
      stream = await this.wrapped.generateContentStream(req, userPromptId);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this._logApiError(
        serializedRequest,
        durationMs,
        error,
        userPromptId,
        undefined,
      );
      throw error;
    }

    return this.loggingStreamWrapper(
      stream,
      startTime,
      userPromptId,
      serializedRequest,
    );
  }

  private async *loggingStreamWrapper(
    stream: AsyncGenerator<GenerateContentResponse>,
    startTime: number,
    userPromptId: string,
    serializedRequest: string,
  ): AsyncGenerator<GenerateContentResponse> {
    let lastResponse: GenerateContentResponse | undefined;
    const responses: GenerateContentResponse[] = [];

    let lastUsageMetadata: GenerateContentResponseUsageMetadata | undefined;
    try {
      for await (const response of stream) {
        responses.push(response);
        lastResponse = response;
        if (response.usageMetadata) {
          lastUsageMetadata = response.usageMetadata;
        }
        yield response;
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      this._logApiError(serializedRequest, durationMs, error, userPromptId);
      throw error;
    }
    const durationMs = Date.now() - startTime;
    if (lastResponse) {
      this._logApiResponse(
        lastResponse.responseId ?? '',
        durationMs,
        userPromptId,
        lastUsageMetadata,
        this.serializeForLogging(responses),
        {
          requestText: serializedRequest,
        },
      );
    }
  }

  async countTokens(req: CountTokensParameters): Promise<CountTokensResponse> {
    return this.wrapped.countTokens(req);
  }

  async embedContent(
    req: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    return this.wrapped.embedContent(req);
  }
}
