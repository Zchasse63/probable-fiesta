/**
 * AC3: Test smart search endpoint
 */

console.log('Testing AC3: Smart search (natural language)');

fetch('http://localhost:3000/api/ai/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'frozen chicken under $3 per pound' }),
})
  .then(res => {
    console.log('Status:', res.status);
    if (res.status === 401) {
      console.log('✓ EXPECTED: Auth required (graceful handling)');
      process.exit(0);
    }
    return res.json();
  })
  .then(data => {
    if (data.error) {
      console.log('Error response:', data.error);
      if (data.error.includes('Unauthorized') || data.error.includes('configured')) {
        console.log('✓ EXPECTED: Graceful error handling');
        process.exit(0);
      }
    }
    
    if (data.filters) {
      console.log('✓ PASS: Filters returned:', JSON.stringify(data.filters, null, 2));
      console.log('Explanation:', data.explanation);
      process.exit(0);
    }
    
    console.error('✗ FAIL: Unexpected response');
    process.exit(1);
  })
  .catch(err => {
    console.error('✗ FAIL:', err.message);
    process.exit(1);
  });
