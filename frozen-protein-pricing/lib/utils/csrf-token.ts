import { createHash, randomBytes } from 'crypto';

// In-memory token storage (replace with Redis/database in production)
const tokenStore = new Map<string, { token: string; expires: number }>();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of tokenStore.entries()) {
    if (data.expires < now) {
      tokenStore.delete(userId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a CSRF token for a user session
 */
export function generateCsrfToken(userId: string): string {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour

  tokenStore.set(userId, { token, expires });
  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(userId: string, token: string): boolean {
  const stored = tokenStore.get(userId);

  if (!stored) {
    return false;
  }

  if (stored.expires < Date.now()) {
    tokenStore.delete(userId);
    return false;
  }

  // Timing-safe comparison
  const expectedBuffer = Buffer.from(stored.token);
  const actualBuffer = Buffer.from(token);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return createHash('sha256').update(expectedBuffer).digest().equals(
    createHash('sha256').update(actualBuffer).digest()
  );
}

/**
 * Rotate token after use (invalidate old one)
 */
export function rotateCsrfToken(userId: string): string {
  tokenStore.delete(userId);
  return generateCsrfToken(userId);
}
