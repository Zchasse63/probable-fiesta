import * as XLSX from 'xlsx';
import type { Insert } from '@/lib/supabase/types';

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  row: number;
  errors: ValidationError[];
}

interface ParseResult {
  valid: Insert<'customers'>[];
  invalid: ValidationResult[];
}

type SheetRow = (string | number | null)[];

/**
 * Parse CSV or Excel file to array of rows
 */
export async function parseCustomerFile(file: File): Promise<SheetRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Get first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of arrays
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as SheetRow[];

  return data;
}

/**
 * Map file columns to customer schema
 */
export function mapColumns(
  data: SheetRow[],
  mapping: Record<string, string>
): Partial<Insert<'customers'>>[] {
  if (data.length === 0) {
    return [];
  }

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map((row) => {
    const customer: Partial<Insert<'customers'>> = {};

    Object.entries(mapping).forEach(([fileColumn, schemaField]) => {
      const columnIndex = headers.findIndex(
        (h) => h?.toString().toLowerCase() === fileColumn.toLowerCase()
      );

      if (columnIndex !== -1) {
        const value = row[columnIndex];
        const stringValue = value?.toString() || null;
        (customer as Record<string, string | number | null>)[schemaField] = stringValue;
      }
    });

    return customer;
  });
}

/**
 * Auto-detect common column mappings
 */
export function autoDetectColumns(headers: (string | number | null)[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const columnMappings: Record<string, string[]> = {
    company_name: ['company', 'company name', 'business name', 'name'],
    address: ['address', 'street', 'street address', 'address1'],
    city: ['city'],
    state: ['state', 'st'],
    zip: ['zip', 'zipcode', 'zip code', 'postal code'],
    customer_type: ['type', 'customer type', 'category'],
    contact_name: ['contact', 'contact name', 'name'],
    contact_email: ['email', 'contact email'],
    contact_phone: ['phone', 'contact phone', 'telephone'],
  };

  headers.forEach((header) => {
    if (header === null || header === undefined) return;
    const normalized = header.toString().toLowerCase().trim();
    const headerStr = header.toString();

    Object.entries(columnMappings).forEach(([schemaField, variants]) => {
      if (variants.includes(normalized)) {
        mapping[headerStr] = schemaField;
      }
    });
  });

  return mapping;
}

/**
 * Validate customer data
 */
export function validateCustomers(
  customers: Partial<Insert<'customers'>>[]
): ParseResult {
  const valid: Insert<'customers'>[] = [];
  const invalid: ValidationResult[] = [];

  customers.forEach((customer, index) => {
    const errors: ValidationError[] = [];

    // Required fields
    if (!customer.company_name) {
      errors.push({ field: 'company_name', message: 'Company name is required' });
    }

    // Address is optional - only required for geocoding
    // Skip address validation here to match validation/customer.ts

    // Email format validation
    if (customer.contact_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer.contact_email)) {
        errors.push({ field: 'contact_email', message: 'Invalid email format' });
      }
    }

    // Phone format validation (basic)
    if (customer.contact_phone) {
      const phoneRegex = /^\+?[\d\s\-()]+$/;
      if (!phoneRegex.test(customer.contact_phone)) {
        errors.push({ field: 'contact_phone', message: 'Invalid phone format' });
      }
    }

    // Customer type validation
    if (customer.customer_type) {
      const validTypes = ['food_distributor', 'paper_janitorial', 'other'];
      if (!validTypes.includes(customer.customer_type)) {
        errors.push({
          field: 'customer_type',
          message: `Customer type must be one of: ${validTypes.join(', ')}`,
        });
      }
    }

    if (errors.length === 0) {
      valid.push(customer as Insert<'customers'>);
    } else {
      invalid.push({ row: index + 2, errors }); // +2 because of header row and 0-indexed
    }
  });

  return { valid, invalid };
}
