import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { join } from 'path';

console.log('📄 Creating test Excel file for AC6 verification...\n');

// Create test data with all 4 pack size formats from AC7
const testData = [
  {
    'Item Code': 'TEST001',
    Description: 'Chicken Breast Boneless Skinless',
    'Pack Size': '6/5 LB',
    Brand: 'Tyson',
    'Cases Available': 100,
    'Unit Cost': 89.99,
  },
  {
    'Item Code': 'TEST002',
    Description: 'Ground Beef 80/20',
    'Pack Size': '4x10LB',
    Brand: 'Koch',
    'Cases Available': 75,
    'Unit Cost': 125.5,
  },
  {
    'Item Code': 'TEST003',
    Description: 'Pork Chops Bone-In',
    'Pack Size': '40 LB',
    Brand: 'Perdue',
    'Cases Available': 50,
    'Unit Cost': 95.0,
  },
  {
    'Item Code': 'TEST004',
    Description: 'Turkey Wings',
    'Pack Size': '6-5#',
    Brand: 'Butterball',
    'Cases Available': 120,
    'Unit Cost': 67.5,
  },
  {
    'Item Code': 'TEST005',
    Description: 'Chicken Tenders',
    'Pack Size': '2x5 LB',
    Brand: 'Tyson',
    'Cases Available': 85,
    'Unit Cost': 72.25,
  },
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(testData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

// Write to file
const outputPath = join(__dirname, '..', 'test-inventory.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Created test Excel file: ${outputPath}`);
console.log(`\n📊 Test data includes:`);
console.log(`   - 5 products`);
console.log(`   - All 4 pack size formats from AC7:`);
console.log(`     • 6/5 LB → expected case_weight_lbs: 30`);
console.log(`     • 4x10LB → expected case_weight_lbs: 40`);
console.log(`     • 40 LB → expected case_weight_lbs: 40`);
console.log(`     • 6-5# → expected case_weight_lbs: 30`);
console.log(`     • 2x5 LB → expected case_weight_lbs: 10`);
console.log(`\n💡 Upload this file at: http://localhost:3000/inventory\n`);
