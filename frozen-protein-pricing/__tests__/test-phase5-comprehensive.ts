/**
 * Comprehensive Phase 5 Test Suite
 * Tests AI integration and export functionality
 */

import { parseDealEmail, parsePackSize, categorizeProduct, normalizeAddress } from '../lib/anthropic/parsers';
import { generatePriceSheetExcel, ExcelExportData } from '../lib/export/excel';
import { isAnthropicConfigured } from '../lib/anthropic/client';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Test counter
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function logTest(name: string, passed: boolean, details?: string) {
  testsRun++;
  if (passed) {
    testsPassed++;
    console.log(`✓ ${name}`);
    if (details) console.log(`  ${details}`);
  } else {
    testsFailed++;
    console.log(`✗ ${name}`);
    if (details) console.log(`  ${details}`);
  }
}

async function runTests() {
  console.log('=== Phase 5 Comprehensive Test Suite ===\n');

  // Test 1: Anthropic API Configuration
  console.log('Test Group 1: Configuration');
  const apiConfigured = isAnthropicConfigured();
  logTest('ANTHROPIC_API_KEY configured', apiConfigured);
  console.log('');

  if (!apiConfigured) {
    console.log('⚠️  Skipping AI tests - API key not configured\n');
  } else {
    // Test 2: Deal Parsing
    console.log('Test Group 2: Deal Parsing (AC1)');
    try {
      const dealResult = await parseDealEmail(`
From: Superior Meats
Product: Chicken Breast
Price: $2.45/lb
Quantity: 20,000 lbs
Pack Size: 4/10 lb
      `);

      const dealValid = dealResult &&
        dealResult.deal.manufacturer &&
        dealResult.deal.product_description &&
        dealResult.deal.price_per_lb > 0 &&
        dealResult.deal.quantity_lbs > 0;

      logTest('parseDealEmail extracts all fields', !!dealValid,
        dealValid ? `Manufacturer: ${dealResult!.deal.manufacturer}, Product: ${dealResult!.deal.product_description}` : 'Missing fields');

      logTest('Deal parsing returns token usage', !!(dealResult?.tokens_used.input_tokens),
        dealResult ? `${dealResult.tokens_used.input_tokens} in, ${dealResult.tokens_used.output_tokens} out` : '');
    } catch (error: unknown) {
      logTest('parseDealEmail executes without error', false, error instanceof Error ? error.message : String(error));
    }
    console.log('');

    // Test 3: Address Normalization
    console.log('Test Group 3: Address Normalization (AC2)');
    try {
      const addrResult = await normalizeAddress('123 main st nyc');

      const addrValid = addrResult &&
        addrResult.normalized.street &&
        addrResult.normalized.city &&
        addrResult.normalized.state;

      logTest('normalizeAddress standardizes address', !!addrValid,
        addrValid ? `${addrResult!.normalized.street}, ${addrResult!.normalized.city}, ${addrResult!.normalized.state}` : 'Missing fields');

      logTest('Address normalization tracks corrections', !!(addrResult && Array.isArray(addrResult.corrections)));
    } catch (error: unknown) {
      logTest('normalizeAddress executes without error', false, error instanceof Error ? error.message : String(error));
    }
    console.log('');

    // Test 4: Pack Size Parsing
    console.log('Test Group 4: Pack Size Parsing (AC9)');
    try {
      const packResult = await parsePackSize('2 dozen 8oz pkgs', 'chicken wings');

      const packValid = packResult && packResult.case_weight_lbs > 0;

      logTest('parsePackSize calculates weight', !!packValid,
        packValid ? `"2 dozen 8oz pkgs" = ${packResult!.case_weight_lbs} lbs` : 'Invalid weight');

      // Verify calculation is reasonable (AI interprets "2 dozen" as 24 items)
      const calcCorrect = packResult && packResult.case_weight_lbs > 0 && packResult.case_weight_lbs < 100;
      logTest('Pack size calculation reasonable', !!calcCorrect,
        packResult ? `Weight: ${packResult.case_weight_lbs} lbs (reasonable range)` : '');
    } catch (error: unknown) {
      logTest('parsePackSize executes without error', false, error instanceof Error ? error.message : String(error));
    }
    console.log('');

    // Test 5: Product Categorization
    console.log('Test Group 5: Product Categorization (AC1)');
    try {
      const catResult = await categorizeProduct('Frozen boneless skinless chicken breast');

      const catValid = catResult &&
        catResult.category.category &&
        catResult.category.subcategory &&
        typeof catResult.category.is_frozen === 'boolean' &&
        typeof catResult.category.is_raw === 'boolean';

      logTest('categorizeProduct assigns category', !!catValid,
        catValid ? `${catResult!.category.category} / ${catResult!.category.subcategory}` : 'Missing fields');

      logTest('Categorization identifies frozen products', catResult?.category.is_frozen === true);
    } catch (error: unknown) {
      logTest('categorizeProduct executes without error', false, error instanceof Error ? error.message : String(error));
    }
    console.log('');
  }

  // Test 6: Excel Export
  console.log('Test Group 6: Excel Export (AC5)');
  try {
    const testData: ExcelExportData = {
      zone_name: 'Test Zone',
      generated_date: new Date().toISOString(),
      products: [
        {
          product_code: 'TEST-001',
          description: 'Test Product',
          pack_size: '4/10 lb',
          brand: 'Test Brand',
          availability: 'In Stock',
          price_per_lb: 2.99,
          warehouse_name: 'Warehouse A',
        },
        {
          product_code: 'TEST-002',
          description: 'Another Product',
          pack_size: '2/5 lb',
          brand: 'Test Brand',
          availability: 'Limited',
          price_per_lb: 3.49,
          warehouse_name: 'Warehouse B',
        },
      ],
    };

    const excelBuffer = await generatePriceSheetExcel(testData);

    logTest('generatePriceSheetExcel returns buffer', excelBuffer instanceof Buffer);
    logTest('Excel buffer has content', excelBuffer.length > 0, `${excelBuffer.length} bytes`);

    // Write test file for manual inspection
    const testFilePath = path.join(__dirname, 'test-output.xlsx');
    fs.writeFileSync(testFilePath, excelBuffer);
    logTest('Excel file written to disk', fs.existsSync(testFilePath), testFilePath);
  } catch (error: unknown) {
    logTest('Excel export executes without error', false, error instanceof Error ? error.message : String(error));
  }
  console.log('');

  // Test 7: Database Tables Exist
  console.log('Test Group 7: Database Schema');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check ai_processing_log
      const { data: aiLogData, error: aiLogError } = await supabase
        .from('ai_processing_log')
        .select('*')
        .limit(1);

      logTest('ai_processing_log table exists', !aiLogError, aiLogError?.message);

      // Check manufacturer_deals
      const { data: dealsData, error: dealsError } = await supabase
        .from('manufacturer_deals')
        .select('*')
        .limit(1);

      logTest('manufacturer_deals table exists', !dealsError, dealsError?.message);
    } catch (error: unknown) {
      logTest('Database connection', false, error instanceof Error ? error.message : String(error));
    }
  } else {
    logTest('Supabase configured', false, 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  console.log('');

  // Test 8: Component Files Exist
  console.log('Test Group 8: Component Implementation');
  const requiredFiles = [
    'components/deals/deal-parser.tsx',
    'components/deals/deal-review.tsx',
    'components/deals/deal-table.tsx',
    'components/export/excel-export-button.tsx',
    'components/export/pdf-preview.tsx',
    'components/export/export-panel.tsx',
    'components/search/smart-search.tsx',
    'components/settings/ai-usage-stats.tsx',
    'app/(dashboard)/deals/page.tsx',
    'app/(dashboard)/settings/ai-usage/page.tsx',
    'app/api/ai/parse-deal/route.ts',
    'app/api/ai/normalize-address/route.ts',
    'app/api/ai/parse-pack-size/route.ts',
    'app/api/ai/categorize/route.ts',
    'app/api/ai/search/route.ts',
    'app/api/export/excel/route.ts',
    'app/api/export/pdf/route.ts',
    'lib/anthropic/client.ts',
    'lib/anthropic/tools.ts',
    'lib/anthropic/parsers.ts',
    'lib/anthropic/utils.ts',
    'lib/export/excel.ts',
    'lib/export/pdf.tsx',
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    logTest(`${file} exists`, exists);
  }
  console.log('');

  // Summary
  console.log('=================================');
  console.log(`Tests Run: ${testsRun}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log('=================================\n');

  if (testsFailed === 0) {
    console.log('✅ All tests passed');
  } else {
    console.log(`❌ ${testsFailed} test(s) failed`);
  }

  return testsFailed === 0;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});
