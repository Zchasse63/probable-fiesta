/**
 * Direct parser tests - no server required
 */

import { parseDealEmail, parsePackSize, categorizeProduct } from '../lib/anthropic/parsers';

async function testParsers() {
  console.log('=== Testing AI Parsers Directly ===\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Deal parsing
  console.log('Test 1: parseDealEmail');
  try {
    const result = await parseDealEmail(`
From: Superior Meats <deals@superiormeats.com>
Subject: Weekly Special - Chicken Breast Deal

Product: Boneless Skinless Chicken Breast
Price: $2.45 per pound
Quantity: 20,000 lbs available
Pack Size: 4/10 lb
Best By: March 15, 2026
    `);

    if (result && result.deal.manufacturer && result.deal.product_description) {
      console.log('✓ Deal parsed successfully');
      console.log(`  Manufacturer: ${result.deal.manufacturer}`);
      console.log(`  Product: ${result.deal.product_description}`);
      console.log(`  Price: $${result.deal.price_per_lb}/lb`);
      passed++;
    } else {
      console.log('✗ Deal parsing returned incomplete data');
      failed++;
    }
  } catch (error: unknown) {
    console.log(`✗ Deal parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }

  console.log('');

  // Test 2: Pack size parsing
  console.log('Test 2: parsePackSize');
  try {
    const result = await parsePackSize('2 dozen 8oz pkgs', 'Frozen chicken wings');

    if (result && result.case_weight_lbs > 0) {
      console.log('✓ Pack size parsed successfully');
      console.log(`  Input: "2 dozen 8oz pkgs"`);
      console.log(`  Calculated weight: ${result.case_weight_lbs} lbs`);
      passed++;
    } else {
      console.log('✗ Pack size parsing returned invalid weight');
      failed++;
    }
  } catch (error: unknown) {
    console.log(`✗ Pack size parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }

  console.log('');

  // Test 3: Product categorization
  console.log('Test 3: categorizeProduct');
  try {
    const result = await categorizeProduct('Frozen boneless skinless chicken breast');

    if (result && result.category && result.category.category && result.category.subcategory) {
      console.log('✓ Product categorized successfully');
      console.log(`  Category: ${result.category.category}`);
      console.log(`  Subcategory: ${result.category.subcategory}`);
      console.log(`  Is frozen: ${result.category.is_frozen}`);
      console.log(`  Is raw: ${result.category.is_raw}`);
      passed++;
    } else {
      console.log('✗ Categorization returned incomplete data');
      console.log(`  Result: ${JSON.stringify(result)}`);
      failed++;
    }
  } catch (error: unknown) {
    console.log(`✗ Categorization failed: ${error instanceof Error ? error.message : String(error)}`);
    failed++;
  }

  console.log('\n=================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('=================================\n');

  return failed === 0;
}

testParsers().then(success => {
  process.exit(success ? 0 : 1);
});
