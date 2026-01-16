/**
 * AC4 Validation: Deal inbox parses email, stores in DB with status=pending
 */

const SAMPLE_DEAL_EMAIL = `
From: wholesalebeef@example.com
Subject: Special Deal - Boneless Chicken Breast

Hi,

We have a great deal on boneless chicken breast this week:

Product: Frozen Boneless Skinless Chicken Breast
Price: $2.45 per pound
Quantity: 5,000 lbs available
Pack Size: 10/4 lb
Expiration: 2026-03-15
Terms: Payment NET 30, minimum order 500 lbs

Let me know if interested!

Best,
John Smith
Wholesale Beef Co.
`;

async function validateAC4() {
  console.log('=== AC4 VALIDATION: Deal Inbox Parser ===\n');
  
  const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    // Test the parse-deal endpoint
    const response = await fetch(`${apiUrl}/api/ai/parse-deal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: SAMPLE_DEAL_EMAIL,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ FAILED: API error', error);
      return false;
    }

    const result = await response.json();
    
    // Verify structure
    if (!result.deal || !result.dealId) {
      console.error('❌ FAILED: Missing deal or dealId in response');
      return false;
    }

    console.log('✅ Deal parsed successfully');
    console.log('Deal ID:', result.dealId);
    console.log('Manufacturer:', result.deal.manufacturer);
    console.log('Product:', result.deal.product_description);
    console.log('Price/lb:', result.deal.price_per_lb);
    console.log('Quantity:', result.deal.quantity_lbs);
    console.log('Pack Size:', result.deal.pack_size);
    
    // Check if required fields extracted
    const requiredFields = ['manufacturer', 'product_description', 'price_per_lb', 'quantity_lbs', 'pack_size'];
    for (const field of requiredFields) {
      if (!result.deal[field]) {
        console.error(`❌ FAILED: Missing required field: ${field}`);
        return false;
      }
    }

    console.log('\n✅ AC4 PASSED: Deal parsed and stored with status=pending');
    return true;
  } catch (error) {
    console.error('❌ FAILED: Exception thrown', error);
    return false;
  }
}

validateAC4().then(success => {
  process.exit(success ? 0 : 1);
});
