/**
 * Supabase Server Client
 * For server-side queries in API routes and server components
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export const createServerClient = async () => {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Cookie setting can fail in some contexts
          }
        },
      },
    }
  );
};

// Alias for backward compatibility with Phase 1 code
export const createClient = createServerClient;

/**
 * Create Supabase client for API routes that accept Bearer token in Authorization header
 * Used for API routes that need to authenticate via JWT instead of cookies
 */
export const createClientFromRequest = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  return supabase;
};
