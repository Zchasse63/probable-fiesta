/**
 * Excel Parser Utility
 * Parses inventory Excel files to structured data
 * Phase 2: Database Schema & Core Data Management
 */

import * as XLSX from 'xlsx';

export interface ParsedRow {
  item_code: string;
  description: string;
  pack_size: string;
  brand?: string;
  cases_available?: number;
  unit_cost?: number;
  category?: string;
  ai_suggested?: boolean;
  case_weight_lbs?: number;
}

/**
 * Parses an inventory Excel file and extracts product data
 * @param file - Excel file (.xlsx, .xls)
 * @returns Array of parsed product rows
 * @throws Error if file is invalid or required columns are missing
 */
export async function parseInventoryExcel(file: File): Promise<ParsedRow[]> {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse workbook
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel file contains no worksheets');
    }

    const worksheet = workbook.Sheets[firstSheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string | number>>(worksheet);

    if (jsonData.length === 0) {
      throw new Error('Excel file is empty');
    }

    // Map columns to our schema
    const parsed: ParsedRow[] = jsonData.map((row, index) => {
      // Required fields
      const item_code = row['Item Code'] || row['item_code'] || row['ItemCode'];
      const description = row['Description'] || row['description'];
      const pack_size = row['Pack Size'] || row['pack_size'] || row['PackSize'];

      // Validate required fields
      if (!item_code) {
        throw new Error(`Row ${index + 2}: Missing required field 'Item Code'`);
      }
      if (!description) {
        throw new Error(`Row ${index + 2}: Missing required field 'Description'`);
      }
      if (!pack_size) {
        throw new Error(`Row ${index + 2}: Missing required field 'Pack Size'`);
      }

      // Optional fields
      const brand = row['Brand'] || row['brand'];
      const cases_available = row['Cases Available'] || row['cases_available'] || row['Cases'] || row['cases'];
      const unit_cost = row['Unit Cost'] || row['unit_cost'] || row['Cost'] || row['cost'];
      const category = row['Category'] || row['category'];

      return {
        item_code: String(item_code).trim(),
        description: String(description).trim(),
        pack_size: String(pack_size).trim(),
        brand: brand ? String(brand).trim() : undefined,
        cases_available: cases_available ? Number(cases_available) : undefined,
        unit_cost: unit_cost ? Number(unit_cost) : undefined,
        category: category ? String(category).trim() : undefined,
      };
    });

    return parsed;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse Excel file: Unknown error');
  }
}
