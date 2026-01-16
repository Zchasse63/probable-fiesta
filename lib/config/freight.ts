/**
 * Freight Configuration
 * Centralized freight and reefer rate configuration
 * Phase 3: Pricing Engine & Freight Integration
 */

import { REEFER_CONFIG } from '@/lib/utils/freight-calculator';

/**
 * Default weight for LTL quotes (lbs)
 */
export const DEFAULT_WEIGHT_LBS = 7500;

/**
 * Default number of pallets for LTL quotes
 */
export const DEFAULT_PALLETS = 4;

/**
 * Freight class for frozen food products
 */
export const FREIGHT_CLASS = '70';

/**
 * Freight rate cache TTL in days
 */
export const CACHE_TTL_DAYS = 7;

/**
 * Default margin percentage for products
 */
export const DEFAULT_MARGIN_PERCENT = 15.0;

/**
 * Reefer rate configuration
 * Re-exported from freight-calculator for convenience
 */
export { REEFER_CONFIG };

/**
 * Get cache TTL from environment or default
 */
export function getCacheTTLDays(): number {
  const envTTL = process.env.NEXT_PUBLIC_FREIGHT_CACHE_TTL_DAYS;
  return envTTL ? parseInt(envTTL, 10) : CACHE_TTL_DAYS;
}

/**
 * Get default margin from environment or default
 */
export function getDefaultMargin(): number {
  const envMargin = process.env.NEXT_PUBLIC_DEFAULT_MARGIN_PERCENT;
  return envMargin ? parseFloat(envMargin) : DEFAULT_MARGIN_PERCENT;
}

/**
 * Get GoShip API key
 */
export function getGoShipAPIKey(): string {
  const apiKey = process.env.GOSHIP_API_KEY;

  if (!apiKey) {
    throw new Error('GOSHIP_API_KEY environment variable is not set');
  }

  return apiKey;
}
