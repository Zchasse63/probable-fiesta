/**
 * AC3: Pack size AI fallback parses non-standard pack sizes
 * Verification: POST to /api/ai/parse-pack-size with non-standard pack size
 */

async function testParsePackSize() {
  console.log('Testing AC3: Pack Size AI Fallback\n');

  const testPackSize = 'approx 40 pounds per case';
  const testDescription = 'Frozen chicken breast';

  try {
    const response = await fetch('http://localhost:3000/api/ai/parse-pack-size', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packSize: testPackSize,
        description: testDescription,
      }),
    });

    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ API call failed');
      return false;
    }

    // Verify response structure
    if (typeof data.case_weight_lbs !== 'number' || !data.tokens_used) {
      console.error('❌ Missing required fields in response');
      return false;
    }

    console.log('\n✅ AC3 PASSED');
    console.log(`- Pack Size: "${testPackSize}"`);
    console.log(`- Parsed Weight: ${data.case_weight_lbs} lbs`);
    console.log(`- Tokens Used: ${data.tokens_used.input_tokens} in, ${data.tokens_used.output_tokens} out`);

    return true;

  } catch (error: unknown) {
    console.error('❌ Test failed with error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

testParsePackSize().then((success) => {
  process.exit(success ? 0 : 1);
});
