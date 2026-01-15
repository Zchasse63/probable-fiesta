# Anthropic Claude SDK Setup Guide
## For Frozen Protein Pricing Platform

---

## 1. Installation

```bash
# Using npm
npm install @anthropic-ai/sdk

# Using yarn
yarn add @anthropic-ai/sdk

# Using pnpm
pnpm add @anthropic-ai/sdk
```

**TypeScript Support**: The SDK includes TypeScript types out of the box. No additional `@types` package needed.

---

## 2. Environment Configuration

### Get Your API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create account
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-`)

### Store the Key

**Local Development** - Create `.env.local` in project root:

```env
# .env.local
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Supabase Edge Functions** - Add to Supabase secrets:

```bash
# Using Supabase CLI
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Vercel Deployment** - Add in Vercel Dashboard:
- Project Settings → Environment Variables → Add `ANTHROPIC_API_KEY`

### Add to .gitignore

```gitignore
# .gitignore
.env.local
.env*.local
```

---

## 3. Basic Client Setup

### Create the Client Module

```typescript
// lib/anthropic/client.ts

import Anthropic from '@anthropic-ai/sdk';

// Initialize client - reads ANTHROPIC_API_KEY from environment automatically
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model constants for easy reference
export const MODELS = {
  // Fast & cheap - use for most tasks
  HAIKU: 'claude-3-5-haiku-20241022',
  
  // Balanced - use for complex reasoning
  SONNET: 'claude-sonnet-4-20250514',
  
  // Most capable - use sparingly
  OPUS: 'claude-opus-4-20250514',
} as const;

export { anthropic };
```

### Simple Text Completion

```typescript
// Basic usage example
import { anthropic, MODELS } from '@/lib/anthropic/client';

async function simpleCompletion(prompt: string) {
  const response = await anthropic.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  // Extract text from response
  const text = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
    
  return text;
}
```

---

## 4. Structured Output with Tools

The key feature for your platform: **guaranteed JSON schemas**.

### Define a Tool Schema

```typescript
// lib/anthropic/tools.ts

// Tool definition = your output schema
export const dealExtractionTool = {
  name: 'extract_deal',
  description: 'Extract deal information from manufacturer email',
  input_schema: {
    type: 'object' as const,
    properties: {
      product_description: { 
        type: 'string',
        description: 'Product name and details'
      },
      price_per_lb: { 
        type: 'number',
        description: 'Price per pound in dollars'
      },
      quantity_lbs: { 
        type: 'number',
        description: 'Total quantity available in pounds'
      },
      expiration_date: { 
        type: 'string',
        description: 'Best-by date in ISO format (YYYY-MM-DD)'
      },
      manufacturer: { 
        type: 'string',
        description: 'Manufacturer or brand name'
      },
      confidence: { 
        type: 'number',
        description: 'Extraction confidence 0-1'
      }
    },
    required: ['product_description', 'price_per_lb', 'confidence']
  }
};
```

### Use Tool for Guaranteed Structure

```typescript
// lib/anthropic/parsers.ts

import { anthropic, MODELS } from './client';
import { dealExtractionTool } from './tools';

// Return type matches your schema
interface DealExtraction {
  product_description: string;
  price_per_lb: number;
  quantity_lbs?: number;
  expiration_date?: string;
  manufacturer?: string;
  confidence: number;
}

export async function parseDealEmail(emailContent: string): Promise<DealExtraction> {
  const response = await anthropic.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 1024,
    
    // Provide the tool
    tools: [dealExtractionTool],
    
    // FORCE Claude to use this tool (key!)
    tool_choice: { type: 'tool', name: 'extract_deal' },
    
    messages: [
      {
        role: 'user',
        content: `Extract deal information from this email:\n\n${emailContent}`
      }
    ]
  });

  // Find the tool_use block in response
  const toolUse = response.content.find(block => block.type === 'tool_use');
  
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('No tool use in response');
  }

  // toolUse.input is guaranteed to match your schema
  return toolUse.input as DealExtraction;
}
```

### Why This Works

```
Without tool_choice:
  User: "Extract the price from this email..."
  Claude: "The price appears to be $1.85 per pound based on..."
  ❌ Unstructured text, needs parsing

With tool_choice:
  User: "Extract the price from this email..."
  Claude: { "price_per_lb": 1.85, "product_description": "...", ... }
  ✅ Guaranteed JSON matching your schema
```

---

## 5. Complete Parser Module

```typescript
// lib/anthropic/index.ts

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const tools = {
  extractDeal: {
    name: 'extract_deal',
    description: 'Extract manufacturer deal information',
    input_schema: {
      type: 'object' as const,
      properties: {
        product_description: { type: 'string' },
        price_per_lb: { type: 'number' },
        price_per_case: { type: 'number' },
        case_weight_lbs: { type: 'number' },
        quantity_lbs: { type: 'number' },
        expiration_date: { type: 'string' },
        manufacturer: { type: 'string' },
        warehouse_location: { type: 'string' },
        confidence: { type: 'number' }
      },
      required: ['product_description', 'confidence']
    }
  },

  normalizeAddress: {
    name: 'normalize_address',
    description: 'Normalize US address for geocoding',
    input_schema: {
      type: 'object' as const,
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string', description: '2-letter code' },
        zip: { type: 'string', description: '5-digit ZIP' },
        normalized_full: { type: 'string' },
        corrections: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number' }
      },
      required: ['city', 'state', 'zip', 'confidence']
    }
  },

  parsePackSize: {
    name: 'parse_pack_size',
    description: 'Parse pack size to get case weight in pounds',
    input_schema: {
      type: 'object' as const,
      properties: {
        case_weight_lbs: { type: 'number' },
        units_per_case: { type: 'number' },
        weight_per_unit: { type: 'number' },
        interpretation: { type: 'string' },
        confidence: { type: 'number' }
      },
      required: ['case_weight_lbs', 'confidence']
    }
  },

  categorizeProduct: {
    name: 'categorize_product',
    description: 'Categorize protein product',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { 
          type: 'string',
          enum: ['chicken', 'beef', 'pork', 'turkey', 'seafood', 'other']
        },
        subcategory: { type: 'string' },
        is_frozen: { type: 'boolean' },
        is_raw: { type: 'boolean' },
        confidence: { type: 'number' }
      },
      required: ['category', 'confidence']
    }
  },

  parseSearchQuery: {
    name: 'parse_search',
    description: 'Convert natural language to filters',
    input_schema: {
      type: 'object' as const,
      properties: {
        filters: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            max_price: { type: 'number' },
            min_price: { type: 'number' },
            warehouse: { type: 'string' },
            brand: { type: 'string' },
            search_text: { type: 'string' }
          }
        },
        explanation: { type: 'string' },
        confidence: { type: 'number' }
      },
      required: ['filters', 'confidence']
    }
  }
};

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

export async function parseDealEmail(content: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    tools: [tools.extractDeal],
    tool_choice: { type: 'tool', name: 'extract_deal' },
    messages: [{
      role: 'user',
      content: `Extract deal info. If price is per case, calculate per-lb using pack size.\n\n${content}`
    }]
  });

  const toolUse = response.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Extraction failed');
  
  return {
    ...toolUse.input,
    tokens: response.usage.input_tokens + response.usage.output_tokens
  };
}

export async function normalizeAddress(address: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 512,
    tools: [tools.normalizeAddress],
    tool_choice: { type: 'tool', name: 'normalize_address' },
    messages: [{
      role: 'user',
      content: `Normalize this US address. Fix typos, expand abbreviations:\n\n${address}`
    }]
  });

  const toolUse = response.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Normalization failed');
  
  return toolUse.input;
}

export async function parsePackSize(packSize: string, description?: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 256,
    tools: [tools.parsePackSize],
    tool_choice: { type: 'tool', name: 'parse_pack_size' },
    messages: [{
      role: 'user',
      content: `Parse pack size to total case weight in lbs.
      
Pack: "${packSize}"
${description ? `Product: "${description}"` : ''}

Examples: "6/5 LB" = 30 lbs, "4x10LB" = 40 lbs, "40 LB" = 40 lbs`
    }]
  });

  const toolUse = response.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Parse failed');
  
  return toolUse.input;
}

export async function categorizeProduct(description: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 256,
    tools: [tools.categorizeProduct],
    tool_choice: { type: 'tool', name: 'categorize_product' },
    messages: [{
      role: 'user',
      content: `Categorize this protein product:\n\n"${description}"`
    }]
  });

  const toolUse = response.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Categorization failed');
  
  return toolUse.input;
}

export async function parseSearchQuery(query: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 512,
    tools: [tools.parseSearchQuery],
    tool_choice: { type: 'tool', name: 'parse_search' },
    system: `Convert natural language to product filters.
Available: category (chicken/beef/pork/turkey/seafood), min_price, max_price, warehouse (PA/GA/IN), brand, search_text`,
    messages: [{
      role: 'user',
      content: query
    }]
  });

  const toolUse = response.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Query parse failed');
  
  return toolUse.input;
}
```

---

## 6. Next.js API Route Integration

```typescript
// app/api/ai/parse-deal/route.ts

import { NextResponse } from 'next/server';
import { parseDealEmail } from '@/lib/anthropic';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Parse with AI
    const parsed = await parseDealEmail(content);
    
    // Store in Supabase
    const supabase = createClient();
    const { data, error } = await supabase
      .from('manufacturer_deals')
      .insert({
        source_type: 'email',
        source_content: content,
        parsed_data: parsed,
        product_description: parsed.product_description,
        price_per_lb: parsed.price_per_lb,
        confidence_score: parsed.confidence,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, deal: data });
    
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse deal' },
      { status: 500 }
    );
  }
}
```

### Frontend Usage

```typescript
// components/DealUploader.tsx

async function handleDealSubmit(emailContent: string) {
  const response = await fetch('/api/ai/parse-deal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: emailContent })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Show parsed deal for review
    setDeal(result.deal);
  } else {
    setError(result.error);
  }
}
```

---

## 7. Supabase Edge Function (Alternative)

```typescript
// supabase/functions/parse-document/index.ts

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const dealTool = {
  name: 'extract_deal',
  description: 'Extract deal information',
  input_schema: {
    type: 'object',
    properties: {
      product_description: { type: 'string' },
      price_per_lb: { type: 'number' },
      confidence: { type: 'number' }
    },
    required: ['product_description', 'confidence']
  }
};

Deno.serve(async (req) => {
  const { content, type } = await req.json();
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    tools: [dealTool],
    tool_choice: { type: 'tool', name: 'extract_deal' },
    messages: [{ role: 'user', content }]
  });

  const toolUse = response.content.find(b => b.type === 'tool_use');
  const result = toolUse?.input || {};

  // Log usage
  await supabase.from('ai_processing_log').insert({
    task_type: type,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    success: true
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Deploy Edge Function

```bash
# Deploy
supabase functions deploy parse-document

# Set secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Test locally
supabase functions serve parse-document
```

---

## 8. Error Handling Best Practices

```typescript
// lib/anthropic/utils.ts

import Anthropic from '@anthropic-ai/sdk';

// Retry with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on auth errors
      if (error instanceof Anthropic.AuthenticationError) {
        throw error;
      }
      
      // Don't retry on bad request
      if (error instanceof Anthropic.BadRequestError) {
        throw error;
      }
      
      // Retry on rate limit with backoff
      if (error instanceof Anthropic.RateLimitError) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      // Retry on server errors
      if (error instanceof Anthropic.InternalServerError) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

// Usage
const result = await withRetry(() => parseDealEmail(content));
```

---

## 9. Cost Monitoring

```typescript
// lib/anthropic/usage.ts

interface UsageRecord {
  task: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

// Haiku pricing (as of 2025)
const PRICING = {
  'claude-3-5-haiku-20241022': {
    input: 1.00,   // $ per million tokens
    output: 5.00   // $ per million tokens
  }
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const prices = PRICING[model] || PRICING['claude-3-5-haiku-20241022'];
  
  const inputCost = (inputTokens / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;
  
  return inputCost + outputCost;
}

// Track usage in Supabase
export async function logUsage(
  supabase: any,
  task: string,
  response: Anthropic.Message
) {
  const cost = calculateCost(
    response.model,
    response.usage.input_tokens,
    response.usage.output_tokens
  );

  await supabase.from('ai_processing_log').insert({
    task_type: task,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    model: response.model,
    estimated_cost: cost,
    success: true
  });
}
```

---

## 10. File Structure

```
lib/
└── anthropic/
    ├── index.ts        # Main exports
    ├── client.ts       # Anthropic client setup
    ├── tools.ts        # Tool/schema definitions
    ├── parsers.ts      # Parsing functions
    └── utils.ts        # Retry, error handling

app/
└── api/
    └── ai/
        ├── parse-deal/
        │   └── route.ts
        ├── normalize-address/
        │   └── route.ts
        └── parse-search/
            └── route.ts

supabase/
└── functions/
    └── parse-document/
        └── index.ts    # Optional edge function
```

---

## Quick Reference

| Task | Function | Avg Tokens | Cost/Call |
|------|----------|------------|-----------|
| Parse deal email | `parseDealEmail()` | ~2,000 | ~$0.01 |
| Normalize address | `normalizeAddress()` | ~500 | ~$0.002 |
| Parse pack size | `parsePackSize()` | ~300 | ~$0.001 |
| Categorize product | `categorizeProduct()` | ~200 | ~$0.001 |
| Search query | `parseSearchQuery()` | ~400 | ~$0.002 |

**Estimated monthly cost**: $2-5 for typical usage

---

## Checklist

- [ ] Install SDK: `npm install @anthropic-ai/sdk`
- [ ] Get API key from console.anthropic.com
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Create `lib/anthropic/client.ts`
- [ ] Define tool schemas in `lib/anthropic/tools.ts`
- [ ] Create parsing functions in `lib/anthropic/parsers.ts`
- [ ] Add API routes in `app/api/ai/`
- [ ] Add `.env.local` to `.gitignore`
- [ ] Set up usage logging in Supabase
