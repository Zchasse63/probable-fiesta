// Test AC1: AI successfully parses manufacturer deal email
const sampleEmail = `
From: SupplyChain@tyson.com
Subject: Special Deal - Chicken Breast

Hi there,

We have a special deal on Boneless Skinless Chicken Breast:

Product: Tyson Boneless Skinless Chicken Breast
Price: $2.45/lb
Quantity Available: 40,000 lbs
Pack Size: 4/10 lb
Expiration: March 15, 2026

Terms: Payment Net 30

Let me know if interested!
`;

async function testAC1() {
  try {
    const response = await fetch('http://localhost:3000/api/ai/parse-deal', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': process.env.AUTH_COOKIE || ''
      },
      body: JSON.stringify({ content: sampleEmail }),
    });

    const result = await response.json();
    
    console.log('AC1 Test Result:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.status === 200 && result.deal) {
      console.log('\nValidation:');
      console.log('- Manufacturer:', result.deal.manufacturer || 'MISSING');
      console.log('- Product:', result.deal.product_description || 'MISSING');
      console.log('- Price/lb:', result.deal.price_per_lb || 'MISSING');
      console.log('- Quantity:', result.deal.quantity_lbs || 'MISSING');
      console.log('- Pack Size:', result.deal.pack_size || 'MISSING');
      console.log('- Status:', result.deal.status || 'MISSING');
      
      if (result.deal.manufacturer && 
          result.deal.product_description && 
          result.deal.price_per_lb > 0 && 
          result.deal.quantity_lbs > 0 &&
          result.deal.status === 'pending') {
        console.log('\n✓ AC1 PASS: All required fields extracted');
        process.exit(0);
      } else {
        console.log('\n✗ AC1 FAIL: Missing required fields');
        process.exit(1);
      }
    } else {
      console.log('\n✗ AC1 FAIL:', result.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ AC1 FAIL:', error.message);
    process.exit(1);
  }
}

testAC1();
