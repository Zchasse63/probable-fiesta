// Phase 5 Validation Test
import { getAnthropicClient } from './lib/anthropic/client.js';
import * as parsers from './lib/anthropic/parsers.js';
import * as tools from './lib/anthropic/tools.js';
import { generatePriceSheetExcel } from './lib/export/excel.js';
import { PriceSheetPDF } from './lib/export/pdf.js';

const testCases = [
  { name: 'Client exists', check: () => getAnthropicClient !== undefined },
  { name: 'Parsers exist', check: () => {
    return parsers.parseDealEmail && parsers.normalizeAddress && parsers.parsePackSize && parsers.categorizeProduct && parsers.parseSearchQuery;
  }},
  { name: 'Tools defined', check: () => {
    return tools.extractDealTool && tools.normalizeAddressTool && tools.parsePackSizeTool && tools.categorizeProductTool && tools.queryToFilterTool;
  }},
  { name: 'Excel export exists', check: () => generatePriceSheetExcel !== undefined },
  { name: 'PDF export exists', check: () => PriceSheetPDF !== undefined },
];

console.log('\n=== Phase 5 Implementation Validation ===\n');
let passed = 0;
let failed = 0;

testCases.forEach(test => {
  try {
    const result = test.check();
    if (result) {
      console.log(`✓ ${test.name}`);
      passed++;
    } else {
      console.log(`✗ ${test.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ ${test.name} - ${error.message}`);
    failed++;
  }
});

console.log(`\n${passed}/${testCases.length} tests passed\n`);
process.exit(failed > 0 ? 1 : 0);
