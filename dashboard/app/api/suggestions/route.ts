import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type TagRow = { id: string; name: string; slug: string; description: string | null; is_active: boolean };
type MappingRow = { event_id: string; tag_id: string };
type WishlistRow = { user_id: string; event_id: string; created_at: string };
type ProfileRow = { id: string; full_name: string | null; username: string | null; email: string | null; phone: string | null; avatar_url: string | null; bio: string | null };

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const { data: roles, error } = await supabase.rpc('get_my_dashboard_roles');
  if (error || !Array.isArray(roles) || !roles.includes('SUPER_ADMIN')) return { error: NextResponse.json({ error: 'Only Super Admins can view suggestions.' }, { status: 403 }) };
  return { admin: getSupabaseAdmin() };
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ('error' in auth) return auth.error;
  try {
    const tagId = request.nextUrl.searchParams.get('tag_id');
    const { data: tags, error: tagError } = await auth.admin.from('event_tags').select('id,name,slug,description,is_active').order('name');
    if (tagError) throw tagError;
    const tagRows = (tags ?? []) as TagRow[];
    const { data: mappings, error: mappingError } = await auth.admin.from('event_tag_mappings').select('event_id,tag_id');
    if (mappingError) throw mappingError;
    const mappingRows = (mappings ?? []) as MappingRow[];
    const relevantTagIds = tagId ? new Set([tagId]) : new Set(tagRows.map(tag => tag.id));
    const eventIds = [...new Set(mappingRows.filter(row => relevantTagIds.has(row.tag_id)).map(row => row.event_id))];
    let wishlists: WishlistRow[] = [];
    if (eventIds.length) {
      const { data, error } = await auth.admin.from('event_wishlists').select('user_id,event_id,created_at').in('event_id', eventIds);
      if (error) throw error;
      wishlists = (data ?? []) as WishlistRow[];
    }
    const profilesById = new Map<string, ProfileRow>();
    if (wishlists.length) {
      const ids = [...new Set(wishlists.map(row => row.user_id))];
      const { data, error } = await auth.admin.from('profiles').select('id,full_name,username,email,phone,avatar_url,bio').in('id', ids);
      if (error) throw error;
      for (const profile of (data ?? []) as ProfileRow[]) profilesById.set(profile.id, profile);
    }
    const countByTag = new Map<string, Set<string>>();
    for (const row of mappingRows) {
      if (!relevantTagIds.has(row.tag_id)) continue;
      const users = countByTag.get(row.tag_id) ?? new Set<string>();
      for (const wish of wishlists) if (wish.event_id === row.event_id) users.add(wish.user_id);
      countByTag.set(row.tag_id, users);
    }
    const tagSummary = tagRows.filter(tag => relevantTagIds.has(tag.id)).map(tag => ({ ...tag, interested_users: countByTag.get(tag.id)?.size ?? 0, events: new Set(mappingRows.filter(row => row.tag_id === tag.id).map(row => row.event_id)).size }));
    const selectedUsers = new Map<string, { profile: ProfileRow | null; wishlist_count: number; wishlisted_events: string[]; first_wishlisted_at: string }>();
    for (const wish of wishlists) {
      const existing = selectedUsers.get(wish.user_id);
      if (existing) { existing.wishlist_count += 1; existing.wishlisted_events.push(wish.event_id); if (wish.created_at < existing.first_wishlisted_at) existing.first_wishlisted_at = wish.created_at; }
      else selectedUsers.set(wish.user_id, { profile: profilesById.get(wish.user_id) ?? null, wishlist_count: 1, wishlisted_events: [wish.event_id], first_wishlisted_at: wish.created_at });
    }
    return NextResponse.json({ tags: tagSummary, selected_tag_id: tagId, users: [...selectedUsers.values()] });
  } catch (error) {
    console.error('[SUGGESTIONS][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load suggestions.' }, { status: 500 });
  }
}
