/**
 * Pack Size Parser Utility
 * Parses pack size strings to calculate case weight in pounds
 * Phase 2: Database Schema & Core Data Management
 *
 * Supported formats:
 * - "6/5 LB" → 30 (6 units × 5 lbs)
 * - "4x10LB" → 40 (4 units × 10 lbs)
 * - "40 LB" → 40 (total weight)
 * - "6-5#" → 30 (6 units × 5 lbs)
 */

/**
 * Synchronous pack size parser (regex only, no AI fallback)
 * Use this when AI fallback is not needed or when in sync context
 */
export function parsePackSizeSync(packSize: string): number | null {
  if (!packSize) return null;

  // Normalize input: trim and uppercase
  const normalized = packSize.trim().toUpperCase();

  // Pattern 1: 6/5 LB (multiplier/weight format)
  const pattern1 = /(\d+)\/(\d+(?:\.\d+)?)\s*(?:LB|#)/i;
  const match1 = normalized.match(pattern1);
  if (match1) {
    const multiplier = parseInt(match1[1], 10);
    const weight = parseFloat(match1[2]);
    return multiplier * weight;
  }

  // Pattern 2: 4x10LB (count×weight format)
  const pattern2 = /(\d+)x(\d+(?:\.\d+)?)\s*(?:LB|#)/i;
  const match2 = normalized.match(pattern2);
  if (match2) {
    const count = parseInt(match2[1], 10);
    const weight = parseFloat(match2[2]);
    return count * weight;
  }

  // Pattern 3: 40 LB (total weight format)
  const pattern3 = /(\d+(?:\.\d+)?)\s*(?:LB|#)\s*(?:CS|CASE)?/i;
  const match3 = normalized.match(pattern3);
  if (match3) {
    return parseFloat(match3[1]);
  }

  // Pattern 4: 6-5# (multiplier-weight format)
  const pattern4 = /(\d+)-(\d+(?:\.\d+)?)#/i;
  const match4 = normalized.match(pattern4);
  if (match4) {
    const multiplier = parseInt(match4[1], 10);
    const weight = parseFloat(match4[2]);
    return multiplier * weight;
  }

  // No pattern matched - return null
  return null;
}

