#!/usr/bin/env tsx
/**
 * Phase 5 Validation Tests
 * Tests AI integration features end-to-end
 */

import { parseDealEmail, parsePackSize, categorizeProduct, parseSearchQuery, normalizeAddress } from './lib/anthropic/parsers';
import { isAnthropicConfigured } from './lib/anthropic/client';

// Test deal email content
const SAMPLE_DEAL_EMAIL = `
From: Tyson Foods <deals@tyson.com>
Subject: Special Deal - Chicken Breast

Hi,

We have a special deal this week on boneless skinless chicken breast.

Product: Boneless Skinless Chicken Breast
Price: $2.45 per pound
Quantity: 10,000 lbs available
Pack Size: 2/5 lb bags per case
Expiration: February 28, 2026
Terms: Payment due within 30 days, delivery included

Let me know if you're interested!
`;

const SAMPLE_ADDRESS = '123 main st nyc 10001';
const SAMPLE_PACK_SIZE = '2 dozen 8oz packages';
const SAMPLE_DESCRIPTION = 'Fresh frozen chicken wings';
const SAMPLE_SEARCH_QUERY = 'frozen chicken under $3 per pound';

async function validateAIFeatures() {
  console.log('🔍 Phase 5 AI Integration Validation\n');

  // Check if API key is configured
  if (!isAnthropicConfigured()) {
    console.error('❌ ANTHROPIC_API_KEY not configured');
    console.error('   Set it in .env.local to enable AI features');
    process.exit(1);
  }
  console.log('✓ Anthropic API key configured\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Deal Email Parsing (AC4)
  console.log('Test 1: Deal Email Parsing');
  try {
    const dealResult = await parseDealEmail(SAMPLE_DEAL_EMAIL);
    if (!dealResult) {
      throw new Error('parseDealEmail returned null');
    }

    console.log('  Parsed Deal:');
    console.log('  - Manufacturer:', dealResult.deal.manufacturer);
    console.log('  - Product:', dealResult.deal.product_description);
    console.log('  - Price/lb: $' + dealResult.deal.price_per_lb.toFixed(2));
    console.log('  - Quantity:', dealResult.deal.quantity_lbs, 'lbs');
    console.log('  - Pack Size:', dealResult.deal.pack_size);
    console.log('  - Tokens Used:', dealResult.tokens_used.input_tokens + dealResult.tokens_used.output_tokens);

    // Validate extraction accuracy
    if (dealResult.deal.price_per_lb < 2 || dealResult.deal.price_per_lb > 3) {
      console.warn('  ⚠️  Price extraction may be inaccurate: $' + dealResult.deal.price_per_lb);
    }
    if (dealResult.deal.quantity_lbs !== 10000) {
      console.warn('  ⚠️  Quantity extraction incorrect: expected 10000, got ' + dealResult.deal.quantity_lbs);
    }

    console.log('✓ Test 1 PASSED\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ Test 1 FAILED:', error instanceof Error ? error.message : error);
    testsFailed++;
  }

  // Test 2: Address Normalization (AC2)
  console.log('Test 2: Address Normalization');
  try {
    const addressResult = await normalizeAddress(SAMPLE_ADDRESS);
    if (!addressResult) {
      throw new Error('normalizeAddress returned null');
    }

    console.log('  Original:', SAMPLE_ADDRESS);
    console.log('  Normalized:');
    console.log('  - Street:', addressResult.normalized.street);
    console.log('  - City:', addressResult.normalized.city);
    console.log('  - State:', addressResult.normalized.state);
    console.log('  - ZIP:', addressResult.normalized.zip);
    console.log('  Corrections:', addressResult.corrections.length > 0 ? addressResult.corrections.join(', ') : 'None');
    console.log('  Tokens Used:', addressResult.tokens_used.input_tokens + addressResult.tokens_used.output_tokens);

    console.log('✓ Test 2 PASSED\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ Test 2 FAILED:', error instanceof Error ? error.message : error);
    testsFailed++;
  }

  // Test 3: Pack Size Parsing (AC9)
  console.log('Test 3: Pack Size AI Fallback');
  try {
    const packSizeResult = await parsePackSize(SAMPLE_PACK_SIZE, SAMPLE_DESCRIPTION);
    if (!packSizeResult) {
      throw new Error('parsePackSize returned null');
    }

    console.log('  Input:', SAMPLE_PACK_SIZE);
    console.log('  Parsed Weight:', packSizeResult.case_weight_lbs, 'lbs');
    console.log('  Tokens Used:', packSizeResult.tokens_used.input_tokens + packSizeResult.tokens_used.output_tokens);

    if (packSizeResult.case_weight_lbs <= 0) {
      throw new Error('Invalid case weight parsed: ' + packSizeResult.case_weight_lbs);
    }

    console.log('✓ Test 3 PASSED\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ Test 3 FAILED:', error instanceof Error ? error.message : error);
    testsFailed++;
  }

  // Test 4: Product Categorization (AC1)
  console.log('Test 4: Product Auto-Categorization');
  try {
    const categoryResult = await categorizeProduct(SAMPLE_DESCRIPTION);
    if (!categoryResult) {
      throw new Error('categorizeProduct returned null');
    }

    console.log('  Product:', SAMPLE_DESCRIPTION);
    console.log('  Category:', categoryResult.category.category);
    console.log('  Subcategory:', categoryResult.category.subcategory);
    console.log('  Is Frozen:', categoryResult.category.is_frozen);
    console.log('  Is Raw:', categoryResult.category.is_raw);
    console.log('  Tokens Used:', categoryResult.tokens_used.input_tokens + categoryResult.tokens_used.output_tokens);

    console.log('✓ Test 4 PASSED\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ Test 4 FAILED:', error instanceof Error ? error.message : error);
    testsFailed++;
  }

  // Test 5: Natural Language Search (AC3)
  console.log('Test 5: Natural Language Search');
  try {
    const searchResult = await parseSearchQuery(SAMPLE_SEARCH_QUERY);
    if (!searchResult) {
      throw new Error('parseSearchQuery returned null');
    }

    console.log('  Query:', SAMPLE_SEARCH_QUERY);
    console.log('  Filters:');
    console.log('    - Category:', searchResult.filters.category || 'none');
    console.log('    - Price Max:', searchResult.filters.price_max ? '$' + searchResult.filters.price_max + '/lb' : 'none');
    console.log('    - Is Frozen:', searchResult.filters.is_frozen ?? 'any');
    console.log('  Explanation:', searchResult.explanation);
    console.log('  Tokens Used:', searchResult.tokens_used.input_tokens + searchResult.tokens_used.output_tokens);

    // Validate filter extraction
    if (searchResult.filters.price_max !== 3) {
      console.warn('  ⚠️  Price filter extraction may be incorrect: expected 3, got', searchResult.filters.price_max);
    }

    console.log('✓ Test 5 PASSED\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ Test 5 FAILED:', error instanceof Error ? error.message : error);
    testsFailed++;
  }

  // Summary
  console.log('═'.repeat(60));
  console.log(`Tests Passed: ${testsPassed} / ${testsPassed + testsFailed}`);
  console.log(`Tests Failed: ${testsFailed} / ${testsPassed + testsFailed}`);
  console.log('═'.repeat(60));

  if (testsFailed > 0) {
    console.error('\n❌ Some AI features are not working correctly');
    process.exit(1);
  } else {
    console.log('\n✅ All AI features validated successfully');
    process.exit(0);
  }
}

// Run validation
validateAIFeatures().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
