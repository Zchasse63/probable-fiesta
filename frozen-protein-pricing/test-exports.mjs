// Test export functionality without requiring authentication
import { generatePriceSheetExcel } from './lib/export/excel.ts';

const testData = {
  zone_name: 'Zone A',
  generated_date: new Date().toLocaleDateString(),
  products: [
    {
      product_code: 'TEST001',
      description: 'Test Product 1',
      pack_size: '4/5lb',
      brand: 'Test Brand',
      availability: 'In Stock',
      price_per_lb: 2.99,
      warehouse_name: 'Warehouse A',
      spec_sheet_url: null
    },
    {
      product_code: 'TEST002',
      description: 'Test Product 2',
      pack_size: '6/2lb',
      brand: 'Test Brand',
      availability: 'Out of Stock',
      price_per_lb: 3.49,
      warehouse_name: 'Warehouse B',
      spec_sheet_url: null
    }
  ]
};

console.log('Testing Excel export generation...');
try {
  const buffer = await generatePriceSheetExcel(testData);
  console.log('✓ Excel export generated:', buffer.length, 'bytes');
  
  if (buffer.length < 100) {
    console.error('✗ Buffer suspiciously small');
    process.exit(1);
  }
  
  console.log('✓ Excel export test PASSED');
  process.exit(0);
} catch (error) {
  console.error('✗ Excel export test FAILED:', error.message);
  process.exit(1);
}
