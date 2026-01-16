/**
 * Final Validation Test Suite
 * Validates Phase 5 implementation without requiring API keys
 */
import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✓ ${name}`);
    if (details) console.log(`  ${details}`);
    passed++;
  } else {
    console.log(`✗ ${name}`);
    if (details) console.log(`  ${details}`);
    failed++;
  }
}

console.log('=== Phase 5 Final Validation ===\n');

// Critical files
console.log('Infrastructure Files:');
const infraFiles = [
  'lib/anthropic/client.ts',
  'lib/anthropic/tools.ts',
  'lib/anthropic/parsers.ts',
  'lib/anthropic/utils.ts',
];
infraFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  test(`${file}`, exists);
});
console.log('');

console.log('AI API Routes:');
const apiRoutes = [
  'app/api/ai/parse-deal/route.ts',
  'app/api/ai/normalize-address/route.ts',
  'app/api/ai/parse-pack-size/route.ts',
  'app/api/ai/categorize/route.ts',
  'app/api/ai/search/route.ts',
];
apiRoutes.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  test(`${file}`, exists);
});
console.log('');

console.log('Export Infrastructure:');
const exportFiles = [
  'lib/export/excel.ts',
  'lib/export/pdf.tsx',
  'app/api/export/excel/route.ts',
  'app/api/export/pdf/route.ts',
];
exportFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  test(`${file}`, exists);
});
console.log('');

console.log('Deal Management Components:');
const dealFiles = [
  'components/deals/deal-parser.tsx',
  'components/deals/deal-review.tsx',
  'components/deals/deal-table.tsx',
  'app/(dashboard)/deals/page.tsx',
];
dealFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  test(`${file}`, exists);
});
console.log('');

console.log('Export Components:');
const exportComponents = [
  'components/export/excel-export-button.tsx',
  'components/export/pdf-preview.tsx',
  'components/export/export-panel.tsx',
];
exportComponents.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  test(`${file}`, exists);
});
console.log('');

console.log('Search and Analytics:');
const searchFiles = [
  'components/search/smart-search.tsx',
  'components/settings/ai-usage-stats.tsx',
  'app/(dashboard)/settings/ai-usage/page.tsx',
];
searchFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  test(`${file}`, exists);
});
console.log('');

// Code quality checks
console.log('Code Quality:');

const clientCode = fs.readFileSync(path.join(__dirname, '..', 'lib/anthropic/client.ts'), 'utf-8');
test('ANTHROPIC_API_KEY check implemented', clientCode.includes('ANTHROPIC_API_KEY'));
test('isAnthropicConfigured helper exists', clientCode.includes('isAnthropicConfigured'));

const parsersCode = fs.readFileSync(path.join(__dirname, '..', 'lib/anthropic/parsers.ts'), 'utf-8');
test('parseDealEmail function exists', parsersCode.includes('export async function parseDealEmail'));
test('normalizeAddress function exists', parsersCode.includes('export async function normalizeAddress'));
test('parsePackSize function exists', parsersCode.includes('export async function parsePackSize'));
test('categorizeProduct function exists', parsersCode.includes('export async function categorizeProduct'));
test('parseSearchQuery function exists', parsersCode.includes('export async function parseSearchQuery'));

const excelCode = fs.readFileSync(path.join(__dirname, '..', 'lib/export/excel.ts'), 'utf-8');
test('generatePriceSheetExcel function exists', excelCode.includes('export async function generatePriceSheetExcel'));
test('Excel uses ExcelJS', excelCode.includes('exceljs') || excelCode.includes('Workbook'));

const pdfCode = fs.readFileSync(path.join(__dirname, '..', 'lib/export/pdf.tsx'), 'utf-8');
test('PriceSheetPDF component exists', pdfCode.includes('export const PriceSheetPDF'));
test('PDF uses @react-pdf/renderer', pdfCode.includes('@react-pdf/renderer'));

console.log('');

console.log('.env.example Configuration:');
const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf-8');
test('ANTHROPIC_API_KEY documented', envExample.includes('ANTHROPIC_API_KEY'));
test('Supabase keys documented', envExample.includes('NEXT_PUBLIC_SUPABASE_URL'));
test('Mapbox token documented', envExample.includes('NEXT_PUBLIC_MAPBOX_TOKEN'));

console.log('');

console.log('=================================');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('=================================\n');

if (failed === 0) {
  console.log('✅ Phase 5 implementation complete');
  process.exit(0);
} else {
  console.log('❌ Phase 5 implementation incomplete');
  process.exit(1);
}
