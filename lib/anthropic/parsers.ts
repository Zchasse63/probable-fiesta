import { getAnthropicClient, MODELS, type ModelType, isTestMode } from './client';
import {
  extractDealTool,
  normalizeAddressTool,
  parsePackSizeTool,
  categorizeProductTool,
  queryToFilterTool,
} from './tools';
import { withRetry } from './utils';
import { persistentCircuitBreaker } from './circuit-breaker-persistent';
import { sanitizeTextInput, sanitizeAIOutput } from '@/lib/utils/input-sanitizer';
import { getMockResponse, simulateAIDelay } from './mocks';

export interface DealData {
  manufacturer: string;
  product_description: string;
  price_per_lb: number;
  quantity_lbs: number;
  pack_size: string;
  expiration_date?: string;
  deal_terms?: string;
}

// Validate numeric fields in DealData
function validateDealData(deal: DealData): { valid: boolean; error?: string } {
  if (
    typeof deal.price_per_lb !== 'number' ||
    isNaN(deal.price_per_lb) ||
    !isFinite(deal.price_per_lb) ||
    deal.price_per_lb <= 0 ||
    deal.price_per_lb > 10000
  ) {
    return {
      valid: false,
      error: 'price_per_lb must be a valid number between 0 and 10,000',
    };
  }

  if (
    typeof deal.quantity_lbs !== 'number' ||
    isNaN(deal.quantity_lbs) ||
    !isFinite(deal.quantity_lbs) ||
    deal.quantity_lbs <= 0 ||
    deal.quantity_lbs > 1000000
  ) {
    return {
      valid: false,
      error: 'quantity_lbs must be a valid number between 0 and 1,000,000',
    };
  }

  return { valid: true };
}

export interface ParsedDeal {
  deal: DealData;
  tokens_used: {
    input_tokens: number;
    output_tokens: number;
  };
  model: ModelType;
}

export async function parseDealEmail(content: string): Promise<ParsedDeal | null> {
  // Mock mode for testing without API key
  if (isTestMode()) {
    await simulateAIDelay();
    const mock = getMockResponse('extract_deal');
    return {
      deal: mock.content as unknown as DealData,
      tokens_used: { input_tokens: 500, output_tokens: mock.tokens_used },
      model: MODELS.SONNET,
    };
  }

  if (await persistentCircuitBreaker.isOpen()) {
    throw new Error('Service temporarily unavailable');
  }

  try {
    const client = getAnthropicClient();

    // Sanitize input to prevent prompt injection
    const sanitizedContent = sanitizeTextInput(content, 20000);

    const result = await withRetry(async () => {
      return await client.messages.create({
        model: MODELS.SONNET,
        max_tokens: 1024,
        tools: [extractDealTool],
        tool_choice: { type: 'tool', name: 'extract_deal' },
        messages: [
          {
            role: 'user',
            content: `Extract deal information from this email or message:\n\n${sanitizedContent}`,
          },
        ],
      });
    });

    const toolUse = result.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      await persistentCircuitBreaker.recordFailure();
      return null;
    }

    await persistentCircuitBreaker.recordSuccess();

    // Sanitize AI-generated output to prevent XSS/injection
    const sanitizedDeal = sanitizeAIOutput(toolUse.input as Record<string, unknown>) as unknown as DealData;

    // Validate numeric bounds
    const validation = validateDealData(sanitizedDeal);
    if (!validation.valid) {
      await persistentCircuitBreaker.recordFailure();
      throw new Error(`Deal validation failed: ${validation.error}`);
    }

    return {
      deal: sanitizedDeal,
      tokens_used: {
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      },
      model: MODELS.SONNET,
    };
  } catch (error) {
    await persistentCircuitBreaker.recordFailure();
    return null;
  }
}

export interface NormalizedAddress {
  street: string;
  city: string;
  state: string;
  zip?: string;
  country?: string;
}

export interface AddressNormalizationResult {
  normalized: NormalizedAddress;
  corrections: string[];
  tokens_used: {
    input_tokens: number;
    output_tokens: number;
  };
  model: ModelType;
}

export async function normalizeAddress(
  address: string
): Promise<AddressNormalizationResult | null> {
  // Mock mode for testing without API key
  if (isTestMode()) {
    await simulateAIDelay();
    const mock = getMockResponse('normalize_address');
    return {
      ...mock.content,
      tokens_used: { input_tokens: 100, output_tokens: mock.tokens_used },
      model: MODELS.HAIKU,
    } as AddressNormalizationResult;
  }

  if (await persistentCircuitBreaker.isOpen()) {
    throw new Error('Service temporarily unavailable');
  }

  try {
    const client = getAnthropicClient();

    // Sanitize input to prevent prompt injection
    const sanitizedAddress = sanitizeTextInput(address, 500);

    const result = await withRetry(async () => {
      return await client.messages.create({
        model: MODELS.HAIKU,
        max_tokens: 512,
        tools: [normalizeAddressTool],
        tool_choice: { type: 'tool', name: 'normalize_address' },
        messages: [
          {
            role: 'user',
            content: `Normalize this address to standard USPS format:\n\n${sanitizedAddress}`,
          },
        ],
      });
    });

    const toolUse = result.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      await persistentCircuitBreaker.recordFailure();
      return null;
    }

    await persistentCircuitBreaker.recordSuccess();

    // Sanitize AI-generated output
    const normalized = sanitizeAIOutput(toolUse.input as Record<string, unknown>) as unknown as NormalizedAddress;
    const corrections: string[] = [];

    // Generate corrections summary
    const original = address.toLowerCase();
    if (!original.includes(normalized.street.toLowerCase())) {
      corrections.push(`Street: "${normalized.street}"`);
    }
    if (!original.includes(normalized.city.toLowerCase())) {
      corrections.push(`City: "${normalized.city}"`);
    }
    if (!original.includes(normalized.state.toLowerCase())) {
      corrections.push(`State: "${normalized.state}"`);
    }

    return {
      normalized,
      corrections,
      tokens_used: {
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      },
      model: MODELS.HAIKU,
    };
  } catch (error) {
    await persistentCircuitBreaker.recordFailure();
    return null;
  }
}

export interface PackSizeResult {
  case_weight_lbs: number;
  tokens_used: {
    input_tokens: number;
    output_tokens: number;
  };
  model: ModelType;
}

// Validate pack size result
function validatePackSizeResult(result: { case_weight_lbs: number }): { valid: boolean; error?: string } {
  if (
    typeof result.case_weight_lbs !== 'number' ||
    isNaN(result.case_weight_lbs) ||
    !isFinite(result.case_weight_lbs) ||
    result.case_weight_lbs <= 0 ||
    result.case_weight_lbs > 10000
  ) {
    return {
      valid: false,
      error: 'case_weight_lbs must be a valid number between 0 and 10,000',
    };
  }
  return { valid: true };
}

export async function parsePackSize(
  packSize: string,
  description?: string
): Promise<PackSizeResult | null> {
  // Mock mode for testing without API key
  if (isTestMode()) {
    await simulateAIDelay();
    const mock = getMockResponse('parse_pack_size');
    return {
      case_weight_lbs: mock.content.case_weight_lbs as number,
      tokens_used: { input_tokens: 80, output_tokens: mock.tokens_used },
      model: MODELS.HAIKU,
    };
  }

  if (await persistentCircuitBreaker.isOpen()) {
    throw new Error('Service temporarily unavailable');
  }

  try {
    const client = getAnthropicClient();

    // Sanitize both inputs separately to prevent injection
    const sanitizedPackSize = sanitizeTextInput(packSize, 200);
    const sanitizedDescription = description ? sanitizeTextInput(description, 500) : '';

    const prompt = sanitizedDescription
      ? `Parse the pack size to determine case weight in pounds.\nPack size: ${sanitizedPackSize}\nProduct description: ${sanitizedDescription}`
      : `Parse the pack size to determine case weight in pounds.\nPack size: ${sanitizedPackSize}`;

    const result = await withRetry(async () => {
      return await client.messages.create({
        model: MODELS.HAIKU,
        max_tokens: 256,
        tools: [parsePackSizeTool],
        tool_choice: { type: 'tool', name: 'parse_pack_size' },
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });
    });

    const toolUse = result.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      await persistentCircuitBreaker.recordFailure();
      return null;
    }

    await persistentCircuitBreaker.recordSuccess();

    // Sanitize AI-generated output
    const parsed = sanitizeAIOutput(toolUse.input as Record<string, unknown>) as unknown as { case_weight_lbs: number };

    // Validate numeric bounds
    const validation = validatePackSizeResult(parsed);
    if (!validation.valid) {
      await persistentCircuitBreaker.recordFailure();
      throw new Error(`Pack size validation failed: ${validation.error}`);
    }

    return {
      case_weight_lbs: parsed.case_weight_lbs,
      tokens_used: {
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      },
      model: MODELS.HAIKU,
    };
  } catch (error) {
    await persistentCircuitBreaker.recordFailure();
    return null;
  }
}

export interface ProductCategory {
  category: string;
  subcategory: string;
  is_frozen: boolean;
  is_raw: boolean;
}

export interface CategorizationResult {
  category: ProductCategory;
  tokens_used: {
    input_tokens: number;
    output_tokens: number;
  };
  model: ModelType;
}

export async function categorizeProduct(
  description: string
): Promise<CategorizationResult | null> {
  // Mock mode for testing without API key
  if (isTestMode()) {
    await simulateAIDelay();
    const mock = getMockResponse('categorize_product');
    return {
      category: mock.content as unknown as ProductCategory,
      tokens_used: { input_tokens: 90, output_tokens: mock.tokens_used },
      model: MODELS.HAIKU,
    };
  }

  if (await persistentCircuitBreaker.isOpen()) {
    throw new Error('Service temporarily unavailable');
  }

  try {
    const client = getAnthropicClient();

    // Sanitize input to prevent prompt injection
    const sanitizedDescription = sanitizeTextInput(description, 5000);

    const result = await withRetry(async () => {
      return await client.messages.create({
        model: MODELS.HAIKU,
        max_tokens: 256,
        tools: [categorizeProductTool],
        tool_choice: { type: 'tool', name: 'categorize_product' },
        messages: [
          {
            role: 'user',
            content: `Categorize this frozen protein product:\n\n${sanitizedDescription}`,
          },
        ],
      });
    });

    const toolUse = result.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      await persistentCircuitBreaker.recordFailure();
      return null;
    }

    await persistentCircuitBreaker.recordSuccess();

    // Sanitize AI-generated output
    const sanitizedCategory = sanitizeAIOutput(toolUse.input as Record<string, unknown>) as unknown as ProductCategory;

    return {
      category: sanitizedCategory,
      tokens_used: {
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      },
      model: MODELS.HAIKU,
    };
  } catch (error) {
    await persistentCircuitBreaker.recordFailure();
    return null;
  }
}

export interface SearchFilters {
  category?: string;
  price_min?: number;
  price_max?: number;
  warehouse_id?: string;
  in_stock?: boolean;
  is_frozen?: boolean;
  search_term?: string;
}

export interface SearchQueryResult {
  filters: SearchFilters;
  explanation: string;
  tokens_used: {
    input_tokens: number;
    output_tokens: number;
  };
  model: ModelType;
}

export async function parseSearchQuery(
  query: string
): Promise<SearchQueryResult | null> {
  // Mock mode for testing without API key
  if (isTestMode()) {
    await simulateAIDelay();
    const mock = getMockResponse('query_to_filter');
    return {
      filters: mock.content.filters as SearchFilters,
      explanation: mock.content.explanation as string,
      tokens_used: { input_tokens: 120, output_tokens: mock.tokens_used },
      model: MODELS.HAIKU,
    };
  }

  if (await persistentCircuitBreaker.isOpen()) {
    throw new Error('Service temporarily unavailable');
  }

  try {
    const client = getAnthropicClient();

    // Sanitize input to prevent prompt injection
    const sanitizedQuery = sanitizeTextInput(query, 500);

    const result = await withRetry(async () => {
      return await client.messages.create({
        model: MODELS.HAIKU,
        max_tokens: 512,
        tools: [queryToFilterTool],
        tool_choice: { type: 'tool', name: 'query_to_filter' },
        messages: [
          {
            role: 'user',
            content: `Convert this natural language search to structured filters:\n\n"${sanitizedQuery}"`,
          },
        ],
      });
    });

    const toolUse = result.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      await persistentCircuitBreaker.recordFailure();
      return null;
    }

    const textBlock = result.content.find((block) => block.type === 'text');
    const rawExplanation =
      textBlock && textBlock.type === 'text' ? textBlock.text : 'Filters applied';

    await persistentCircuitBreaker.recordSuccess();

    // Sanitize AI-generated output including explanation text
    const sanitizedFilters = sanitizeAIOutput(toolUse.input as Record<string, unknown>) as unknown as SearchFilters;
    const sanitizedExplanation = sanitizeTextInput(rawExplanation, 500);

    // Validate numeric filters (price_min, price_max)
    if (sanitizedFilters.price_min !== undefined) {
      if (
        typeof sanitizedFilters.price_min !== 'number' ||
        !Number.isFinite(sanitizedFilters.price_min) ||
        sanitizedFilters.price_min < 0
      ) {
        delete sanitizedFilters.price_min;
      }
    }
    if (sanitizedFilters.price_max !== undefined) {
      if (
        typeof sanitizedFilters.price_max !== 'number' ||
        !Number.isFinite(sanitizedFilters.price_max) ||
        sanitizedFilters.price_max < 0
      ) {
        delete sanitizedFilters.price_max;
      }
    }

    // Validate warehouse_id is valid UUID format if present
    if (sanitizedFilters.warehouse_id !== undefined) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (
        typeof sanitizedFilters.warehouse_id !== 'string' ||
        !uuidRegex.test(sanitizedFilters.warehouse_id)
      ) {
        delete sanitizedFilters.warehouse_id;
      }
    }

    // Ensure search_term is sanitized string (already sanitized by sanitizeAIOutput)
    if (sanitizedFilters.search_term !== undefined && typeof sanitizedFilters.search_term !== 'string') {
      delete sanitizedFilters.search_term;
    }

    return {
      filters: sanitizedFilters,
      explanation: sanitizedExplanation,
      tokens_used: {
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
      },
      model: MODELS.HAIKU,
    };
  } catch (error) {
    await persistentCircuitBreaker.recordFailure();
    return null;
  }
}
