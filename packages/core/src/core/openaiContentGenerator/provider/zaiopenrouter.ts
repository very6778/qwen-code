import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
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

    // Add ZAI OpenRouter-specific headers
    return {
      ...baseHeaders,
      'HTTP-Referer': 'https://github.com/QwenLM/qwen-code.git',
      'X-Title': 'Qwen Code',
      'X-Model': 'glm-4.6',
    };
  }

  override buildRequest(
    request: any,
    _userPromptId: string,
  ): any {
    // Ensure we always use glm-4.6 model regardless of what's requested
    const enhancedRequest = {
      ...request,
      model: 'glm-4.6',
      temperature: 0.3,
      top_p: request.top_p || 0.9,
      // Add cache control headers similar to DashScope to ensure proper streaming
      stream: true,
    };

    return enhancedRequest;
  }

  }