/**
 * AI Integration Examples
 * 
 * Shows how the AI parsing module integrates into the application workflow
 */

import {
  parseDealEmail,
  normalizeAddress,
  parsePackSize,
  categorizeProduct,
  parseSearchQuery,
  batchProcess
} from './ai-parsing-module';

// =============================================================================
// EXAMPLE 1: Deal Email Processing
// =============================================================================

async function handleDealEmailUpload() {
  const emailContent = `
    From: sales@tysonfoodservice.com
    Subject: HOT DEAL - Bone-In Chicken Thighs
    
    Good morning,
    
    We have an excess inventory situation and need to move product quickly:
    
    Product: Bone-In Chicken Thighs, IQF
    Pack: 6/5 LB bags
    Price: $45.00 per case ($1.50/lb)
    Quantity Available: 500 cases
    Best By: 03/15/2026
    
    Pickup from our Americus, GA facility.
    
    Let me know if interested!
    
    Best,
    Mike Thompson
    Tyson Food Service
  `;

  const result = await parseDealEmail(emailContent);
  
  console.log('Parsed Deal:', result);
  // Output:
  // {
  //   product_description: "Bone-In Chicken Thighs, IQF",
  //   price_per_lb: 1.50,
  //   price_per_case: 45.00,
  //   case_weight_lbs: 30,
  //   quantity_available_cases: 500,
  //   quantity_available_lbs: 15000,
  //   expiration_date: "2026-03-15",
  //   manufacturer: "Tyson Food Service",
  //   warehouse_location: "Americus, GA",
  //   confidence: 0.95,
  //   tokens_used: 847
  // }

  // Store in Supabase
  // await supabase.from('manufacturer_deals').insert({
  //   source_type: 'email',
  //   source_content: emailContent,
  //   parsed_data: result,
  //   ...result
  // });
}

// =============================================================================
// EXAMPLE 2: Customer Import with Address Normalization
// =============================================================================

async function importCustomersWithAI(rawCustomers: any[]) {
  // Batch process addresses through AI normalization
  const { results, errors } = await batchProcess(
    rawCustomers,
    async (customer) => {
      const rawAddress = `${customer.address}, ${customer.city}, ${customer.state} ${customer.zip}`;
      const normalized = await normalizeAddress(rawAddress);
      
      return {
        ...customer,
        normalized_address: normalized.normalized_address,
        city: normalized.city,
        state: normalized.state,
        zip: normalized.zip,
        address_confidence: normalized.confidence,
        corrections: normalized.corrections_made
      };
    },
    { concurrency: 5, delayMs: 200 } // Rate limiting
  );

  console.log(`Processed ${results.length} customers, ${errors.length} errors`);
  
  // Example input:
  // { address: "123 Main St", city: "Jacksonvile", state: "fl", zip: "32202" }
  
  // Example output after AI:
  // {
  //   normalized_address: "123 Main Street, Jacksonville, FL 32202",
  //   city: "Jacksonville",
  //   state: "FL", 
  //   zip: "32202",
  //   address_confidence: 0.92,
  //   corrections: ["Fixed city spelling: Jacksonvile → Jacksonville", "Normalized state: fl → FL"]
  // }

  return results;
}

// =============================================================================
// EXAMPLE 3: Inventory Upload with Pack Size Fallback
// =============================================================================

// Traditional regex parser (fast, free)
function parsePackSizeRegex(packSize: string): number | null {
  const patterns = [
    /(\d+)\/(\d+(?:\.\d+)?)\s*(?:LB|#)/i,     // "6/5 LB" → 30
    /(\d+)x(\d+(?:\.\d+)?)\s*(?:LB|#)/i,      // "4x10 LB" → 40
    /(\d+)\s*(?:LB|#)\s*(?:CS|CASE)?$/i,      // "40 LB" → 40
    /(\d+)-(\d+)#/i,                           // "6-5#" → 30
  ];

  for (const pattern of patterns) {
    const match = packSize.match(pattern);
    if (match) {
      if (match[2]) {
        return parseFloat(match[1]) * parseFloat(match[2]);
      }
      return parseFloat(match[1]);
    }
  }
  return null;
}

async function processInventoryRow(row: any) {
  // Try regex first (fast, free)
  let caseWeight = parsePackSizeRegex(row.pack_size);
  let parseMethod = 'regex';

  // Fallback to AI for edge cases
  if (caseWeight === null) {
    try {
      const aiResult = await parsePackSize(row.pack_size, row.description);
      caseWeight = aiResult.case_weight_lbs;
      parseMethod = 'ai';
      console.log(`AI parsed "${row.pack_size}" → ${caseWeight} lbs (${aiResult.interpretation})`);
    } catch (error) {
      console.error(`Failed to parse pack size: ${row.pack_size}`);
      caseWeight = null;
    }
  }

  return {
    ...row,
    case_weight_lbs: caseWeight,
    cost_per_lb: caseWeight ? row.unit_cost / caseWeight : null,
    parse_method: parseMethod
  };
}

// Example edge cases that AI handles:
// "6-5# BAGS" → 30 lbs
// "4/10LB VAC PKG" → 40 lbs
// "APPROX 40#" → 40 lbs
// "2/20 LB AVG" → 40 lbs
// "12 CT 2.5 LB" → 30 lbs

// =============================================================================
// EXAMPLE 4: Natural Language Search
// =============================================================================

async function handleSearchBar(userQuery: string) {
  // "Show me chicken under $2 from Georgia"
  const parsed = await parseSearchQuery(userQuery);
  
  console.log('Parsed query:', parsed);
  // {
  //   filters: {
  //     category: "chicken",
  //     max_price_per_lb: 2.00,
  //     warehouse_code: "GA"
  //   },
  //   explanation: "Searching for chicken products priced under $2.00 per pound from the Georgia warehouse",
  //   confidence: 0.95
  // }

  // Build Supabase query from filters
  let query = supabase.from('products').select('*');
  
  if (parsed.filters.category) {
    query = query.eq('category', parsed.filters.category);
  }
  if (parsed.filters.max_price_per_lb) {
    query = query.lte('cost_per_lb', parsed.filters.max_price_per_lb);
  }
  if (parsed.filters.warehouse_code) {
    query = query.eq('warehouse_code', parsed.filters.warehouse_code);
  }
  if (parsed.filters.search_text) {
    query = query.ilike('description', `%${parsed.filters.search_text}%`);
  }

  const { data } = await query;
  return { results: data, explanation: parsed.explanation };
}

// More example queries:
// "cheapest beef" → { category: "beef", sort: "cost_per_lb asc" }
// "Tyson products from PA" → { brand: "Tyson", warehouse_code: "PA" }
// "pork loin between $2 and $3" → { category: "pork", search_text: "loin", min: 2, max: 3 }

// =============================================================================
// EXAMPLE 5: Auto-Categorization on Product Creation
// =============================================================================

async function createProduct(productData: any) {
  // Auto-categorize using AI
  const category = await categorizeProduct(productData.description);
  
  console.log(`Categorized "${productData.description}":`);
  console.log(category);
  // {
  //   category: "chicken",
  //   subcategory: "thigh",
  //   is_frozen: true,
  //   is_raw: true,
  //   confidence: 0.98
  // }

  // Save with category
  const product = {
    ...productData,
    category: category.category,
    subcategory: category.subcategory,
    is_frozen: category.is_frozen
  };

  // await supabase.from('products').insert(product);
  return product;
}

// =============================================================================
// EXAMPLE 6: Next.js API Route Integration
// =============================================================================

/*
// app/api/parse-deal/route.ts

import { NextResponse } from 'next/server';
import { parseDealEmail } from '@/lib/anthropic/parsers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { emailContent } = await request.json();
    
    // Parse with AI
    const parsed = await parseDealEmail(emailContent);
    
    // Store in database
    const supabase = createClient();
    const { data, error } = await supabase
      .from('manufacturer_deals')
      .insert({
        source_type: 'email',
        source_content: emailContent,
        parsed_data: parsed,
        product_description: parsed.product_description,
        price_per_lb: parsed.price_per_lb,
        quantity_lbs: parsed.quantity_available_lbs,
        expiration_date: parsed.expiration_date,
        manufacturer: parsed.manufacturer,
        confidence_score: parsed.confidence,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Log AI usage
    await supabase.from('ai_processing_log').insert({
      task_type: 'deal_email_parse',
      tokens_used: parsed.tokens_used,
      model: 'claude-3-5-haiku-20241022',
      success: true
    });

    return NextResponse.json({ success: true, deal: data });
  } catch (error) {
    console.error('Deal parsing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse deal' },
      { status: 500 }
    );
  }
}
*/

// =============================================================================
// EXAMPLE 7: Supabase Edge Function Integration
// =============================================================================

/*
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

Deno.serve(async (req) => {
  const { content, type } = await req.json();
  
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (type) {
      case 'deal_email':
        result = await parseDealWithTool(content);
        break;
      case 'address':
        result = await normalizeAddressWithTool(content);
        break;
      case 'pack_size':
        result = await parsePackSizeWithTool(content);
        break;
      default:
        throw new Error(`Unknown parse type: ${type}`);
    }

    // Log usage
    await supabase.from('ai_processing_log').insert({
      task_type: type,
      input_summary: content.substring(0, 200),
      output_summary: JSON.stringify(result).substring(0, 500),
      tokens_used: result.tokens_used || 0,
      model: 'claude-3-5-haiku-20241022',
      latency_ms: Date.now() - startTime,
      success: true
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Log error
    await supabase.from('ai_processing_log').insert({
      task_type: type,
      input_summary: content.substring(0, 200),
      error_message: error.message,
      latency_ms: Date.now() - startTime,
      success: false
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
*/

// =============================================================================
// COST ESTIMATION
// =============================================================================

function estimateMonthlyCost(usage: {
  dealEmails: number;
  addressNormalizations: number;
  packSizeFallbacks: number;
  productCategorizations: number;
  searchQueries: number;
}) {
  // Average tokens per task (input + output)
  const tokensPerTask = {
    dealEmails: 2000,
    addressNormalizations: 500,
    packSizeFallbacks: 300,
    productCategorizations: 200,
    searchQueries: 400
  };

  // Calculate total tokens
  const totalTokens = 
    usage.dealEmails * tokensPerTask.dealEmails +
    usage.addressNormalizations * tokensPerTask.addressNormalizations +
    usage.packSizeFallbacks * tokensPerTask.packSizeFallbacks +
    usage.productCategorizations * tokensPerTask.productCategorizations +
    usage.searchQueries * tokensPerTask.searchQueries;

  // Haiku pricing: ~$1/MTok input, ~$5/MTok output (average ~$3/MTok)
  const costPerMTok = 3.00;
  const estimatedCost = (totalTokens / 1_000_000) * costPerMTok;

  return {
    totalTokens,
    estimatedCost: `$${estimatedCost.toFixed(2)}/month`
  };
}

// Example: Your expected usage
const expectedUsage = {
  dealEmails: 150,           // 5/day × 30 days
  addressNormalizations: 500, // Customer import (one-time, then ~10/month)
  packSizeFallbacks: 50,      // ~10% of products need AI
  productCategorizations: 200, // New products per month
  searchQueries: 300          // ~10/day
};

console.log(estimateMonthlyCost(expectedUsage));
// { totalTokens: 595000, estimatedCost: "$1.79/month" }
// Even with generous estimates, AI costs stay under $5/month
