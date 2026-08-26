import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const EVENT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'EDITOR']);
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
type RoleRow = { roles: { name?: string } | { name?: string }[] | null };

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (!profile) return NextResponse.json({ error: 'Staff profile not found.' }, { status: 400 });

    const { data: roleRows, error: roleError } = await admin.from('user_roles').select('roles(name)').eq('user_id', profile.id);
    if (roleError) throw roleError;
    const roles: string[] = [];
    for (const row of (roleRows ?? []) as RoleRow[]) {
      const value = row.roles;
      const names = Array.isArray(value) ? value.map((item) => item?.name) : [value?.name];
      for (const name of names) if (name) roles.push(name);
    }
    if (!roles.some((role) => EVENT_ROLES.has(role))) return NextResponse.json({ error: 'You do not have permission to upload event media.' }, { status: 403 });

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Please select an image file.' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Only JPG, PNG and WebP images are supported.' }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be between 1 byte and 5 MB.' }, { status: 400 });

    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const path = `covers/${profile.id}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage.from('event-images').upload(path, bytes, { contentType: file.type, cacheControl: '31536000', upsert: false });
    if (uploadError) throw uploadError;

    const { data } = admin.storage.from('event-images').getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN EVENTS][UPLOAD IMAGE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to upload image.' }, { status: 500 });
  }
}
