/**
 * GoShip GraphQL Client
 * Native fetch-based implementation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { GoShipAPIError, LtlQuoteResponse } from './types';

const GOSHIP_ENDPOINT = 'https://nautilus.goship.com/broker/graphql';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // ms

interface GoShipClientConfig {
  apiKey: string;
  endpoint?: string;
  timeout?: number;
  debug?: boolean;
}

export class GoShipClient {
  private apiKey: string;
  private endpoint: string;
  private timeout: number;
  private debug: boolean;

  constructor(config: GoShipClientConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || GOSHIP_ENDPOINT;
    this.timeout = config.timeout || 30000;
    this.debug = config.debug || false;
  }

  /**
   * Execute GraphQL query with retry logic
   */
  async query<T = any>(query: string, variables?: any): Promise<T> {
    const body = JSON.stringify({
      query,
      variables
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GoShip-API-Key': this.apiKey,
            'Accept': 'application/json'
          },
          body,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          throw new GoShipAPIError(
            `GoShip API request failed: ${response.status} ${response.statusText}`,
            'HTTP_ERROR',
            response.status
          );
        }

        const json: LtlQuoteResponse = await response.json();

        // Handle GraphQL errors
        if (json.errors && json.errors.length > 0) {
          const error = json.errors[0];
          throw new GoShipAPIError(
            error.message,
            error.extensions?.code,
            undefined,
            json.errors
          );
        }

        return json as T;
      } catch (error: any) {
        lastError = error;

        // Don't retry on validation errors or auth errors
        if (error instanceof GoShipAPIError) {
          if (error.statusCode === 400 || error.statusCode === 401 || error.statusCode === 403) {
            throw error;
          }
        }

        // Don't retry on abort (timeout)
        if (error.name === 'AbortError') {
          throw new GoShipAPIError(
            'GoShip API request timed out',
            'TIMEOUT',
            408
          );
        }

        // Exponential backoff for retries
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new GoShipAPIError(
      `GoShip API request failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
      'MAX_RETRIES_EXCEEDED',
      500
    );
  }
}

/**
 * Create GoShip client instance
 */
export function createGoShipClient(apiKey?: string, debug?: boolean): GoShipClient {
  const key = apiKey || process.env.GOSHIP_API_KEY;

  if (!key) {
    throw new Error('GOSHIP_API_KEY environment variable is required');
  }

  return new GoShipClient({
    apiKey: key,
    debug: debug || process.env.NODE_ENV === 'development'
  });
}
