import { describe, it, expect, beforeEach } from 'vitest';
import { ZaiOpenRouterProvider } from './zaiopenrouter.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import type { Config } from '../../../config/config.js';

describe('ZaiOpenRouterProvider', () => {
  let provider: ZaiOpenRouterProvider;
  let mockConfig: Config;
  let mockContentGeneratorConfig: ContentGeneratorConfig;

  beforeEach(() => {
    mockConfig = {
      getCliVersion: () => '1.0.0',
    } as Config;

    mockContentGeneratorConfig = {
      apiKey: 'test-api-key',
      baseUrl: 'https://api.z.ai/api/coding/paas/v4',
      model: 'glm-4.6',
      authType: 'zai-openrouter',
    } as ContentGeneratorConfig;

    provider = new ZaiOpenRouterProvider(mockContentGeneratorConfig, mockConfig);
  });

  describe('isZaiOpenRouterProvider', () => {
    it('should return true for ZAI OpenRouter provider with authType', () => {
      const config = {
        authType: 'zai-openrouter',
        baseUrl: 'https://api.z.ai/api/coding/paas/v4',
      } as ContentGeneratorConfig;

      expect(ZaiOpenRouterProvider.isZaiOpenRouterProvider(config)).toBe(true);
    });

    it('should return true for ZAI OpenRouter provider with z.ai URL', () => {
      const config = {
        authType: 'openai',
        baseUrl: 'https://api.z.ai/api/coding/paas/v4',
      } as ContentGeneratorConfig;

      expect(ZaiOpenRouterProvider.isZaiOpenRouterProvider(config)).toBe(true);
    });

    it('should return false for non-ZAI providers', () => {
      const config = {
        authType: 'openai',
        baseUrl: 'https://api.openai.com/v1',
      } as ContentGeneratorConfig;

      expect(ZaiOpenRouterProvider.isZaiOpenRouterProvider(config)).toBe(false);
    });
  });

  describe('buildHeaders', () => {
    it('should include ZAI-specific headers', () => {
      const headers = provider.buildHeaders();

      expect(headers).toHaveProperty('HTTP-Referer', 'https://github.com/QwenLM/qwen-code.git');
      expect(headers).toHaveProperty('X-Title', 'Qwen Code');
      expect(headers).toHaveProperty('X-Model', 'glm-4.6');
      expect(headers).toHaveProperty('User-Agent');
    });
  });

  describe('buildRequest', () => {
    it('should override model to glm-4.6', () => {
      const request = {
        model: 'some-other-model',
        temperature: 0.5,
        max_tokens: 1000,
      };

      const enhancedRequest = provider.buildRequest(request, 'test-user-id');

      expect(enhancedRequest.model).toBe('glm-4.6');
      expect(enhancedRequest.temperature).toBe(0.5);
      expect(enhancedRequest.max_tokens).toBe(1000);
    });

    it('should not override max_tokens if not provided', () => {
      const request = {
        model: 'glm-4.6',
        temperature: 0.7,
      };

      const enhancedRequest = provider.buildRequest(request, 'test-user-id');

      expect(enhancedRequest.max_tokens).toBeUndefined();
    });

    it('should preserve stream parameter from original request', () => {
      const request = {
        model: 'glm-4.6',
        stream: true,
        temperature: 0.5,
      };

      const enhancedRequest = provider.buildRequest(request, 'test-user-id');

      expect(enhancedRequest.stream).toBe(true);
      expect(enhancedRequest.temperature).toBe(0.5);
    });

    it('should set default temperature to 0.6', () => {
      const request = {
        model: 'glm-4.6',
      };

      const enhancedRequest = provider.buildRequest(request, 'test-user-id');

      expect(enhancedRequest.temperature).toBe(0.6);
    });

    it('should set default top_p to 0.9', () => {
      const request = {
        model: 'glm-4.6',
      };

      const enhancedRequest = provider.buildRequest(request, 'test-user-id');

      expect(enhancedRequest.top_p).toBe(0.9);
    });
  });
});