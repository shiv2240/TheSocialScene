import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Consume a fixed-window rate-limit bucket in Postgres. Identifiers are hashed
 * before storage so phone numbers, user IDs and OTP session IDs are not stored.
 */
export async function consumeRateLimit(
  supabase: SupabaseClient,
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const hashSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hashSecret) throw new Error('Server rate-limit hashing is not configured.');
  const bucketKey = createHmac('sha256', hashSecret).update(`${scope}:${identifier}`).digest('hex');
  const { data, error } = await supabase.rpc('consume_api_rate_limit', {
    p_bucket_key: bucketKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error('[RATE LIMIT][DATABASE]', error);
    throw new Error('Unable to verify request limits. Please try again later.');
  }

  return data === true;
}
