/**
 * AC1 Validation Test: AI Deal Parsing
 * Verify AI successfully parses manufacturer deal email and extracts structured data
 */

import { parseDealEmail } from '../lib/anthropic/parsers';

const sampleDealEmail = `
From: Superior Meats <deals@superiormeats.com>
Subject: Weekly Special - Chicken Breast Deal

Hi,

We have a great deal on boneless skinless chicken breast this week:

Product: Boneless Skinless Chicken Breast
Price: $2.45 per pound
Quantity: 20,000 lbs available
Pack Size: 4/10 lb
Best By: March 15, 2026
Payment Terms: Net 30 days, 2% discount if paid within 10 days

Let me know if you're interested!

Best,
John Smith
Superior Meats
`;

async function testAC1() {
  console.log('=== AC1: AI Deal Parsing Test ===\n');

  try {
    console.log('Parsing deal email...');
    const result = await parseDealEmail(sampleDealEmail);

    if (!result) {
      console.error('❌ FAIL: parseDealEmail returned null');
      return false;
    }

    console.log('✓ Deal parsed successfully\n');
    console.log('Extracted data:');
    console.log('  Manufacturer:', result.deal.manufacturer);
    console.log('  Product:', result.deal.product_description);
    console.log('  Price/lb: $' + result.deal.price_per_lb);
    console.log('  Quantity:', result.deal.quantity_lbs, 'lbs');
    console.log('  Pack Size:', result.deal.pack_size);
    console.log('  Expiration:', result.deal.expiration_date || 'N/A');
    console.log('  Terms:', result.deal.deal_terms || 'N/A');
    console.log('\nToken usage:');
    console.log('  Input tokens:', result.tokens_used.input_tokens);
    console.log('  Output tokens:', result.tokens_used.output_tokens);
    console.log('  Model:', result.model);

    // Validate extracted fields
    const validations = [
      { field: 'manufacturer', value: result.deal.manufacturer, expected: 'non-empty string' },
      { field: 'product_description', value: result.deal.product_description, expected: 'non-empty string' },
      { field: 'price_per_lb', value: result.deal.price_per_lb, expected: 'number > 0' },
      { field: 'quantity_lbs', value: result.deal.quantity_lbs, expected: 'number > 0' },
      { field: 'pack_size', value: result.deal.pack_size, expected: 'non-empty string' },
    ];

    console.log('\nValidation:');
    let allValid = true;
    for (const v of validations) {
      const valid =
        v.field === 'price_per_lb' || v.field === 'quantity_lbs'
          ? typeof v.value === 'number' && v.value > 0
          : typeof v.value === 'string' && v.value.length > 0;

      console.log(`  ${valid ? '✓' : '✗'} ${v.field}: ${v.value} (expected: ${v.expected})`);
      if (!valid) allValid = false;
    }

    if (allValid) {
      console.log('\n✅ AC1 PASSED: All fields extracted correctly');
      return true;
    } else {
      console.log('\n❌ AC1 FAILED: Some fields missing or invalid');
      return false;
    }
  } catch (error) {
    console.error('❌ AC1 FAILED with exception:', error);
    return false;
  }
}

testAC1().then(passed => {
  process.exit(passed ? 0 : 1);
});
