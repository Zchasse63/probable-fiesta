#!/usr/bin/env tsx
/**
 * AI Integration Validation Test
 * Tests AI parsers directly without HTTP/auth layer
 */

import { parseDealEmail, normalizeAddress, parsePackSize, categorizeProduct, parseSearchQuery } from '../lib/anthropic/parsers';
import { isAnthropicConfigured } from '../lib/anthropic/client';

async function testAIIntegration() {
  console.log('🧪 AI Integration Validation Test\n');

  // Check if API key is configured
  if (!isAnthropicConfigured()) {
    console.error('❌ ANTHROPIC_API_KEY not configured');
    console.error('   Set ANTHROPIC_API_KEY in .env to run AI tests');
    process.exit(1);
  }

  console.log('✅ ANTHROPIC_API_KEY configured\n');

  let passCount = 0;
  let failCount = 0;

  // Test 1: Parse Deal Email (AC4)
  console.log('Test 1: Parse Deal Email (AC4)');
  try {
    const dealContent = `
Great deal from Tyson Foods!

Product: Boneless Skinless Chicken Breast
Pack Size: 10/4 lb cases
Price: $2.50 per pound
Quantity: 5000 lbs available
Expiration: June 30, 2026
Special terms: FOB, payment net 30
`;

    const result = await parseDealEmail(dealContent);

    if (result && result.deal) {
      const { deal } = result;
      console.log('   ✅ Deal parsed successfully');
      console.log(`   Manufacturer: ${deal.manufacturer}`);
      console.log(`   Product: ${deal.product_description}`);
      console.log(`   Price: $${deal.price_per_lb}/lb`);
      console.log(`   Quantity: ${deal.quantity_lbs} lbs`);
      console.log(`   Pack Size: ${deal.pack_size}`);
      console.log(`   Tokens: ${result.tokens_used.input_tokens} in, ${result.tokens_used.output_tokens} out\n`);
      passCount++;
    } else {
      console.log('   ❌ Failed to parse deal\n');
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    failCount++;
  }

  // Test 2: Normalize Address (AC2)
  console.log('Test 2: Normalize Address (AC2)');
  try {
    const messyAddress = '123 main st nyc';
    const result = await normalizeAddress(messyAddress);

    if (result && result.normalized) {
      console.log('   ✅ Address normalized successfully');
      console.log(`   Input: "${messyAddress}"`);
      console.log(`   Output: ${result.normalized.street}, ${result.normalized.city}, ${result.normalized.state} ${result.normalized.zip || ''}`);
      console.log(`   Corrections: ${result.corrections.length > 0 ? result.corrections.join(', ') : 'None'}`);
      console.log(`   Tokens: ${result.tokens_used.input_tokens} in, ${result.tokens_used.output_tokens} out\n`);
      passCount++;
    } else {
      console.log('   ❌ Failed to normalize address\n');
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    failCount++;
  }

  // Test 3: Parse Pack Size (AC9)
  console.log('Test 3: Parse Pack Size with AI Fallback (AC9)');
  try {
    const weirdPackSize = '2 dozen 8oz packages';
    const result = await parsePackSize(weirdPackSize, 'Frozen chicken tenders');

    if (result && result.case_weight_lbs) {
      console.log('   ✅ Pack size parsed with AI fallback');
      console.log(`   Input: "${weirdPackSize}"`);
      console.log(`   Case Weight: ${result.case_weight_lbs} lbs`);
      console.log(`   Tokens: ${result.tokens_used.input_tokens} in, ${result.tokens_used.output_tokens} out\n`);
      passCount++;
    } else {
      console.log('   ❌ Failed to parse pack size\n');
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    failCount++;
  }

  // Test 4: Categorize Product (AC1)
  console.log('Test 4: Auto-Categorize Product (AC1)');
  try {
    const description = 'Boneless skinless chicken breast fillets IQF';
    const result = await categorizeProduct(description);

    if (result && result.category) {
      console.log('   ✅ Product categorized successfully');
      console.log(`   Input: "${description}"`);
      console.log(`   Category: ${result.category.category}`);
      console.log(`   Subcategory: ${result.category.subcategory}`);
      console.log(`   Is Frozen: ${result.category.is_frozen}`);
      console.log(`   Is Raw: ${result.category.is_raw}`);
      console.log(`   Tokens: ${result.tokens_used.input_tokens} in, ${result.tokens_used.output_tokens} out\n`);
      passCount++;
    } else {
      console.log('   ❌ Failed to categorize product\n');
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    failCount++;
  }

  // Test 5: Natural Language Search (AC3)
  console.log('Test 5: Natural Language Search Query (AC3)');
  try {
    const query = 'frozen chicken under $3 per pound';
    const result = await parseSearchQuery(query);

    if (result && result.filters) {
      console.log('   ✅ Search query parsed successfully');
      console.log(`   Input: "${query}"`);
      console.log(`   Filters: ${JSON.stringify(result.filters, null, 2)}`);
      console.log(`   Explanation: ${result.explanation}`);
      console.log(`   Tokens: ${result.tokens_used.input_tokens} in, ${result.tokens_used.output_tokens} out\n`);
      passCount++;
    } else {
      console.log('   ❌ Failed to parse search query\n');
      failCount++;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    failCount++;
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests: ${passCount + failCount}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('═══════════════════════════════════════');

  process.exit(failCount > 0 ? 1 : 0);
}

testAIIntegration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
