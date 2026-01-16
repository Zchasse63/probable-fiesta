/**
 * AC4: Smart search converts natural language query to product filters
 * Verification: POST to /api/ai/search with natural language query
 */

async function testSmartSearch() {
  console.log('Testing AC4: Smart Search (Natural Language to Filters)\n');

  const testQuery = 'frozen chicken under $3 per pound from warehouse A';

  try {
    const response = await fetch('http://localhost:3000/api/ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
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
    if (!data.filters || !data.explanation || !data.tokens_used) {
      console.error('❌ Missing required fields in response');
      return false;
    }

    console.log('\n✅ AC4 PASSED');
    console.log(`- Query: "${testQuery}"`);
    console.log(`- Filters:`, JSON.stringify(data.filters, null, 2));
    console.log(`- Explanation: ${data.explanation}`);
    console.log(`- Tokens Used: ${data.tokens_used.input_tokens} in, ${data.tokens_used.output_tokens} out`);

    return true;

  } catch (error: unknown) {
    console.error('❌ Test failed with error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

testSmartSearch().then((success) => {
  process.exit(success ? 0 : 1);
});
