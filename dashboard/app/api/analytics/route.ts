import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type OrderRow = { amount: number | null; created_at: string; status: string };
type RegistrationRow = { created_at: string; status: string };
type CheckinRow = { checked_in_at: string };
type EventRow = { id: string; title: string; status: string; start_at: string; price: number | null; registered_count: number | null };

export async function GET() {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const db = getSupabaseAdmin();
    const [ordersRes, registrationsRes, checkinsRes, eventsRes, hostsRes] = await Promise.all([
      db.from('orders').select('amount,created_at,status').eq('status', 'COMPLETED'),
      db.from('registrations').select('created_at,status').eq('status', 'CONFIRMED'),
      db.from('checkins').select('checked_in_at'),
      db.from('events').select('id,title,status,start_at,price,registered_count'),
      db.from('profiles').select('id').eq('status', 'ACTIVE'),
    ]);

    const firstError = ordersRes.error || registrationsRes.error || checkinsRes.error || eventsRes.error || hostsRes.error;
    if (firstError) throw firstError;

    const orders = (ordersRes.data ?? []) as OrderRow[];
    const registrations = (registrationsRes.data ?? []) as RegistrationRow[];
    const checkins = (checkinsRes.data ?? []) as CheckinRow[];
    const events = (eventsRes.data ?? []) as EventRow[];

    const days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (29 - index));
      return date;
    });

    const daily = days.map((date) => {
      const key = date.toDateString();
      return {
        date: date.toISOString().slice(0, 10),
        revenue: orders.filter((o) => new Date(o.created_at).toDateString() === key).reduce((sum, o) => sum + Number(o.amount ?? 0), 0),
        registrations: registrations.filter((r) => new Date(r.created_at).toDateString() === key).length,
        checkins: checkins.filter((c) => new Date(c.checked_in_at).toDateString() === key).length,
      };
    });

    const now = Date.now();
    const upcoming = events.filter((e) => e.status === 'PUBLISHED' && new Date(e.start_at).getTime() > now).length;
    const todayKey = new Date().toDateString();

    return NextResponse.json({
      kpis: {
        totalEvents: events.length,
        upcomingEvents: upcoming,
        totalRegistrations: registrations.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.amount ?? 0), 0),
        todayRegistrations: registrations.filter((r) => new Date(r.created_at).toDateString() === todayKey).length,
        todayCheckins: checkins.filter((c) => new Date(c.checked_in_at).toDateString() === todayKey).length,
        activeUsers: (hostsRes.data ?? []).length,
      },
      daily,
      paymentBreakdown: {
        completed: orders.length,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ANALYTICS][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load analytics.' }, { status: 500 });
  }
}
