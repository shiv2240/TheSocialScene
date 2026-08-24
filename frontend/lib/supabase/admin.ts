import { createClient } from '@supabase/supabase-js';

let cachedClient: ReturnType<typeof createClient> | undefined;

// The project does not currently ship generated Supabase Database types.
// Keep this server-only client untyped so API routes can work against the live schema.
export function getSupabaseAdmin(): any {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server environment variables are not configured.');
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}
