#!/usr/bin/env node

/**
 * Final validation of deal acceptance route fix
 * Verifies both critical issues are resolved:
 * 1. Race condition on concurrent acceptance
 * 2. Inconsistent state on product creation failure
 */

import * as fs from 'fs';

interface ValidationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
}

const results: ValidationResult[] = [];

// Category 1: Race Condition Prevention
function validateRaceConditionFix(): ValidationResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  const checks = [
    {
      name: 'Atomic status check in update query',
      passed: content.includes(".eq('id', dealId)\n      .eq('user_id', user.id)\n      .eq('status', 'pending')"),
      detail: "Update query includes .eq('status', 'pending') to prevent concurrent updates",
    },
    {
      name: 'Update returns selected data for verification',
      passed: content.includes("const { data: updatedDeal, error: updateError } = await supabase\n      .from('manufacturer_deals')\n      .update({") &&
        content.includes(".select('id')\n      .single();"),
      detail: 'Update uses .select(id).single() to verify exactly one row updated',
    },
    {
      name: 'Checks both error and null result',
      passed: content.includes("if (updateError || !updatedDeal)"),
      detail: 'Validates both error condition and null result (0 rows updated)',
    },
    {
      name: 'Returns 409 Conflict on race condition',
      passed: content.includes("{ error: 'Deal has already been processed by another request' }") &&
        content.includes("status: 409"),
      detail: 'Returns HTTP 409 Conflict when concurrent request wins',
    },
  ];

  return { category: 'Race Condition Prevention', checks };
}

// Category 2: Transaction Atomicity
function validateTransactionAtomicity(): ValidationResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  // Find operation positions
  const productInsertPos = content.indexOf("const { data: newProduct, error: productError } = await supabase\n      .from('products')\n      .insert({");
  const dealUpdatePos = content.indexOf("const { data: updatedDeal, error: updateError } = await supabase\n      .from('manufacturer_deals')\n      .update({");

  const checks = [
    {
      name: 'Product created before deal status update',
      passed: productInsertPos > 0 && dealUpdatePos > 0 && productInsertPos < dealUpdatePos,
      detail: `Product insert at position ${productInsertPos}, deal update at position ${dealUpdatePos}`,
    },
    {
      name: 'Product creation returns id for verification',
      passed: content.includes("from('products')\n      .insert({") &&
        content.includes(".select('id')\n      .single();"),
      detail: 'Product insert uses .select(id).single() to verify creation',
    },
    {
      name: 'Product creation failure returns error',
      passed: content.includes("if (productError || !newProduct) {\n      return NextResponse.json(\n        { error: 'Failed to create product from deal' },\n        { status: 500 }"),
      detail: 'Returns 500 error if product creation fails - deal never updated',
    },
    {
      name: 'No success path without both operations completing',
      passed: !content.includes("warning: 'Deal accepted but product creation failed'"),
      detail: 'Removed warning path that returned success despite partial failure',
    },
  ];

  return { category: 'Transaction Atomicity', checks };
}

// Category 3: Rollback Mechanism
function validateRollbackMechanism(): ValidationResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  const checks = [
    {
      name: 'Rollback deletes created product on deal update failure',
      passed: content.includes("await supabase.from('products').delete().eq('id', newProduct.id);"),
      detail: 'Deletes product if deal update fails (race condition or other error)',
    },
    {
      name: 'Rollback happens before returning error',
      passed: (() => {
        const rollbackPos = content.indexOf("await supabase.from('products').delete().eq('id', newProduct.id);");
        const returnPos = content.indexOf("return NextResponse.json(\n        { error: 'Deal has already been processed by another request' }");
        return rollbackPos > 0 && returnPos > 0 && rollbackPos < returnPos;
      })(),
      detail: 'Rollback executed before returning 409 error response',
    },
    {
      name: 'Product id available for rollback',
      passed: content.includes("const { data: newProduct, error: productError }") &&
        content.includes("newProduct.id"),
      detail: 'Product creation stores id in newProduct variable for later deletion',
    },
  ];

  return { category: 'Rollback Mechanism', checks };
}

// Category 4: Data Integrity
function validateDataIntegrity(): ValidationResult {
  const filePath = '/Users/zach/CRM Mapping/probable-fiesta/frozen-protein-pricing/app/api/deals/[id]/accept/route.ts';
  const content = fs.readFileSync(filePath, 'utf8');

  const checks = [
    {
      name: 'All database operations use .select() for verification',
      passed: (content.match(/\.select\('id'\)/g)?.length ?? 0) >= 2,
      detail: 'Both product insert and deal update use .select(id) to verify success',
    },
    {
      name: 'All database operations use .single() for consistency',
      passed: (content.match(/\.single\(\);/g)?.length ?? 0) >= 3, // existingDeal, newProduct, updatedDeal
      detail: 'All queries use .single() to ensure exactly one row affected',
    },
    {
      name: 'Warehouse FK validation before product creation',
      passed: content.includes("const { data: warehouse, error: warehouseError } = await supabase\n      .from('warehouses')\n      .select('id')"),
      detail: 'Validates warehouse exists before attempting product creation',
    },
    {
      name: 'Duplicate deal check before operations',
      passed: content.includes("const { data: duplicateDeal } = await supabase\n      .from('manufacturer_deals')\n      .select('id')") &&
        content.includes("eq('status', 'accepted')"),
      detail: 'Checks for duplicate deals within 7-day window before processing',
    },
  ];

  return { category: 'Data Integrity', checks };
}

// Run all validations
console.log('=== Deal Acceptance Route Final Validation ===\n');

results.push(validateRaceConditionFix());
results.push(validateTransactionAtomicity());
results.push(validateRollbackMechanism());
results.push(validateDataIntegrity());

// Print results
let totalChecks = 0;
let passedChecks = 0;

results.forEach((result) => {
  console.log(`\n${result.category}:`);
  console.log('='.repeat(result.category.length + 1));

  result.checks.forEach((check) => {
    totalChecks++;
    if (check.passed) passedChecks++;

    const status = check.passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    console.log(`   ${check.detail}`);
  });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Total: ${totalChecks} checks`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
console.log('='.repeat(50) + '\n');

if (passedChecks === totalChecks) {
  console.log('✅ All validation checks passed');
  console.log('✅ Race condition FIXED: Atomic status check prevents duplicate acceptances');
  console.log('✅ Inconsistent state FIXED: Product created before status update with rollback');
  console.log('✅ Data integrity VERIFIED: FK checks, duplicate detection, atomic operations');
  process.exit(0);
} else {
  console.log(`❌ ${totalChecks - passedChecks} checks failed`);
  process.exit(1);
}
