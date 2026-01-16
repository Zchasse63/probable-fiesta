/**
 * AC2: Address normalization corrects malformed addresses
 * Verification: POST to /api/ai/normalize-address with messy address
 */

async function testNormalizeAddress() {
  console.log('Testing AC2: Address Normalization\n');

  const testAddress = '123 main st nyc';

  try {
    const response = await fetch('http://localhost:3000/api/ai/normalize-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: testAddress,
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
    if (!data.normalized || !data.corrections || !data.tokens_used) {
      console.error('❌ Missing required fields in response');
      return false;
    }

    const { normalized } = data;

    // Verify normalized address has required fields
    if (!normalized.street || !normalized.city || !normalized.state) {
      console.error('❌ Missing required fields in normalized address');
      return false;
    }

    console.log('\n✅ AC2 PASSED');
    console.log(`- Original: "${testAddress}"`);
    console.log(`- Street: ${normalized.street}`);
    console.log(`- City: ${normalized.city}`);
    console.log(`- State: ${normalized.state}`);
    console.log(`- ZIP: ${normalized.zip || 'null'}`);
    console.log(`- Corrections: ${data.corrections.length > 0 ? data.corrections.join(', ') : 'None'}`);
    console.log(`- Tokens Used: ${data.tokens_used.input_tokens} in, ${data.tokens_used.output_tokens} out`);

    return true;

  } catch (error: unknown) {
    console.error('❌ Test failed with error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

testNormalizeAddress().then((success) => {
  process.exit(success ? 0 : 1);
});
