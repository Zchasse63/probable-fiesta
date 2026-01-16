import type { ModelType } from './client';
import { MODELS } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-5-haiku-20241022': {
    input: 0.8 / 1_000_000, // per token
    output: 4 / 1_000_000,
  },
  'claude-sonnet-4-5-20250929': {
    input: 3 / 1_000_000,
    output: 15 / 1_000_000,
  },
  'claude-opus-4-1-20250805': {
    input: 15 / 1_000_000,
    output: 75 / 1_000_000,
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as Error & { status?: number; code?: string };
      lastError = err;

      // Handle rate limit errors (429)
      if (err.status === 429) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Handle network errors
      if (
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('network')
      ) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Don't retry on other errors
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

export function calculateCost(
  model: ModelType,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return 0;
  }

  const inputCost = inputTokens * pricing.input;
  const outputCost = outputTokens * pricing.output;

  return inputCost + outputCost;
}

export async function logUsage(
  supabase: SupabaseClient,
  taskType: string,
  response: {
    model: ModelType | string;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
    success: boolean;
    errorMessage?: string;
  }
): Promise<void> {
  // Calculate cost only for valid model types, otherwise default to 0
  const validModels = Object.values(MODELS);
  const cost = validModels.includes(response.model as ModelType)
    ? calculateCost(
        response.model as ModelType,
        response.usage.input_tokens,
        response.usage.output_tokens
      )
    : 0;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Only insert if we have a valid authenticated user
    if (authError || !user) {
      // Silent failure - don't expose auth state
      return;
    }

    const { error: insertError } = await supabase.from('ai_processing_log').insert({
      user_id: user.id,
      model: response.model,
      tokens_in: response.usage.input_tokens,
      tokens_out: response.usage.output_tokens,
      task_type: taskType,
      success: response.success,
      error_message: response.errorMessage || null,
      cost_usd: cost,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      // Log insert failure for security monitoring
      console.error('[AI Usage Log] Insert failed:', {
        error_code: insertError.code,
        task_type: taskType,
        user_id: user.id.substring(0, 8) + '...', // Partial ID for correlation
      });
    }
  } catch (error) {
    // Log auth failures for security monitoring (no PII)
    console.error('[AI Usage Log] Auth or DB error:', {
      task_type: taskType,
      error_type: error instanceof Error ? error.name : 'unknown',
    });
  }
}

// Circuit breaker for AI service failures
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private readonly threshold = 5;
  private readonly timeout = 5 * 60 * 1000; // 5 minutes

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = null;
  }

  isOpen(): boolean {
    if (this.failures < this.threshold) {
      return false;
    }

    if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.timeout) {
      // Reset after timeout
      this.failures = 0;
      this.lastFailureTime = null;
      return false;
    }

    return true;
  }

}

export const aiCircuitBreaker = new CircuitBreaker();
