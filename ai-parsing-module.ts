/**
 * AI Parsing Module for Frozen Protein Pricing Platform
 * 
 * Uses Anthropic Claude API with tool-based structured output
 * to guarantee type-safe JSON responses.
 */

import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// CLIENT SETUP
// =============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model selection - Haiku for cost efficiency, Sonnet for complex tasks
const MODELS = {
  fast: 'claude-3-5-haiku-20241022',    // ~$1/MTok in, $5/MTok out
  accurate: 'claude-sonnet-4-20250514',  // ~$3/MTok in, $15/MTok out
};

// =============================================================================
// TOOL DEFINITIONS (Schemas for structured output)
// =============================================================================

const tools = {
  // Deal email extraction
  extractDeal: {
    name: 'extract_deal',
    description: 'Extract manufacturer deal information from email or document text',
    input_schema: {
      type: 'object' as const,
      properties: {
        product_description: { 
          type: 'string',
          description: 'Full product name/description'
        },
        price_per_lb: { 
          type: 'number',
          description: 'Price per pound (calculate from case price if needed)'
        },
        price_per_case: {
          type: 'number',
          description: 'Price per case if provided'
        },
        case_weight_lbs: {
          type: 'number',
          description: 'Weight per case in pounds'
        },
        quantity_available_lbs: { 
          type: 'number',
          description: 'Total quantity available in pounds'
        },
        quantity_available_cases: {
          type: 'number',
          description: 'Total quantity available in cases'
        },
        expiration_date: { 
          type: 'string',
          description: 'Expiration or sell-by date (ISO format YYYY-MM-DD)'
        },
        manufacturer: { 
          type: 'string',
          description: 'Manufacturer or brand name'
        },
        warehouse_location: {
          type: 'string',
          description: 'Pickup location if mentioned'
        },
        notes: {
          type: 'string',
          description: 'Any other relevant details'
        },
        confidence: { 
          type: 'number',
          description: 'Confidence score 0-1 for extraction accuracy'
        }
      },
      required: ['product_description', 'confidence']
    }
  },

  // Address normalization
  normalizeAddress: {
    name: 'normalize_address',
    description: 'Normalize and validate a US address for geocoding',
    input_schema: {
      type: 'object' as const,
      properties: {
        normalized_address: {
          type: 'string',
          description: 'Full normalized address on single line'
        },
        street: {
          type: 'string',
          description: 'Street address'
        },
        city: {
          type: 'string',
          description: 'City name'
        },
        state: {
          type: 'string',
          description: 'Two-letter state code'
        },
        zip: {
          type: 'string',
          description: 'Five-digit ZIP code'
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-1'
        },
        corrections_made: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of corrections or normalizations applied'
        }
      },
      required: ['normalized_address', 'city', 'state', 'zip', 'confidence']
    }
  },

  // Pack size parsing
  parsePackSize: {
    name: 'parse_pack_size',
    description: 'Parse pack size string to extract case weight in pounds',
    input_schema: {
      type: 'object' as const,
      properties: {
        case_weight_lbs: {
          type: 'number',
          description: 'Total weight per case in pounds'
        },
        units_per_case: {
          type: 'number',
          description: 'Number of units/bags/pieces per case'
        },
        weight_per_unit_lbs: {
          type: 'number',
          description: 'Weight of each unit in pounds'
        },
        original_format: {
          type: 'string',
          description: 'The original pack size string'
        },
        interpretation: {
          type: 'string',
          description: 'Human-readable interpretation'
        },
        confidence: {
          type: 'number',
          description: 'Confidence score 0-1'
        }
      },
      required: ['case_weight_lbs', 'confidence']
    }
  },

  // Product categorization
  categorizeProduct: {
    name: 'categorize_product',
    description: 'Categorize a protein product based on description',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['chicken', 'beef', 'pork', 'turkey', 'seafood', 'other'],
          description: 'Primary protein category'
        },
        subcategory: {
          type: 'string',
          description: 'Specific cut or type (breast, thigh, ground, loin, etc.)'
        },
        is_frozen: {
          type: 'boolean',
          description: 'Whether product is frozen'
        },
        is_raw: {
          type: 'boolean',
          description: 'Whether product is raw vs cooked/processed'
        },
        confidence: {
          type: 'number'
        }
      },
      required: ['category', 'confidence']
    }
  },

  // Natural language query to SQL
  queryToFilter: {
    name: 'query_to_filter',
    description: 'Convert natural language search to database filter',
    input_schema: {
      type: 'object' as const,
      properties: {
        filters: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            max_price_per_lb: { type: 'number' },
            min_price_per_lb: { type: 'number' },
            warehouse_code: { type: 'string' },
            brand: { type: 'string' },
            search_text: { type: 'string' }
          },
          description: 'Filter criteria extracted from query'
        },
        explanation: {
          type: 'string',
          description: 'Human-readable explanation of the filter'
        },
        confidence: {
          type: 'number'
        }
      },
      required: ['filters', 'explanation', 'confidence']
    }
  }
};

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

/**
 * Parse a manufacturer deal email and extract structured data
 */
export async function parseDealEmail(emailContent: string) {
  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 1024,
    tools: [tools.extractDeal],
    tool_choice: { type: 'tool', name: 'extract_deal' },
    messages: [
      {
        role: 'user',
        content: `Extract deal information from this manufacturer email. 
If a price is given per case, calculate the price per pound using the pack size.
If quantities are in cases, also calculate pounds if pack size is known.

Email content:
---
${emailContent}
---`
      }
    ]
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Failed to extract deal information');
  }

  return {
    ...toolUse.input,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    model: MODELS.fast
  };
}

/**
 * Normalize a raw address for geocoding
 */
export async function normalizeAddress(rawAddress: string) {
  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 512,
    tools: [tools.normalizeAddress],
    tool_choice: { type: 'tool', name: 'normalize_address' },
    messages: [
      {
        role: 'user',
        content: `Normalize this US address for geocoding. Fix any typos, expand abbreviations, and standardize format.

Raw address: ${rawAddress}`
      }
    ]
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Failed to normalize address');
  }

  return {
    ...toolUse.input,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens
  };
}

/**
 * Parse a pack size string to extract case weight
 * Used as fallback when regex parsing fails
 */
export async function parsePackSize(packSize: string, productDescription?: string) {
  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 256,
    tools: [tools.parsePackSize],
    tool_choice: { type: 'tool', name: 'parse_pack_size' },
    messages: [
      {
        role: 'user',
        content: `Parse this pack size to determine the total case weight in pounds.

Pack size: "${packSize}"
${productDescription ? `Product: "${productDescription}"` : ''}

Common formats:
- "6/5 LB" = 6 units × 5 lbs = 30 lbs per case
- "4x10LB" = 4 units × 10 lbs = 40 lbs per case  
- "40 LB" = 40 lbs per case
- "6-5#" = 6 units × 5 lbs = 30 lbs per case`
      }
    ]
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Failed to parse pack size');
  }

  return {
    ...toolUse.input,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens
  };
}

/**
 * Categorize a product based on its description
 */
export async function categorizeProduct(description: string) {
  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 256,
    tools: [tools.categorizeProduct],
    tool_choice: { type: 'tool', name: 'categorize_product' },
    messages: [
      {
        role: 'user',
        content: `Categorize this protein product:

"${description}"`
      }
    ]
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Failed to categorize product');
  }

  return {
    ...toolUse.input,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens
  };
}

/**
 * Convert natural language search to database filter
 */
export async function parseSearchQuery(query: string) {
  const response = await anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 512,
    tools: [tools.queryToFilter],
    tool_choice: { type: 'tool', name: 'query_to_filter' },
    system: `You help convert natural language queries into database filters for a frozen protein inventory system.

Available filters:
- category: chicken, beef, pork, turkey, seafood, other
- max_price_per_lb / min_price_per_lb: decimal numbers
- warehouse_code: PA, GA, IN, CA
- brand: manufacturer/brand name
- search_text: text to search in product descriptions`,
    messages: [
      {
        role: 'user',
        content: query
      }
    ]
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Failed to parse search query');
  }

  return {
    ...toolUse.input,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens
  };
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process multiple items with rate limiting
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: { concurrency?: number; delayMs?: number } = {}
) {
  const { concurrency = 3, delayMs = 100 } = options;
  const results: R[] = [];
  const errors: { index: number; error: Error }[] = [];

  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    
    const batchResults = await Promise.allSettled(
      batch.map((item, batchIndex) => processor(item))
    );

    batchResults.forEach((result, batchIndex) => {
      const actualIndex = i + batchIndex;
      if (result.status === 'fulfilled') {
        results[actualIndex] = result.value;
      } else {
        errors.push({ index: actualIndex, error: result.reason });
      }
    });

    // Rate limiting delay between batches
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { results, errors };
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

interface UsageLog {
  task_type: string;
  tokens_used: number;
  model: string;
  success: boolean;
  latency_ms: number;
}

const usageLogs: UsageLog[] = [];

export function trackUsage(log: UsageLog) {
  usageLogs.push(log);
}

export function getUsageSummary() {
  const totalTokens = usageLogs.reduce((sum, log) => sum + log.tokens_used, 0);
  const byTask = usageLogs.reduce((acc, log) => {
    acc[log.task_type] = (acc[log.task_type] || 0) + log.tokens_used;
    return acc;
  }, {} as Record<string, number>);

  // Estimate cost (Haiku pricing)
  const estimatedCost = totalTokens * 0.000003; // ~$3 per MTok average

  return {
    totalTokens,
    byTask,
    estimatedCost,
    callCount: usageLogs.length
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { anthropic, MODELS, tools };
