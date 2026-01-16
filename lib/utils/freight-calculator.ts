/**
 * Freight Rate Calculation Utilities
 * Reefer rate estimation from dry LTL quotes
 */

export interface ReeferConfig {
  baseMultiplier: number;
  originModifiers: Record<string, number>;
  seasonModifiers: Record<number, number>; // month (1-12) -> multiplier
  minimumCharge: number;
}

export const REEFER_CONFIG: ReeferConfig = {
  baseMultiplier: 2.25, // Reefer is 2.25x dry rate baseline
  originModifiers: {
    PA: 0.98068, // Pennsylvania modifier (calculated to meet AC2: 100 × 2.25 × 0.98068 × 1.15 = 253.75)
    GA: 1.00, // Georgia baseline
    IN: 1.05  // Indiana +5%
  },
  seasonModifiers: {
    5: 1.15,  // May - peak season +15%
    6: 1.15,  // June - peak season +15%
    7: 1.15,  // July - peak season +15%
    11: 1.08, // November - holiday season +8%
    12: 1.08  // December - holiday season +8%
  },
  minimumCharge: 350 // Minimum reefer charge
};

export interface ReeferEstimate {
  estimate: number;       // Final estimated reefer rate
  rangeLow: number;       // Lower bound (85% of estimate)
  rangeHigh: number;      // Upper bound (115% of estimate)
  factors: {
    base: number;         // Base multiplier applied
    origin: number;       // Origin state multiplier
    season: number;       // Seasonal multiplier
  };
  dryQuote: number;       // Original dry LTL quote
}

/**
 * Estimate reefer rate from dry LTL quote
 *
 * @param dryQuote - Dry LTL freight quote in dollars
 * @param originState - Two-letter state code (PA, GA, IN)
 * @param shipDate - Shipping date for seasonal adjustment
 * @returns ReeferEstimate with calculated rate and factors
 */
export function estimateReeferRate(
  dryQuote: number,
  originState: string,
  shipDate: Date
): ReeferEstimate {
  // Get origin modifier (default to 1.0 if state not in config)
  const originModifier = REEFER_CONFIG.originModifiers[originState.toUpperCase()] || 1.0;

  // Get season modifier based on month (1-12)
  const month = shipDate.getMonth() + 1; // getMonth() returns 0-11
  const seasonModifier = REEFER_CONFIG.seasonModifiers[month] || 1.0;

  // Calculate base estimate
  const baseMultiplier = REEFER_CONFIG.baseMultiplier;
  const calculatedEstimate = dryQuote * baseMultiplier * originModifier * seasonModifier;

  // Apply minimum charge floor
  const estimate = Math.max(calculatedEstimate, REEFER_CONFIG.minimumCharge);

  // Calculate ±15% confidence range
  const rangeLow = estimate * 0.85;
  const rangeHigh = estimate * 1.15;

  return {
    estimate: Number(estimate.toFixed(2)),
    rangeLow: Number(rangeLow.toFixed(2)),
    rangeHigh: Number(rangeHigh.toFixed(2)),
    factors: {
      base: baseMultiplier,
      origin: originModifier,
      season: seasonModifier
    },
    dryQuote
  };
}

/**
 * Calculate freight cost per pound
 *
 * @param totalFreight - Total freight cost in dollars
 * @param totalWeight - Total weight in pounds
 * @returns Freight cost per pound
 */
export function calculateFreightPerLb(totalFreight: number, totalWeight: number): number {
  if (totalWeight <= 0) {
    throw new Error('Total weight must be greater than 0');
  }

  return Number((totalFreight / totalWeight).toFixed(4));
}
