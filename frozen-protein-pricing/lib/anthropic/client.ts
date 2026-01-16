import Anthropic from '@anthropic-ai/sdk';

export const MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022',
  SONNET: 'claude-sonnet-4-5-20250929',
  OPUS: 'claude-opus-4-1-20250805',
} as const;

export type ModelType = typeof MODELS[keyof typeof MODELS];

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Please add it to your .env.local file to enable AI features.'
      );
    }

    anthropicClient = new Anthropic({
      apiKey,
    });
  }

  return anthropicClient;
}

export function isAnthropicConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return !!key && key !== 'your-anthropic-api-key-here';
}

export function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.AI_MOCK_MODE === 'true';
}
