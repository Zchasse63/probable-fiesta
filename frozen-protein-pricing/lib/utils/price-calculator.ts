/**
 * Price Calculation Utilities
 * Delivered price calculations per pricing spec
 */

export interface DeliveredPrice {
  costPerLb: number;      // Base cost per pound
  marginAmount: number;   // Margin amount in $/lb
  freightPerLb: number;   // Freight cost per pound
  total: number;          // Total delivered price per pound
}

/**
 * Calculate cost per pound from unit cost and case weight
 *
 * @param unitCost - Cost per case/unit in dollars
 * @param caseWeight - Weight per case in pounds
 * @returns Cost per pound
 */
export function calculateCostPerLb(unitCost: number, caseWeight: number): number {
  if (caseWeight <= 0) {
    throw new Error('Case weight must be greater than 0');
  }

  return parseFloat((unitCost / caseWeight).toFixed(4));
}

/**
 * Calculate margin amount from cost per pound and margin percentage
 *
 * @param costPerLb - Cost per pound in dollars
 * @param marginPercent - Margin percentage (e.g., 15.00 for 15%)
 * @returns Margin amount in $/lb
 */
export function calculateMarginAmount(costPerLb: number, marginPercent: number): number {
  if (marginPercent < 0 || marginPercent > 100) {
    throw new Error('Margin percent must be between 0 and 100');
  }

  return parseFloat((costPerLb * (marginPercent / 100)).toFixed(4));
}

/**
 * Calculate delivered price per pound
 * Formula: cost_per_lb + margin_amount + freight_per_lb
 *
 * @param costPerLb - Base cost per pound
 * @param marginPercent - Margin percentage (e.g., 15.00 for 15%)
 * @param freightPerLb - Freight cost per pound
 * @returns DeliveredPrice breakdown
 */
export function calculateDeliveredPrice(
  costPerLb: number,
  marginPercent: number,
  freightPerLb: number
): DeliveredPrice {
  const marginAmount = calculateMarginAmount(costPerLb, marginPercent);
  const total = costPerLb + marginAmount + freightPerLb;

  return {
    costPerLb: Number(costPerLb.toFixed(4)),
    marginAmount: Number(marginAmount.toFixed(4)),
    freightPerLb: Number(freightPerLb.toFixed(4)),
    total: Number(total.toFixed(4))
  };
}

/**
 * Calculate total case price from per-pound price
 *
 * @param pricePerLb - Price per pound
 * @param caseWeight - Weight per case in pounds
 * @returns Total case price
 */
export function calculateCasePrice(pricePerLb: number, caseWeight: number): number {
  return Number((pricePerLb * caseWeight).toFixed(2));
}
