import { getZoneByState } from '../lib/mapbox/zones';

// Test zone auto-assignment
console.log('Testing zone auto-assignment by state:\n');

const testCases = [
  { state: 'FL', expected: '1' },
  { state: 'GA', expected: '1' },
  { state: 'NY', expected: '2' },
  { state: 'PA', expected: '2' },
  { state: 'OH', expected: '3' },
  { state: 'IL', expected: '3' },
  { state: 'TX', expected: '4' },
  { state: 'CA', expected: '4' },
  { state: 'ZZ', expected: null }, // Invalid state
];

let passed = 0;
let failed = 0;

for (const test of testCases) {
  const result = getZoneByState(test.state);
  const match = result === test.expected;
  console.log(`${test.state} -> Zone ${result || 'null'} (expected: ${test.expected || 'null'}): ${match ? '✓' : '✗'}`);
  if (match) passed++;
  else failed++;
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
