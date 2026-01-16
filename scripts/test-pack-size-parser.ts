import { parsePackSize } from '../lib/utils/pack-size-parser';

console.log('🧪 Testing pack size parser (AC7)...\n');

const testCases = [
  { input: '6/5 LB', expected: 30 },
  { input: '4x10LB', expected: 40 },
  { input: '40 LB', expected: 40 },
  { input: '6-5#', expected: 30 },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = parsePackSize(input);
  const status = result === expected ? '✅' : '❌';

  if (result === expected) {
    passed++;
    console.log(`${status} parsePackSize('${input}') = ${result} (expected ${expected})`);
  } else {
    failed++;
    console.log(`${status} parsePackSize('${input}') = ${result} (expected ${expected}) FAILED`);
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
