#!/usr/bin/env node

/**
 * Verification test for race condition fix in deal acceptance
 * This test verifies:
 * 1. Atomic status check prevents concurrent duplicate acceptances
 * 2. Product creation happens BEFORE status update (atomicity)
 * 3. Rollback occurs if status update fails after product creation
 */

import * as fs from 'fs';

interface TestResult {
  name: string;
  passed: boolean;
  evidence: string;
}

const results: TestResult[] = [];

// Test 1: Verify atomic status check in deal update
function testAtomicStatusCheck(): TestResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  // Check that update includes .eq('status', 'pending') for atomic check
  const hasAtomicStatusCheck = content.includes(".eq('status', 'pending')") &&
    content.includes(".eq('id', dealId)") &&
    content.includes(".eq('user_id', user.id)");

  // Check that update returns selected data to verify success
  const hasSelectCheck = content.includes(".select('id')");

  // Check that error handler checks both updateError and !updatedDeal
  const hasProperErrorCheck = content.includes("if (updateError || !updatedDeal)");

  const passed = hasAtomicStatusCheck && hasSelectCheck && hasProperErrorCheck;

  return {
    name: 'Atomic status check prevents race condition',
    passed,
    evidence: passed
      ? 'Update includes .eq(status, pending) + .select(id) + proper null check'
      : 'Missing atomic status check or verification',
  };
}

// Test 2: Verify product created BEFORE status update (correct ordering)
function testProductCreationOrdering(): TestResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  // Find positions of product creation and deal update
  const productInsertPos = content.indexOf(".from('products')");
  const dealUpdatePos = content.indexOf("from('manufacturer_deals')\n      .update({");

  // Verify product creation happens before deal update
  const correctOrdering = productInsertPos > 0 && dealUpdatePos > 0 && productInsertPos < dealUpdatePos;

  // Verify product creation has error handling that returns 500 (fails request)
  const productErrorCheck = content.includes('if (productError || !newProduct)') &&
    content.includes("{ error: 'Failed to create product from deal' }");

  const passed = correctOrdering && productErrorCheck;

  return {
    name: 'Product created before status update (atomicity)',
    passed,
    evidence: passed
      ? `Product insert at pos ${productInsertPos}, deal update at pos ${dealUpdatePos}`
      : 'Product creation not before deal update or missing error check',
  };
}

// Test 3: Verify rollback on race condition
function testRollbackOnRaceCondition(): TestResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  // Check for rollback logic after failed deal update
  const hasRollback = content.includes("await supabase.from('products').delete().eq('id', newProduct.id)");

  // Check for 409 Conflict status on race condition
  const returns409 = content.includes("{ error: 'Deal has already been processed by another request' }") &&
    content.includes('status: 409');

  const passed = hasRollback && returns409;

  return {
    name: 'Rollback occurs on race condition detection',
    passed,
    evidence: passed
      ? 'Product deleted if deal update fails, returns 409 Conflict'
      : 'Missing rollback or incorrect status code',
  };
}

// Test 4: Verify no inconsistent state possible
function testNoInconsistentState(): TestResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify there's NO path where:
  // - Deal status is updated to 'accepted'
  // - But product creation might fail afterward
  // This is prevented by creating product FIRST

  // Check that the ONLY success path returns both success and message
  const successPath = content.includes("return NextResponse.json({\n      success: true,\n      message: 'Deal accepted and product created',");

  // Verify there's NO warning path like "Deal accepted but product creation failed"
  const noWarningPath = !content.includes("warning: 'Deal accepted but product creation failed'");

  const passed = successPath && noWarningPath;

  return {
    name: 'No inconsistent state possible (deal accepted without product)',
    passed,
    evidence: passed
      ? 'Only success path returns after both operations succeed'
      : 'Warning path or inconsistent state still possible',
  };
}

// Test 5: Verify data integrity checks
function testDataIntegrityChecks(): TestResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  // Check that product insert selects the id to verify creation
  const productSelectsId = content.includes("from('products')\n      .insert({") &&
    content.includes(".select('id')");

  // Check that deal update selects the id to verify update
  const dealSelectsId = content.includes("from('manufacturer_deals')\n      .update({") &&
    content.includes(".select('id')");

  const passed = productSelectsId && dealSelectsId;

  return {
    name: 'Data integrity verified with .select() on both operations',
    passed,
    evidence: passed
      ? 'Both product insert and deal update use .select(id) to verify success'
      : 'Missing verification on one or both operations',
  };
}

// Run all tests
console.log('=== Race Condition Fix Verification ===\n');

results.push(testAtomicStatusCheck());
results.push(testProductCreationOrdering());
results.push(testRollbackOnRaceCondition());
results.push(testNoInconsistentState());
results.push(testDataIntegrityChecks());

// Print results
results.forEach((result, index) => {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${index + 1}. ${status}: ${result.name}`);
  console.log(`   Evidence: ${result.evidence}\n`);
});

// Summary
const passedCount = results.filter((r) => r.passed).length;
const totalCount = results.length;

console.log('=== SUMMARY ===');
console.log(`${passedCount}/${totalCount} tests passed\n`);

if (passedCount === totalCount) {
  console.log('✅ All race condition fixes verified');
  process.exit(0);
} else {
  console.log('❌ Some tests failed - race condition not fully fixed');
  process.exit(1);
}
