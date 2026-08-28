import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type Profile = { id: string; full_name: string; email: string | null; phone: string | null; status: string; created_at: string };
type Mapping = { user_id: string; role_id: string };
type Role = { id: string; name: string };
type EventRow = { id: string; host_id: string; status: string; registered_count: number; price: number; created_at: string };
type Application = { profile_id: string | null; organization_name: string | null; city: string | null };

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: role, error: roleError } = await supabase.rpc('get_my_dashboard_role');
  if (roleError) return NextResponse.json({ error: 'Unable to resolve dashboard role.' }, { status: 500 });
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) return NextResponse.json({ error: 'You do not have host management permission.' }, { status: 403 });

  try {
    const admin = getSupabaseAdmin();
    const { data: hostRole, error: hostRoleError } = await admin.from('roles').select('id,name').eq('name', 'HOST').single();
    if (hostRoleError) throw hostRoleError;

    const { data: mappings, error: mappingsError } = await admin.from('user_roles').select('user_id,role_id').eq('role_id', hostRole.id);
    if (mappingsError) throw mappingsError;
    const profileIds = [...new Set(((mappings ?? []) as Mapping[]).map((mapping) => mapping.user_id))];
    if (!profileIds.length) return NextResponse.json({ hosts: [] });

    const [{ data: profiles, error: profilesError }, { data: events, error: eventsError }, { data: applications, error: applicationsError }] = await Promise.all([
      admin.from('profiles').select('id,full_name,email,phone,status,created_at').in('id', profileIds).order('created_at', { ascending: false }),
      admin.from('events').select('id,host_id,status,registered_count,price,created_at').in('host_id', profileIds),
      admin.from('host_applications').select('profile_id,organization_name,city').in('profile_id', profileIds),
    ]);
    if (profilesError) throw profilesError;
    if (eventsError) throw eventsError;
    if (applicationsError) throw applicationsError;

    const eventRows = (events ?? []) as EventRow[];
    const appByProfile = new Map<string, Application>();
    for (const application of (applications ?? []) as Application[]) if (application.profile_id) appByProfile.set(application.profile_id, application);

    const hosts = ((profiles ?? []) as Profile[]).map((profile) => {
      const hostedEvents = eventRows.filter((event) => event.host_id === profile.id);
      const application = appByProfile.get(profile.id);
      const publishedEvents = hostedEvents.filter((event) => event.status === 'PUBLISHED').length;
      const registered = hostedEvents.reduce((sum, event) => sum + (event.registered_count || 0), 0);
      const grossValue = hostedEvents.reduce((sum, event) => sum + ((event.registered_count || 0) * Number(event.price || 0)), 0);
      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        status: profile.status,
        organization_name: application?.organization_name || null,
        city: application?.city || null,
        events_count: hostedEvents.length,
        published_events: publishedEvents,
        registrations: registered,
        gross_value: grossValue,
        created_at: profile.created_at,
      };
    });

    return NextResponse.json({ hosts });
  } catch (error) {
    console.error('[HOSTS][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load hosts.' }, { status: 500 });
  }
}
