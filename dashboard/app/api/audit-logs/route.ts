import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type AuditRow = { id: string; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown> | null; created_at: string };

export async function GET(request: Request) {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const limitParam = Number(new URL(request.url).searchParams.get('limit') || 100);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(Math.trunc(limitParam), 1), 200) : 100;
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('audit_logs').select('id,actor_user_id,action,entity_type,entity_id,metadata,created_at').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return NextResponse.json({ logs: (data ?? []) as AuditRow[] });
  } catch (error) {
    console.error('[AUDIT LOGS][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load audit logs.' }, { status: 500 });
  }
}
