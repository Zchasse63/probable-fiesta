#!/usr/bin/env ts-node
/**
 * Script to add CORS protection to all AI routes
 */

import * as fs from 'fs';
import * as path from 'path';

const AI_ROUTES_DIR = path.join(__dirname, '../app/api/ai');

const routes = [
  'normalize-address/route.ts',
  'search/route.ts',
  'parse-pack-size/route.ts',
];

for (const route of routes) {
  const filePath = path.join(AI_ROUTES_DIR, route);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add CORS imports if not present
  if (!content.includes('validateCORS')) {
    content = content.replace(
      "import { sanitizeTextInput } from '@/lib/utils/input-sanitizer';",
      "import { sanitizeTextInput } from '@/lib/utils/input-sanitizer';\nimport { validateCORS, addCORSHeaders } from '@/lib/utils/cors';"
    );
  }

  // Rename existing POST to handlePOST and add CORS check
  if (!content.includes('async function handlePOST')) {
    content = content.replace(
      'export async function POST(request: NextRequest) {\n  // Try Bearer token first',
      'async function handlePOST(request: NextRequest) {\n  // CORS validation\n  if (!validateCORS(request)) {\n    return NextResponse.json({ error: \'Forbidden\' }, { status: 403 });\n  }\n\n  // Try Bearer token first'
    );

    // Add new POST export with CORS headers
    content = content.replace(
      /\}\s*$/,
      `}

export async function POST(request: NextRequest) {
  const response = await handlePOST(request);
  return addCORSHeaders(response, request);
}

export async function OPTIONS(request: NextRequest) {
  return addCORSHeaders(new NextResponse(null, { status: 204 }), request);
}
`
    );
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Updated ${route}`);
}

console.log('All AI routes updated with CORS protection');
