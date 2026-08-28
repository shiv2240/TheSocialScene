import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentDashboardRoles, hasDashboardRole } from '@/lib/dashboard-rbac';

export const runtime = 'nodejs';
const HOST_MANAGEMENT_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
type Profile = { id: string; full_name: string; email: string | null; phone: string | null; status: string; created_at: string };
type Mapping = { user_id: string; role_id: string };
type RoleRow = { id: string; name: string };
type EventRow = { id: string; host_id: string; status: string };
type RegistrationRow = { id: string; event_id: string; status: string; total_amount: number; currency: string };
type Application = { profile_id: string | null; organization_name: string | null; city: string | null };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { roles, error: roleError } = await getCurrentDashboardRoles(supabase);
  if (roleError) return NextResponse.json({ error: 'Unable to resolve dashboard roles.' }, { status: 500 });
  if (!hasDashboardRole(roles, HOST_MANAGEMENT_ROLES)) return NextResponse.json({ error: 'You do not have host management permission.' }, { status: 403 });

  try {
    const admin = getSupabaseAdmin();
    const { data: hostRole, error: hostRoleError } = await admin.from('roles').select('id,name').eq('name', 'HOST').single();
    if (hostRoleError) throw hostRoleError;
    const { data: mappings, error: mappingsError } = await admin.from('user_roles').select('user_id,role_id').eq('role_id', hostRole.id);
    if (mappingsError) throw mappingsError;
    const mappingRows = (mappings ?? []) as Mapping[];
    const profileIds = [...new Set(mappingRows.map((mapping: Mapping) => mapping.user_id))];
    if (!profileIds.length) return NextResponse.json({ hosts: [] });

    const [{ data: profiles, error: profilesError }, { data: events, error: eventsError }, { data: applications, error: applicationsError }] = await Promise.all([
      admin.from('profiles').select('id,full_name,email,phone,status,created_at').in('id', profileIds).order('created_at', { ascending: false }),
      admin.from('events').select('id,host_id,status').in('host_id', profileIds),
      admin.from('host_applications').select('profile_id,organization_name,city').in('profile_id', profileIds),
    ]);
    if (profilesError) throw profilesError; if (eventsError) throw eventsError; if (applicationsError) throw applicationsError;

    const { data: allMappings, error: allMappingsError } = await admin.from('user_roles').select('user_id,role_id').in('user_id', profileIds);
    if (allMappingsError) throw allMappingsError;
    const allMappingRows = (allMappings ?? []) as Mapping[];
    const allRoleIds = [...new Set(allMappingRows.map((mapping: Mapping) => mapping.role_id))];
    const { data: roleRows, error: rolesError } = allRoleIds.length ? await admin.from('roles').select('id,name').in('id', allRoleIds) : { data: [] as RoleRow[], error: null };
    if (rolesError) throw rolesError;
    const roleById = new Map(((roleRows ?? []) as RoleRow[]).map((role: RoleRow) => [role.id, role.name]));
    const rolesByUser = new Map<string, string[]>();
    for (const mapping of allMappingRows) { const roleName = roleById.get(mapping.role_id); if (!roleName) continue; const current = rolesByUser.get(mapping.user_id) || []; current.push(roleName); rolesByUser.set(mapping.user_id, current); }

    const eventRows = (events ?? []) as EventRow[]; const eventIds = eventRows.map((event) => event.id);
    const { data: registrations, error: registrationsError } = eventIds.length ? await admin.from('registrations').select('id,event_id,status,total_amount,currency').in('event_id', eventIds) : { data: [], error: null };
    if (registrationsError) throw registrationsError;
    const appByProfile = new Map<string, Application>(); for (const application of (applications ?? []) as Application[]) if (application.profile_id) appByProfile.set(application.profile_id, application);
    const registrationsByEvent = new Map<string, RegistrationRow[]>(); for (const registration of (registrations ?? []) as RegistrationRow[]) { const current = registrationsByEvent.get(registration.event_id) || []; current.push(registration); registrationsByEvent.set(registration.event_id, current); }
    const hosts = ((profiles ?? []) as Profile[]).map((profile: Profile) => { const hostedEvents = eventRows.filter((event) => event.host_id === profile.id); const application = appByProfile.get(profile.id); const publishedEvents = hostedEvents.filter((event) => event.status === 'PUBLISHED').length; const hostRegistrations = hostedEvents.flatMap((event) => registrationsByEvent.get(event.id) || []); const confirmedRegistrations = hostRegistrations.filter((registration) => registration.status === 'CONFIRMED'); const confirmedRevenue = confirmedRegistrations.reduce((sum, registration) => sum + Number(registration.total_amount || 0), 0); return { id: profile.id, name: profile.full_name, email: profile.email, phone: profile.phone, status: profile.status, organization_name: application?.organization_name || null, city: application?.city || null, events_count: hostedEvents.length, published_events: publishedEvents, registrations: confirmedRegistrations.length, gross_value: confirmedRevenue, created_at: profile.created_at, roles: rolesByUser.get(profile.id) || ['HOST'] }; });
    return NextResponse.json({ hosts });
  } catch (error) { console.error('[HOSTS][GET]', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load hosts.' }, { status: 500 }); }
}
