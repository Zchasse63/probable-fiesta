/**
 * Mock AI responses for testing without ANTHROPIC_API_KEY
 */

export interface MockResponse {
  content: Record<string, unknown>;
  tokens_used: number;
}

export const mockDealExtraction: MockResponse = {
  content: {
    product_name: 'Boneless Skinless Chicken Breast',
    pack_size: '4x10lb',
    brand: 'Tyson Fresh',
    price_per_lb: 2.45,
    quantity_available: 500,
    valid_until: '2026-01-31',
    product_category: 'chicken',
    is_frozen: true,
    is_raw: true,
  },
  tokens_used: 850,
};

export const mockAddressNormalization: MockResponse = {
  content: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    corrections: ['Normalized street name capitalization', 'Expanded NYC to New York', 'Added default zip code'],
  },
  tokens_used: 420,
};

export const mockPackSizeParse: MockResponse = {
  content: {
    case_weight_lbs: 12.0,
    confidence: 0.95,
    interpretation: '2 dozen 8oz packages = 24 * 0.5 lbs = 12 lbs',
  },
  tokens_used: 280,
};

export const mockProductCategorization: MockResponse = {
  content: {
    category: 'chicken',
    subcategory: 'breast',
    is_frozen: true,
    is_raw: true,
    confidence: 0.92,
  },
  tokens_used: 310,
};

export const mockSearchQueryParse: MockResponse = {
  content: {
    filters: {
      category: 'chicken',
      price_max: 3.0,
      is_frozen: true,
    },
    explanation: 'Searching for frozen chicken products with price up to $3.00 per pound',
    confidence: 0.88,
  },
  tokens_used: 520,
};

/**
 * Generate mock response based on task type
 */
export function getMockResponse(taskType: string): MockResponse {
  switch (taskType) {
    case 'extract_deal':
      return mockDealExtraction;

    case 'normalize_address':
      return mockAddressNormalization;

    case 'parse_pack_size':
      return mockPackSizeParse;

    case 'categorize_product':
      return mockProductCategorization;

    case 'query_to_filter':
      return mockSearchQueryParse;

    default:
      return {
        content: { result: 'Mock response', note: 'This is a mock AI response for testing' },
        tokens_used: 200,
      };
  }
}

/**
 * Simulate AI processing delay
 */
export async function simulateAIDelay(minMs: number = 200, maxMs: number = 800): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, delay));
}
