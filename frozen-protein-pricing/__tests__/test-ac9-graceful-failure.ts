/**
 * AC9: AI failures degrade gracefully without breaking app functionality
 * Verification: Test AI endpoints without ANTHROPIC_API_KEY to verify graceful degradation
 */

async function testGracefulFailure() {
  console.log('Testing AC9: Graceful AI Failure Degradation\n');

  const tests = [
    {
      name: 'Parse Deal (AI unavailable)',
      url: 'http://localhost:3000/api/ai/parse-deal',
      body: { content: 'Test email content' },
      expectedStatus: [500, 503],
    },
    {
      name: 'Normalize Address (AI unavailable)',
      url: 'http://localhost:3000/api/ai/normalize-address',
      body: { address: '123 main st' },
      expectedStatus: [500, 503],
    },
    {
      name: 'Parse Pack Size (AI unavailable)',
      url: 'http://localhost:3000/api/ai/parse-pack-size',
      body: { packSize: '40 lbs', description: 'chicken' },
      expectedStatus: [500, 503],
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      console.log(`\nTest: ${test.name}`);

      const response = await fetch(test.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body),
      });

      const data = await response.json();

      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(data, null, 2));

      // Verify error response is clean and informative
      if (!data.error) {
        console.error('❌ No error message provided');
        allPassed = false;
        continue;
      }

      // Verify status code is appropriate
      if (!test.expectedStatus.includes(response.status)) {
        console.error(`❌ Unexpected status code: ${response.status}`);
        allPassed = false;
        continue;
      }

      // Verify no crash or stack traces in response
      if (data.stack || JSON.stringify(data).includes('Error:')) {
        console.error('❌ Error response contains stack traces (security issue)');
        allPassed = false;
        continue;
      }

      console.log('✅ Graceful error handling confirmed');
    } catch (error: unknown) {
      console.error(`❌ Test "${test.name}" failed with exception:`, error instanceof Error ? error.message : String(error));
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ AC9 PASSED: All AI endpoints degrade gracefully');
    return true;
  } else {
    console.log('❌ AC9 FAILED: Some endpoints do not degrade gracefully');
    return false;
  }
}

testGracefulFailure().then((success) => {
  process.exit(success ? 0 : 1);
});
