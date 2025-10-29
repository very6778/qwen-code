/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES } from '../constants.js';
import type { OpenAICompatibleProvider } from './types.js';

// Import OpenAI for type compatibility
import OpenAI from 'openai';

/**
 * Provider for Z.ai GLM-4.6 API using Anthropic SDK
 * Anthropic-compatible API with predefined configuration
 */
export class AnthropicCompatibleProvider implements OpenAICompatibleProvider {
  protected contentGeneratorConfig: ContentGeneratorConfig;
  protected cliConfig: Config;

  constructor(
    contentGeneratorConfig: ContentGeneratorConfig,
    cliConfig: Config,
  ) {
    this.cliConfig = cliConfig;
    this.contentGeneratorConfig = contentGeneratorConfig;
  }

  buildHeaders(): Record<string, string | undefined> {
    const version = this.cliConfig.getCliVersion() || 'unknown';
    const userAgent = `QwenCode/${version} (${process.platform}; ${process.arch})`;
    return {
      'User-Agent': userAgent,
      'anthropic-version': '2023-06-01',
    };
  }

  buildClient(): OpenAI {
    // Create Anthropic client
    const anthropicClient = new Anthropic({
      apiKey: '4b7ce72f0aa04073821d45375764abb9.DUpXqpRe1Z6B7SmQ',
      baseURL: 'https://api.z.ai/api/anthropic',
      timeout: this.contentGeneratorConfig.timeout || DEFAULT_TIMEOUT,
      maxRetries: this.contentGeneratorConfig.maxRetries || DEFAULT_MAX_RETRIES,
      defaultHeaders: this.buildHeaders(),
    });

    // Create OpenAI client with type assertion to bypass strict typing
    const openAIClient = new OpenAI({
      apiKey: '4b7ce72f0aa04073821d45375764abb9.DUpXqpRe1Z6B7SmQ',
      baseURL: 'https://api.z.ai/api/anthropic',
      timeout: this.contentGeneratorConfig.timeout || DEFAULT_TIMEOUT,
      maxRetries: this.contentGeneratorConfig.maxRetries || DEFAULT_MAX_RETRIES,
      defaultHeaders: this.buildHeaders(),
    }) as any;

    // Override the chat completions create method
    openAIClient.chat.completions.create = async (params: any) => {
      // Convert OpenAI format to Anthropic format
      const anthropicParams = {
        model: 'glm-4.6',
        messages: params.messages?.map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        })),
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature || 0.7,
        stream: params.stream || false,
      };

      if (params.stream) {
        // Handle streaming with OpenAI-compatible format
        const stream = (await anthropicClient.messages.create(
          anthropicParams,
        )) as any;

        // Convert Anthropic stream to OpenAI-compatible stream
        const openAIStream = (async function* () {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              yield {
                id: chunk.id,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model: 'glm-4.6',
                choices: [
                  {
                    index: 0,
                    delta: {
                      content: chunk.delta.text,
                    },
                    finish_reason: null,
                  },
                ],
              };
            } else if (chunk.type === 'message_stop') {
              yield {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Date.now(),
                model: 'glm-4.6',
                choices: [
                  {
                    index: 0,
                    delta: {},
                    finish_reason: 'stop',
                  },
                ],
              };
            }
          }
        })();

        return openAIStream;
      } else {
        // Handle non-streaming
        const response = await anthropicClient.messages.create(anthropicParams);

        // Convert Anthropic response back to OpenAI format
        const textContent =
          response.content && response.content.length > 0
            ? (
                response.content.find(
                  (block: any) => block.type === 'text',
                ) as any
              )?.text || ''
            : '';

        return {
          id: response.id,
          object: 'chat.completion',
          created: Date.now(),
          model: 'glm-4.6',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: textContent,
              },
              finish_reason: response.stop_reason
                ? response.stop_reason === 'end_turn'
                  ? 'stop'
                  : 'length'
                : null,
            },
          ],
          usage: response.usage || {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };
      }
    };

    return openAIClient as OpenAI;
  }

  buildRequest(
    request: OpenAI.Chat.ChatCompletionCreateParams,
    _userPromptId: string,
  ): OpenAI.Chat.ChatCompletionCreateParams {
    // Pass through as-is since we handle conversion in buildClient
    return {
      ...request,
      model: 'glm-4.6',
      temperature:
        this.contentGeneratorConfig.samplingParams?.temperature ||
        request.temperature,
      max_tokens:
        this.contentGeneratorConfig.samplingParams?.max_tokens ||
        request.max_tokens,
      stream: request.stream || false,
    };
  }
}
