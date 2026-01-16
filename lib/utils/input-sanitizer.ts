/**
 * Input sanitization utilities for AI parsers
 * Prevents prompt injection and validates input format
 */

/**
 * Sanitize text input for AI processing
 * Removes common prompt injection patterns and malicious content
 */
export function sanitizeTextInput(input: string, maxLength: number = 10000): string {
  // Trim and truncate to max length
  let sanitized = input.trim().substring(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Replace excessive newlines (potential instruction injection)
  sanitized = sanitized.replace(/\n{5,}/g, '\n\n\n\n');

  // Remove potential system/instruction markers
  const dangerousPatterns = [
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /\[ASSISTANT\]/gi,
    /<\|system\|>/gi,
    /<\|user\|>/gi,
    /<\|assistant\|>/gi,
    /###\s*SYSTEM/gi,
    /###\s*INSTRUCTION/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}

/**
 * Validate email content format for deal parsing
 */
export function validateEmailContent(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content must be a non-empty string' };
  }

  if (content.length < 20) {
    return { valid: false, error: 'Content too short (minimum 20 characters)' };
  }

  if (content.length > 20000) {
    return { valid: false, error: 'Content too long (maximum 20,000 characters)' };
  }

  // Check for suspicious patterns including multi-line variants
  const suspiciousPatterns = [
    /ignore[\s\n]+(previous|above|prior)[\s\n]+instructions/i,
    /disregard[\s\n]+(previous|above|prior)[\s\n]+instructions/i,
    /you[\s\n]+are[\s\n]+now[\s\n]+(a|an)/i,
    /forget[\s\n]+(everything|all|previous|your)/i,
    /instead[\s\n]+of[\s\n]+(doing|following)/i,
    /new[\s\n]+system[\s\n]+prompt/i,
    /override[\s\n]+(previous|prior)[\s\n]+(instruction|prompt)/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: 'Content contains suspicious patterns' };
    }
  }

  // Check for Base64-encoded injection attempts (common evasion technique)
  const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
  const base64Matches = content.match(base64Pattern);
  if (base64Matches && base64Matches.length > 3) {
    try {
      // Decode and check for suspicious patterns in decoded content
      for (const match of base64Matches.slice(0, 3)) {
        const decoded = Buffer.from(match, 'base64').toString('utf-8');
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(decoded)) {
            return { valid: false, error: 'Content contains encoded suspicious patterns' };
          }
        }
      }
    } catch {
      // Invalid Base64, continue
    }
  }

  return { valid: true };
}

/**
 * Validate address string format
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address must be a non-empty string' };
  }

  const trimmed = address.trim();

  if (trimmed.length < 5) {
    return { valid: false, error: 'Address too short (minimum 5 characters)' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Address too long (maximum 500 characters)' };
  }

  return { valid: true };
}

/**
 * Validate pack size string format
 */
export function validatePackSize(packSize: string): { valid: boolean; error?: string } {
  if (!packSize || typeof packSize !== 'string') {
    return { valid: false, error: 'Pack size must be a non-empty string' };
  }

  const trimmed = packSize.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: 'Pack size cannot be empty' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Pack size too long (maximum 200 characters)' };
  }

  return { valid: true };
}

/**
 * Validate product description for categorization
 */
export function validateDescription(description: string): { valid: boolean; error?: string } {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Description must be a non-empty string' };
  }

  const trimmed = description.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Description too short (minimum 3 characters)' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Description too long (maximum 500 characters)' };
  }

  return { valid: true };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): { valid: boolean; error?: string } {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query must be a non-empty string' };
  }

  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: 'Query too short (minimum 2 characters)' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Query too long (maximum 500 characters)' };
  }

  return { valid: true };
}

/**
 * Sanitize AI-generated structured output
 * Prevents XSS and injection from AI-returned data
 */
export function sanitizeAIOutput(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove script tags and event handlers
      let clean = value.replace(/<script[^>]*>.*?<\/script>/gi, '');
      clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
      clean = clean.replace(/javascript:/gi, '');
      clean = clean.replace(/data:text\/html/gi, '');

      // Limit length for display fields
      if (key.includes('description') || key.includes('terms')) {
        clean = clean.substring(0, 5000);
      }

      sanitized[key] = clean;
    } else if (typeof value === 'number') {
      // Validate numeric bounds
      if (isNaN(value) || !isFinite(value)) {
        sanitized[key] = 0;
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeAIOutput(value as Record<string, unknown>);
    } else {
      // Skip arrays and other types
      sanitized[key] = value;
    }
  }

  return sanitized;
}
