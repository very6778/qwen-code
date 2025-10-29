import OpenAI from 'openai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DEFAULT_ZAI_MODEL } from '../../../config/models.js';
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT } from '../constants.js';
import { DefaultOpenAICompatibleProvider } from './default.js';

/**
 * Provider for ZAI OpenRouter API with GLM-4.6 model support
 */
export class ZaiOpenRouterProvider extends DefaultOpenAICompatibleProvider {
  constructor(
    contentGeneratorConfig: ContentGeneratorConfig,
    cliConfig: Config,
  ) {
    super(contentGeneratorConfig, cliConfig);
  }

  static isZaiOpenRouterProvider(
    contentGeneratorConfig: ContentGeneratorConfig,
  ): boolean {
    const baseURL = contentGeneratorConfig.baseUrl || '';
    const authType = contentGeneratorConfig.authType;
    return (
      authType === 'zai-openrouter' ||
      baseURL.includes('api.z.ai') ||
      baseURL.includes('z.ai')
    );
  }

  override buildHeaders(): Record<string, string | undefined> {
    // Get base headers from parent class
    const baseHeaders = super.buildHeaders();

    const model = this.contentGeneratorConfig.model ?? DEFAULT_ZAI_MODEL;
    // Use the actual model name for X-Model header to ensure proper routing
    return {
      ...baseHeaders,
      'HTTP-Referer': 'https://github.com/QwenLM/qwen-code.git',
      'X-Title': 'Qwen Code',
      'X-Model': model,
    };
  }

  override buildRequest(
    request: any,
    _userPromptId: string,
  ): any {
    const model = this.contentGeneratorConfig.model ?? DEFAULT_ZAI_MODEL;
    const isMiniMax = model?.includes('minimax');

    const enhancedRequest = {
      ...request,
      model: model, // Use the actual model name instead of resolved model
      temperature: request.temperature ?? (isMiniMax ? 0.7 : 0.3),
      top_p: request.top_p ?? 0.9,
      // Add cache control headers similar to DashScope to ensure proper streaming
      stream: request.stream ?? true,
    };

    // Debug logging for MiniMax requests
    if (isMiniMax) {
      console.log(`[MiniMax] Building request:`);
      console.log(`[MiniMax] - Model: ${enhancedRequest.model}`);
      console.log(`[MiniMax] - Temperature: ${enhancedRequest.temperature}`);
      console.log(`[MiniMax] - Stream: ${enhancedRequest.stream}`);
      console.log(`[MiniMax] - Messages count: ${enhancedRequest.messages?.length || 0}`);
      if (enhancedRequest.messages && enhancedRequest.messages.length > 0) {
        console.log(`[MiniMax] - First message role: ${enhancedRequest.messages[0].role}`);
        console.log(`[MiniMax] - First message preview: ${enhancedRequest.messages[0].content?.substring(0, 100)}...`);
      }
    }

    return enhancedRequest;
  }

  override buildClient(): OpenAI {
    const model = this.contentGeneratorConfig.model ?? DEFAULT_ZAI_MODEL;
    const {
      timeout = DEFAULT_TIMEOUT,
      maxRetries = DEFAULT_MAX_RETRIES,
    } = this.contentGeneratorConfig;

    const defaultHeaders = this.buildHeaders();

    if (model && model.includes('minimax')) {
      // For MiniMax models, always prefer MINIMAX_API_KEY for proper authentication
      const minimaxApiKey = process.env['MINIMAX_API_KEY'];
      const hasMinimaxKey = !!process.env['MINIMAX_API_KEY'];
      const hasZaiKey = !!process.env['ZAI_API_KEY'];

      console.log(`[MiniMax] Using MiniMax model: ${model}`);
      console.log(`[MiniMax] MINIMAX_API_KEY present: ${hasMinimaxKey}`);
      console.log(`[MiniMax] ZAI_API_KEY present: ${hasZaiKey}`);

      if (!minimaxApiKey) {
        const errorMsg = 'MINIMAX_API_KEY environment variable is required when using the MiniMax model.';
        console.error(`[MiniMax] Error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      // Use OpenRouter endpoint for MiniMax models
      const minimaxBaseUrl =
        process.env['MINIMAX_BASE_URL'] || 'https://openrouter.ai/api/v1';

      console.log(`[MiniMax] Using MINIMAX_API_KEY and base URL: ${minimaxBaseUrl}`);
      console.log(`[MiniMax] API Key prefix: ${minimaxApiKey.substring(0, 10)}...`);
      console.log(`[MiniMax] Timeout: ${timeout}ms, Max retries: ${maxRetries}`);
      console.log(`[MiniMax] Default headers:`, Object.keys(defaultHeaders));

      const client = new OpenAI({
        apiKey: minimaxApiKey,
        baseURL: minimaxBaseUrl,
        timeout,
        maxRetries,
        defaultHeaders,
      });

      console.log(`[MiniMax] OpenAI client created successfully`);
      return client;
    }

    return super.buildClient();
  }
}
