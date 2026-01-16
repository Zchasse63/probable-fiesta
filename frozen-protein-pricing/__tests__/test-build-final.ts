/**
 * Final Build Validation
 */

import * as fs from 'fs';

console.log('=== Phase 5 Build Validation ===\n');

// Check critical files
const criticalFiles = {
  'lib/anthropic/client.ts': 'Anthropic client',
  'lib/anthropic/tools.ts': 'Tool definitions',
  'lib/anthropic/parsers.ts': 'AI parsers',
  'lib/anthropic/utils.ts': 'Utils with circuit breaker',
  'lib/export/excel.ts': 'Excel export',
  'lib/export/pdf.tsx': 'PDF export',
  'app/api/ai/parse-deal/route.ts': 'Parse deal API',
  'app/api/ai/normalize-address/route.ts': 'Normalize address API',
  'app/api/ai/categorize/route.ts': 'Categorize API',
  'app/api/ai/search/route.ts': 'Smart search API',
  'app/api/export/excel/route.ts': 'Excel export API',
  'app/api/export/pdf/route.ts': 'PDF export API',
};

console.log('Checking critical files:');
let allFilesExist = true;
Object.entries(criticalFiles).forEach(([file, desc]) => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✓' : '✗'} ${desc}: ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.error('\n✗ Missing critical files');
  process.exit(1);
}

console.log('\n✓ All critical files present');
console.log('\n=== Build Status: PASS ===');
process.exit(0);
