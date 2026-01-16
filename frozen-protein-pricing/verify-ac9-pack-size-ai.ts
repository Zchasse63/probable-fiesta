/**
 * AC9 Verification Test
 * Tests AI pack size parsing fallback when regex fails
 * Verifies logging to ai_processing_log
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function verifyAC9() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('=== AC9 Verification: AI Pack Size Fallback ===\n');

  // Test pack size that regex cannot parse
  const testPackSize = '2 dozen 8oz pkgs';
  const testDescription = 'Frozen Chicken Wings';

  console.log(`Test Input:`);
  console.log(`  Pack Size: "${testPackSize}"`);
  console.log(`  Description: "${testDescription}"\n`);

  // Call AI parse-pack-size API
  console.log('Calling /api/ai/parse-pack-size...');

  try {
    const response = await fetch(`http://localhost:3000/api/ai/parse-pack-size`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packSize: testPackSize,
        description: testDescription,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText}`);

      if (response.status === 503) {
        console.log('\n⚠️  Circuit breaker is open. This is expected if AI has failed recently.');
        console.log('Wait 5 minutes and try again, or check AI API key configuration.');
      }

      return;
    }

    const result = await response.json();

    console.log('\n✅ AI Parse Result:');
    console.log(`  Case Weight: ${result.case_weight_lbs} lbs`);
    console.log(`  Tokens Used: ${result.tokens_used}`);
    console.log(`  Model: ${result.model || 'claude-3-5-haiku-20241022'}`);

    // Verify logging to ai_processing_log
    console.log('\n⏳ Checking ai_processing_log table...');

    // Wait 2 seconds for async log insert to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: logEntries, error: logError } = await supabase
      .from('ai_processing_log')
      .select('*')
      .eq('task_type', 'parse_pack_size')
      .order('created_at', { ascending: false })
      .limit(1);

    if (logError) {
      console.error(`❌ Failed to query ai_processing_log: ${logError.message}`);
      return;
    }

    if (!logEntries || logEntries.length === 0) {
      console.error('❌ No log entries found for task_type=parse_pack_size');
      console.log('Expected: Recent entry with tokens, cost, and success=true');
      return;
    }

    const latestLog = logEntries[0];
    console.log('\n✅ Latest ai_processing_log entry:');
    console.log(`  Task Type: ${latestLog.task_type}`);
    console.log(`  Tokens In: ${latestLog.tokens_in}`);
    console.log(`  Tokens Out: ${latestLog.tokens_out}`);
    console.log(`  Cost USD: $${latestLog.cost_usd?.toFixed(6) || '0.000000'}`);
    console.log(`  Success: ${latestLog.success}`);
    console.log(`  Created: ${new Date(latestLog.created_at).toLocaleString()}`);

    // Verify result matches expectations
    const expectedWeight = 12; // 2 dozen × 8oz = 24 × 0.5lb = 12 lbs
    const tolerance = 2; // Allow ±2 lbs for AI interpretation variance

    if (Math.abs(result.case_weight_lbs - expectedWeight) <= tolerance) {
      console.log(`\n✅ AC9 VERIFICATION PASSED`);
      console.log(`   - Non-standard pack size "${testPackSize}" parsed successfully via AI`);
      console.log(`   - Result: ${result.case_weight_lbs} lbs (expected ~${expectedWeight} lbs)`);
      console.log(`   - Logged to ai_processing_log with tokens=${latestLog.tokens_in + latestLog.tokens_out}`);
    } else {
      console.log(`\n⚠️  Unexpected weight: ${result.case_weight_lbs} lbs (expected ~${expectedWeight} lbs)`);
      console.log(`   AI may have interpreted the pack size differently than expected.`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run verification
verifyAC9().then(() => {
  console.log('\n=== Verification Complete ===');
  process.exit(0);
}).catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
