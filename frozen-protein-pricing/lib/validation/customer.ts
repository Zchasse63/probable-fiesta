import type { Insert } from '@/lib/supabase/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCustomer(data: Partial<Insert<'customers'>>): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.company_name || typeof data.company_name !== 'string' || data.company_name.trim().length === 0) {
    errors.push('company_name is required');
  } else if (data.company_name.length > 255) {
    errors.push('company_name must be 255 characters or less');
  }

  // Address is optional - only validate if provided
  // Address is required for geocoding but not for customer record creation

  // Zone ID validation
  if (data.zone_id !== null && data.zone_id !== undefined) {
    if (typeof data.zone_id !== 'number' || data.zone_id < 1 || data.zone_id > 4) {
      errors.push('zone_id must be a number between 1 and 4');
    }
  }

  // Email validation
  if (data.contact_email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(data.contact_email)) {
      errors.push('contact_email must be a valid email address');
    }
    if (data.contact_email.length > 255) {
      errors.push('contact_email must be 255 characters or less');
    }
  }

  // Latitude/longitude bounds
  if (data.lat !== null && data.lat !== undefined) {
    if (typeof data.lat !== 'number' || data.lat < -90 || data.lat > 90) {
      errors.push('lat must be a number between -90 and 90');
    }
  }

  if (data.lng !== null && data.lng !== undefined) {
    if (typeof data.lng !== 'number' || data.lng < -180 || data.lng > 180) {
      errors.push('lng must be a number between -180 and 180');
    }
  }

  // State validation (US states only)
  if (data.state) {
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    if (!validStates.includes(data.state.toUpperCase())) {
      errors.push('state must be a valid US state abbreviation');
    }
  }

  // Customer type validation
  if (data.customer_type) {
    const validTypes = ['food_distributor', 'paper_janitorial', 'other'];
    if (!validTypes.includes(data.customer_type)) {
      errors.push('customer_type must be one of: food_distributor, paper_janitorial, other');
    }
  }

  // String length validations
  if (data.address && data.address.length > 255) {
    errors.push('address must be 255 characters or less');
  }

  if (data.city && data.city.length > 100) {
    errors.push('city must be 100 characters or less');
  }

  if (data.zip && data.zip.length > 20) {
    errors.push('zip must be 20 characters or less');
  }

  if (data.contact_name && data.contact_name.length > 255) {
    errors.push('contact_name must be 255 characters or less');
  }

  if (data.contact_phone && data.contact_phone.length > 50) {
    errors.push('contact_phone must be 50 characters or less');
  }

  if (data.notes && data.notes.length > 5000) {
    errors.push('notes must be 5000 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
