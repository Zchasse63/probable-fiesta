import type { Anthropic } from '@anthropic-ai/sdk';

export const extractDealTool: Anthropic.Tool = {
  name: 'extract_deal',
  description: 'Extract structured deal information from manufacturer email or text',
  input_schema: {
    type: 'object',
    properties: {
      manufacturer: {
        type: 'string',
        description: 'Name of the manufacturer or supplier',
      },
      product_description: {
        type: 'string',
        description: 'Detailed product description',
      },
      price_per_lb: {
        type: 'number',
        description: 'Price per pound in USD',
      },
      quantity_lbs: {
        type: 'number',
        description: 'Total quantity available in pounds',
      },
      pack_size: {
        type: 'string',
        description: 'Pack size (e.g., "10/4 lb", "40 lb case")',
      },
      expiration_date: {
        type: 'string',
        description: 'Expiration or best-by date in ISO format (YYYY-MM-DD)',
      },
      deal_terms: {
        type: 'string',
        description: 'Special terms, conditions, or notes about the deal',
      },
    },
    required: [
      'manufacturer',
      'product_description',
      'price_per_lb',
      'quantity_lbs',
      'pack_size',
    ],
  },
};

export const normalizeAddressTool: Anthropic.Tool = {
  name: 'normalize_address',
  description: 'Normalize and standardize a postal address',
  input_schema: {
    type: 'object',
    properties: {
      street: {
        type: 'string',
        description: 'Standardized street address',
      },
      city: {
        type: 'string',
        description: 'City name',
      },
      state: {
        type: 'string',
        description: 'Two-letter state code (e.g., NY, CA)',
      },
      zip: {
        type: 'string',
        description: 'ZIP code (5 or 9 digits)',
      },
      country: {
        type: 'string',
        description: 'Country code (default: US)',
      },
    },
    required: ['street', 'city', 'state'],
  },
};

export const parsePackSizeTool: Anthropic.Tool = {
  name: 'parse_pack_size',
  description: 'Parse pack size string to extract case weight in pounds',
  input_schema: {
    type: 'object',
    properties: {
      case_weight_lbs: {
        type: 'number',
        description: 'Total weight of one case in pounds',
      },
    },
    required: ['case_weight_lbs'],
  },
};

export const categorizeProductTool: Anthropic.Tool = {
  name: 'categorize_product',
  description: 'Automatically categorize a frozen protein product',
  input_schema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Main product category (e.g., Chicken, Beef, Pork, Seafood)',
      },
      subcategory: {
        type: 'string',
        description: 'Product subcategory (e.g., Boneless/Skinless, Ground, Whole)',
      },
      is_frozen: {
        type: 'boolean',
        description: 'Whether the product is frozen',
      },
      is_raw: {
        type: 'boolean',
        description: 'Whether the product is raw (vs. cooked/processed)',
      },
    },
    required: ['category', 'subcategory', 'is_frozen', 'is_raw'],
  },
};

export const queryToFilterTool: Anthropic.Tool = {
  name: 'query_to_filter',
  description: 'Convert natural language search query to structured filters',
  input_schema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Product category filter',
      },
      price_min: {
        type: 'number',
        description: 'Minimum price per pound',
      },
      price_max: {
        type: 'number',
        description: 'Maximum price per pound',
      },
      warehouse_id: {
        type: 'string',
        description: 'Warehouse ID filter',
      },
      in_stock: {
        type: 'boolean',
        description: 'Filter for in-stock items only',
      },
      is_frozen: {
        type: 'boolean',
        description: 'Filter for frozen products',
      },
      search_term: {
        type: 'string',
        description: 'Text search term for product description',
      },
    },
    required: [],
  },
};
