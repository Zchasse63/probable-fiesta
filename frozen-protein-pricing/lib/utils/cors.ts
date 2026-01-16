/**
 * CORS utilities for API routes
 * Prevents CSRF attacks on AI endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'https://localhost:3000'] : []),
];

export function validateCORS(request: NextRequest): boolean {
  const origin = request.headers.get('origin');

  // Reject POST requests without origin header (prevents curl/server-to-server bypass)
  // GET requests without origin are allowed (browser same-origin, PDFs, etc.)
  if (!origin) {
    return request.method === 'GET';
  }

  return ALLOWED_ORIGINS.includes(origin);
}

export function addCORSHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export function handleCORSPreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return addCORSHeaders(response, request);
  }
  return null;
}

export function withCORS(handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // Handle preflight
    const preflightResponse = handleCORSPreflight(request);
    if (preflightResponse) {
      return preflightResponse;
    }

    // Validate origin
    if (!validateCORS(request)) {
      return new NextResponse(JSON.stringify({ error: 'CORS policy violation' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Execute handler
    const response = await handler(request, ...args);

    // Add CORS headers to response
    return addCORSHeaders(response, request);
  };
}
