/**
 * Persistent circuit breaker using database storage
 * Survives server restarts to prevent DoS recovery evasion
 */

import { createClient } from '@/lib/supabase/server';

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number | null;
  isOpen: boolean;
}

const THRESHOLD = 5;
const TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CIRCUIT_BREAKER_KEY = 'ai_service_circuit_breaker';

export class PersistentCircuitBreaker {
  private userId: string | null = null;

  constructor(userId?: string) {
    this.userId = userId || null;
  }

  private getServiceKey(): string {
    // Include user_id in circuit breaker key for per-tenant isolation
    return this.userId ? `${CIRCUIT_BREAKER_KEY}_${this.userId}` : CIRCUIT_BREAKER_KEY;
  }

  private async getState(): Promise<CircuitBreakerState> {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('circuit_breaker_state')
        .select('*')
        .eq('service_key', this.getServiceKey())
        .single();

      if (error || !data) {
        return { failures: 0, lastFailureTime: null, isOpen: false };
      }

      return {
        failures: data.failures,
        lastFailureTime: data.last_failure_time,
        isOpen: data.is_open,
      };
    } catch {
      return { failures: 0, lastFailureTime: null, isOpen: false };
    }
  }

  private async setState(state: CircuitBreakerState): Promise<void> {
    const supabase = await createClient();

    try {
      await supabase
        .from('circuit_breaker_state')
        .upsert({
          service_key: this.getServiceKey(),
          failures: state.failures,
          last_failure_time: state.lastFailureTime,
          is_open: state.isOpen,
          updated_at: Date.now(),
        }, {
          onConflict: 'service_key',
        });
    } catch {
      // Silent failure
    }
  }

  async recordFailure(): Promise<void> {
    const state = await this.getState();
    state.failures++;
    state.lastFailureTime = Date.now();
    state.isOpen = state.failures >= THRESHOLD;
    await this.setState(state);
  }

  async recordSuccess(): Promise<void> {
    await this.setState({ failures: 0, lastFailureTime: null, isOpen: false });
  }

  async isOpen(): Promise<boolean> {
    const state = await this.getState();

    if (state.failures < THRESHOLD) {
      return false;
    }

    if (state.lastFailureTime && Date.now() - state.lastFailureTime > TIMEOUT) {
      // Reset after timeout
      await this.setState({ failures: 0, lastFailureTime: null, isOpen: false });
      return false;
    }

    return true;
  }
}

// Export factory function instead of singleton to allow per-user instances
export function getCircuitBreaker(userId?: string): PersistentCircuitBreaker {
  return new PersistentCircuitBreaker(userId);
}

// Global circuit breaker for system-wide protection (fallback)
export const persistentCircuitBreaker = new PersistentCircuitBreaker();
