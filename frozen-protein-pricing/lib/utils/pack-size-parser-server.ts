/**
 * Server-side Pack Size Parser with AI Fallback
 * Phase 5: AI Integration
 *
 * This module is for SERVER-SIDE ONLY (API routes, server components).
 * Do NOT import from client components - use parsePackSizeSync from pack-size-parser.ts instead.
 */

import { parsePackSize as parsePackSizeAI } from '@/lib/anthropic/parsers';
import { parsePackSizeSync } from './pack-size-parser';

/**
 * Parse pack size with AI fallback for non-standard formats
 * SERVER-SIDE ONLY - Uses Anthropic API
 *
 * @param packSize - Pack size string
 * @param description - Optional product description for context
 * @returns Case weight in pounds, or null if unparseable
 */
export async function parsePackSize(packSize: string, description?: string): Promise<number | null> {
  // Try regex parsing first
  const regexResult = parsePackSizeSync(packSize);
  if (regexResult !== null) {
    return regexResult;
  }

  // Fall back to AI parsing
  try {
    const aiResult = await parsePackSizeAI(packSize, description);
    return aiResult?.case_weight_lbs || null;
  } catch (error) {
    // AI parsing failed, return null
    return null;
  }
}
