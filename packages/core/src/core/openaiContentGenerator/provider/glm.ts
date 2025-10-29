import OpenAI from 'openai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES } from '../constants.js';
import type { OpenAICompatibleProvider } from './types.js';

/**
 * Provider for Z.ai GLM-4.6 API
 * OpenAI-compatible API with predefined configuration
 */
export class GLMOpenAICompatibleProvider implements OpenAICompatibleProvider {
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
    };
  }

  buildClient(): OpenAI {
    const defaultHeaders = this.buildHeaders();
    return new OpenAI({
      apiKey:
        this.contentGeneratorConfig.apiKey ||
        '4b7ce72f0aa04073821d45375764abb9.DUpXqpRe1Z6B7SmQ',
      baseURL:
        this.contentGeneratorConfig.baseUrl || 'https://api.z.ai/api/paas/v4/',
      timeout: this.contentGeneratorConfig.timeout || DEFAULT_TIMEOUT,
      maxRetries: this.contentGeneratorConfig.maxRetries || DEFAULT_MAX_RETRIES,
      defaultHeaders,
    });
  }

  buildRequest(
    request: OpenAI.Chat.ChatCompletionCreateParams,
    _userPromptId: string,
  ): OpenAI.Chat.ChatCompletionCreateParams {
    // Override model to glm-4.6 for all requests
    return {
      ...request,
      model: 'glm-4.6',
      temperature:
        this.contentGeneratorConfig.samplingParams?.temperature ||
        request.temperature,
      top_p: this.contentGeneratorConfig.samplingParams?.top_p || request.top_p,
      max_tokens:
        this.contentGeneratorConfig.samplingParams?.max_tokens ||
        request.max_tokens,
      stream: true, // GLM-4.6 supports streaming
    };
  }
}
