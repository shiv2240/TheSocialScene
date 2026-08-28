import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentDashboardRoles, hasDashboardRole, isOnlyHostRole } from '@/lib/dashboard-rbac';
import type { DashboardRole } from '@/lib/auth';

export const runtime = 'nodejs';
const REGISTRATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'SUPPORT'] as const;
type AuthContext = { admin: ReturnType<typeof getSupabaseAdmin>; profileId: string; roles: DashboardRole[] };

async function requireRegistrationAccess(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { roles, error: roleError } = await getCurrentDashboardRoles(supabase);
  if (roleError || !roles.length) return NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 403 });
  if (!hasDashboardRole(roles, REGISTRATION_ROLES)) return NextResponse.json({ error: 'You do not have registration access.' }, { status: 403 });
  const admin = getSupabaseAdmin();
  const { data: profile, error } = await admin.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (error || !profile) return NextResponse.json({ error: 'Dashboard profile not found.' }, { status: 400 });
  return { admin, profileId: profile.id, roles };
}
function isResponse(value: AuthContext | NextResponse): value is NextResponse { return value instanceof NextResponse; }
async function ensureEventAccess(auth: AuthContext, eventId: string) {
  const { data: event, error } = await auth.admin.from('events').select('id,title,slug,host_id,start_at,end_at,capacity,registered_count,price,currency,status,registration_open,cover_image').eq('id', eventId).maybeSingle();
  if (error) throw error;
  if (!event) return { error: NextResponse.json({ error: 'Event not found.' }, { status: 404 }) };
  if (isOnlyHostRole(auth.roles) && event.host_id !== auth.profileId) return { error: NextResponse.json({ error: 'You do not have access to this event.' }, { status: 403 }) };
  return { event };
}

export async function GET(request: NextRequest) {
  const auth = await requireRegistrationAccess();
  if (isResponse(auth)) return auth;
  try {
    const eventId = request.nextUrl.searchParams.get('event_id');
    if (eventId) {
      const eventResult = await ensureEventAccess(auth, eventId);
      if ('error' in eventResult) return eventResult.error;
      const { data: registrations, error } = await auth.admin.from('registrations').select('id,registration_number,event_id,user_id,status,total_amount,currency,created_at,updated_at,events!inner(id,title,slug,host_id,start_at,end_at,capacity,registered_count,price,currency,status,registration_open,cover_image),profiles!inner(id,full_name,email,phone,avatar_url,bio,created_at),tickets(ticket_code,status)').eq('event_id', eventId).order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ event: eventResult.event, registrations: registrations ?? [] });
    }
    let eventQuery = auth.admin.from('events').select('id,title,slug,start_at,end_at,capacity,registered_count,price,currency,status,registration_open,cover_image,host_id').order('start_at', { ascending: false }).limit(250);
    if (isOnlyHostRole(auth.roles)) eventQuery = eventQuery.eq('host_id', auth.profileId);
    const { data: events, error: eventsError } = await eventQuery;
    if (eventsError) throw eventsError;
    return NextResponse.json({ events: events ?? [] });
  } catch (error) {
    console.error('[ADMIN REGISTRATIONS][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load registrations.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRegistrationAccess();
  if (isResponse(auth)) return auth;
  try {
    const body = await request.json();
    const eventId = typeof body?.event_id === 'string' ? body.event_id : '';
    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const amount = Number(body?.total_amount ?? 0);
    if (!eventId || fullName.length < 2 || !email || Number.isNaN(amount) || amount < 0) return NextResponse.json({ error: 'Event, name, email and a valid amount are required.' }, { status: 400 });
    const eventResult = await ensureEventAccess(auth, eventId);
    if ('error' in eventResult) return eventResult.error;
    const event = eventResult.event;
    if (Number(event.registered_count ?? 0) >= Number(event.capacity ?? 0)) return NextResponse.json({ error: 'This event is at capacity.' }, { status: 409 });
    const admin = auth.admin;
    let { data: profile, error: profileLookupError } = await admin.from('profiles').select('id,full_name,email,phone,avatar_url,bio,created_at').ilike('email', email).maybeSingle();
    if (profileLookupError) throw profileLookupError;
    if (!profile) {
      const { data: created, error: createProfileError } = await admin.from('profiles').insert({ full_name: fullName, email, phone: phone || null, status: 'ACTIVE' }).select('id,full_name,email,phone,avatar_url,bio,created_at').single();
      if (createProfileError) {
        if (createProfileError.code === '23505') return NextResponse.json({ error: 'A user with this email or phone already exists. Search by email and try again.' }, { status: 409 });
        throw createProfileError;
      }
      profile = created;
    }
    const { data: existing, error: duplicateError } = await admin.from('registrations').select('id,status').eq('event_id', eventId).eq('user_id', profile.id).in('status', ['PENDING', 'CONFIRMED']).maybeSingle();
    if (duplicateError) throw duplicateError;
    if (existing) return NextResponse.json({ error: 'This user already has an active registration for this event.' }, { status: 409 });
    const registrationNumber = `REG-2026-${randomCode()}`;
    const { data: registration, error: registrationError } = await admin.from('registrations').insert({ registration_number: registrationNumber, event_id: eventId, user_id: profile.id, status: 'CONFIRMED', total_amount: amount, currency: event.currency || 'INR' }).select('id,registration_number,event_id,user_id,status,total_amount,currency,created_at,updated_at').single();
    if (registrationError || !registration) throw registrationError || new Error('Unable to create registration.');
    const { error: itemError } = await admin.from('registration_items').insert({ registration_id: registration.id, ticket_type: 'General', unit_price: amount, quantity: 1 });
    if (itemError) { await admin.from('registrations').delete().eq('id', registration.id); throw itemError; }
    const ticketCode = `TSS-2026-${randomCode()}`;
    const { error: ticketError } = await admin.from('tickets').insert({ ticket_code: ticketCode, registration_id: registration.id, event_id: eventId, user_id: profile.id, qr_payload: ticketCode, status: 'ACTIVE' });
    if (ticketError) { await admin.from('registrations').delete().eq('id', registration.id); throw ticketError; }
    const previousCount = Number(event.registered_count ?? 0);
    const { data: countUpdate, error: countError } = await admin.from('events').update({ registered_count: previousCount + 1, updated_at: new Date().toISOString() }).eq('id', eventId).eq('registered_count', previousCount).select('id').maybeSingle();
    if (countError) throw countError;
    if (!countUpdate) return NextResponse.json({ error: 'The event registration count changed. Please refresh and try again.' }, { status: 409 });
    await admin.from('audit_logs').insert({ actor_user_id: auth.profileId, action: 'REGISTRATION_CREATED_MANUALLY', entity_type: 'REGISTRATION', entity_id: registration.id, metadata: { event_id: eventId, user_id: profile.id, ticket_code: ticketCode, amount } });
    return NextResponse.json({ registration: { ...registration, events: eventResult.event, profiles: profile, ticket_code: ticketCode }, message: 'Attendee registered successfully.' }, { status: 201 });
  } catch (error) {
    console.error('[ADMIN REGISTRATIONS][POST]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create registration.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRegistrationAccess();
  if (isResponse(auth)) return auth;
  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    const status = body?.status === undefined ? undefined : String(body.status).toUpperCase();
    const amount = body?.total_amount === undefined ? undefined : Number(body.total_amount);
    if (!id || (status !== undefined && !['CONFIRMED', 'PENDING', 'CANCELLED'].includes(status)) || (amount !== undefined && (!Number.isFinite(amount) || amount < 0))) return NextResponse.json({ error: 'Invalid registration update.' }, { status: 400 });
    const { data: existing, error: lookupError } = await auth.admin.from('registrations').select('id,event_id,user_id,status,total_amount').eq('id', id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    const eventResult = await ensureEventAccess(auth, existing.event_id);
    if ('error' in eventResult) return eventResult.error;
    const event = eventResult.event;
    const nextStatus = status ?? existing.status;
    if (nextStatus === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
      if (Number(event.registered_count ?? 0) >= Number(event.capacity ?? 0)) return NextResponse.json({ error: 'This event is at capacity.' }, { status: 409 });
      const { data: duplicate } = await auth.admin.from('registrations').select('id').eq('event_id', existing.event_id).eq('user_id', existing.user_id).eq('status', 'CONFIRMED').neq('id', id).maybeSingle();
      if (duplicate) return NextResponse.json({ error: 'This user already has another confirmed registration for this event.' }, { status: 409 });
    }
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = nextStatus;
    if (amount !== undefined) updates.total_amount = amount;
    const { error: updateError } = await auth.admin.from('registrations').update(updates).eq('id', id);
    if (updateError) throw updateError;
    if (existing.status !== 'CONFIRMED' && nextStatus === 'CONFIRMED') {
      const ticketCode = `TSS-2026-${randomCode()}`;
      const { error: ticketError } = await auth.admin.from('tickets').insert({ ticket_code: ticketCode, registration_id: id, event_id: existing.event_id, user_id: existing.user_id, qr_payload: ticketCode, status: 'ACTIVE' });
      if (ticketError) throw ticketError;
      const previousCount = Number(event.registered_count ?? 0);
      const { data: countUpdate, error: countError } = await auth.admin.from('events').update({ registered_count: previousCount + 1, updated_at: new Date().toISOString() }).eq('id', existing.event_id).eq('registered_count', previousCount).select('id').maybeSingle();
      if (countError) throw countError;
      if (!countUpdate) return NextResponse.json({ error: 'The event registration count changed. Please refresh and try again.' }, { status: 409 });
    } else if (existing.status === 'CONFIRMED' && nextStatus === 'CANCELLED') {
      await auth.admin.from('tickets').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('registration_id', id).neq('status', 'CANCELLED');
      const previousCount = Number(event.registered_count ?? 0);
      const { data: countUpdate, error: countError } = await auth.admin.from('events').update({ registered_count: Math.max(0, previousCount - 1), updated_at: new Date().toISOString() }).eq('id', existing.event_id).eq('registered_count', previousCount).select('id').maybeSingle();
      if (countError) throw countError;
      if (!countUpdate) return NextResponse.json({ error: 'The event registration count changed. Please refresh and try again.' }, { status: 409 });
    }
    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.profileId, action: 'REGISTRATION_UPDATED', entity_type: 'REGISTRATION', entity_id: id, metadata: { previous_status: existing.status, new_status: nextStatus, previous_amount: existing.total_amount, new_amount: amount } });
    return NextResponse.json({ message: 'Registration updated successfully.' });
  } catch (error) {
    console.error('[ADMIN REGISTRATIONS][PATCH]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update registration.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireRegistrationAccess();
  if (isResponse(auth)) return auth;
  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'Registration id is required.' }, { status: 400 });
    const { data: existing, error: lookupError } = await auth.admin.from('registrations').select('id,event_id,user_id,status').eq('id', id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    const eventResult = await ensureEventAccess(auth, existing.event_id);
    if ('error' in eventResult) return eventResult.error;
    const event = eventResult.event;
    if (existing.status === 'CONFIRMED') {
      await auth.admin.from('tickets').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('registration_id', id).neq('status', 'CANCELLED');
      const previousCount = Number(event.registered_count ?? 0);
      const { data: countUpdate, error: countError } = await auth.admin.from('events').update({ registered_count: Math.max(0, previousCount - 1), updated_at: new Date().toISOString() }).eq('id', existing.event_id).eq('registered_count', previousCount).select('id').maybeSingle();
      if (countError) throw countError;
      if (!countUpdate) return NextResponse.json({ error: 'The event registration count changed. Please refresh and try again.' }, { status: 409 });
    }
    const { error: updateError } = await auth.admin.from('registrations').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('id', id);
    if (updateError) throw updateError;
    await auth.admin.from('audit_logs').insert({ actor_user_id: auth.profileId, action: 'REGISTRATION_CANCELLED', entity_type: 'REGISTRATION', entity_id: id, metadata: { event_id: existing.event_id, user_id: existing.user_id } });
    return NextResponse.json({ message: 'Registration cancelled.' });
  } catch (error) {
    console.error('[ADMIN REGISTRATIONS][DELETE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to cancel registration.' }, { status: 500 });
  }
}

function randomCode() { return Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, '0').slice(0, 8); }
