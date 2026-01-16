/**
 * AC1: AI successfully parses manufacturer deal email
 * Verification: POST to /api/ai/parse-deal with sample deal email
 */

const SAMPLE_DEAL_EMAIL = `
From: sales@poultrypros.com
Subject: Special Deal - Boneless Skinless Chicken Breast

Hi there,

We have a great deal on boneless skinless chicken breast this week:

Product: Grade A Boneless Skinless Chicken Breast
Price: $2.45 per pound
Quantity: 40,000 lbs available
Pack Size: 40 lb case
Expiration: March 15, 2026
Terms: FOB our warehouse, payment net 30

Let me know if you're interested!

Best,
Sales Team
`;

async function testParseDeal() {
  console.log('Testing AC1: Parse Deal Email\n');

  try {
    const response = await fetch('http://localhost:3000/api/ai/parse-deal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: SAMPLE_DEAL_EMAIL,
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
    if (!data.deal || !data.dealId || !data.tokens_used) {
      console.error('❌ Missing required fields in response');
      return false;
    }

    // Verify extracted fields
    const { deal } = data;
    const requiredFields = ['manufacturer', 'product_description', 'price_per_lb', 'quantity_lbs', 'pack_size'];

    for (const field of requiredFields) {
      if (!deal[field] && deal[field] !== 0) {
        console.error(`❌ Missing required field: ${field}`);
        return false;
      }
    }

    console.log('\n✅ AC1 PASSED');
    console.log(`- Manufacturer: ${deal.manufacturer}`);
    console.log(`- Product: ${deal.product_description}`);
    console.log(`- Price/lb: $${deal.price_per_lb}`);
    console.log(`- Quantity: ${deal.quantity_lbs} lbs`);
    console.log(`- Pack Size: ${deal.pack_size}`);
    console.log(`- Deal ID: ${data.dealId}`);
    console.log(`- Tokens Used: ${data.tokens_used.input_tokens} in, ${data.tokens_used.output_tokens} out`);

    return true;

  } catch (error: unknown) {
    console.error('❌ Test failed with error:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

testParseDeal().then((success) => {
  process.exit(success ? 0 : 1);
});
