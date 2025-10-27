import OpenAI from 'openai';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { DEFAULT_ZAI_MODEL } from '../../../config/models.js';
import { DEFAULT_MAX_RETRIES, DEFAULT_TIMEOUT } from '../constants.js';
import { DefaultOpenAICompatibleProvider } from './default.js';

const GLM_MODEL_ID = 'glm-4.6';

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
    const resolvedModel = model.includes('minimax')
      ? DEFAULT_ZAI_MODEL
      : GLM_MODEL_ID;

    return {
      ...baseHeaders,
      'HTTP-Referer': 'https://github.com/QwenLM/qwen-code.git',
      'X-Title': 'Qwen Code',
      'X-Model': resolvedModel,
    };
  }

  override buildRequest(
    request: any,
    _userPromptId: string,
  ): any {
    const model = this.contentGeneratorConfig.model ?? DEFAULT_ZAI_MODEL;
    const isMiniMax = model?.includes('minimax');
    const resolvedModel = isMiniMax ? DEFAULT_ZAI_MODEL : GLM_MODEL_ID;

    const enhancedRequest = {
      ...request,
      model: resolvedModel,
      temperature: request.temperature ?? (isMiniMax ? 0.7 : 0.3),
      top_p: request.top_p ?? 0.9,
      // Add cache control headers similar to DashScope to ensure proper streaming
      stream: request.stream ?? true,
    };

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
      const minimaxApiKey = process.env['MINIMAX_API_KEY'];
      if (!minimaxApiKey) {
        throw new Error(
          'MINIMAX_API_KEY environment variable is required when using the MiniMax model.',
        );
      }
      const minimaxBaseUrl =
        process.env['MINIMAX_BASE_URL'] || 'https://openrouter.ai/api/v1';

      return new OpenAI({
        apiKey: minimaxApiKey,
        baseURL: minimaxBaseUrl,
        timeout,
        maxRetries,
        defaultHeaders,
      });
    }

    return super.buildClient();
  }
}
