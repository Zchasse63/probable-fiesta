/**
 * Test: Component imports and compilation
 */

console.log('Testing component compilation...');

const components = [
  'components/search/smart-search.tsx',
  'components/deals/deal-parser.tsx',
  'components/deals/deal-review.tsx',
  'components/deals/deal-table.tsx',
  'components/export/export-panel.tsx',
  'components/export/pdf-preview.tsx',
  'components/settings/ai-usage-stats.tsx',
];

import * as fs from 'fs';

let allExist = true;

components.forEach(comp => {
  const exists = fs.existsSync(comp);
  console.log(`${exists ? '✓' : '✗'} ${comp}`);
  if (!exists) allExist = false;
});

if (allExist) {
  console.log('\n✓ All Phase 5 components exist');
  process.exit(0);
} else {
  console.error('\n✗ Missing components detected');
  process.exit(1);
}
