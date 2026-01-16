// Integration test without AI dependencies
import { generatePriceSheetExcel } from '../lib/export/excel';
import * as fs from 'fs';
import * as path from 'path';

async function testExcelGeneration() {
  console.log('Testing Excel generation...');
  
  const data = {
    zone_name: 'Integration Test Zone',
    generated_date: new Date().toISOString(),
    products: [
      {
        product_code: 'TEST-001',
        description: 'Test Product 1',
        pack_size: '4/10 lb',
        brand: 'Test Brand',
        availability: 'In Stock',
        price_per_lb: 2.99,
        warehouse_name: 'Warehouse A',
      },
      {
        product_code: 'TEST-002',
        description: 'Test Product 2',
        pack_size: '6/5 lb',
        brand: 'Test Brand',
        availability: 'Limited',
        price_per_lb: 3.49,
        warehouse_name: 'Warehouse B',
      },
    ],
  };

  const buffer = await generatePriceSheetExcel(data);
  
  console.log(`✓ Excel buffer generated: ${buffer.length} bytes`);
  
  const testFile = path.join(__dirname, 'integration-test.xlsx');
  fs.writeFileSync(testFile, buffer);
  console.log(`✓ Excel file written: ${testFile}`);
  
  return buffer.length > 0;
}

async function testPDFImport() {
  console.log('Testing PDF imports...');
  try {
    const { PriceSheetPDF } = await import('../lib/export/pdf');
    console.log('✓ PriceSheetPDF component imported');
    return true;
  } catch (error) {
    console.log(`✗ PDF import failed: ${error}`);
    return false;
  }
}

async function main() {
  console.log('=== Integration Test Suite (No AI) ===\n');
  
  const excelPass = await testExcelGeneration();
  console.log('');
  
  const pdfPass = await testPDFImport();
  console.log('');
  
  const allPass = excelPass && pdfPass;
  
  console.log('=================================');
  if (allPass) {
    console.log('✅ All integration tests passed');
  } else {
    console.log('❌ Some integration tests failed');
  }
  console.log('=================================');
  
  process.exit(allPass ? 0 : 1);
}

main();
