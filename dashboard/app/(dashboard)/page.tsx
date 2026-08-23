'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, CreditCard, QrCode, PlusCircle, ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

type EventRow = {
  id: string;
  title: string;
  status: string;
  capacity: number | null;
  registered_count: number | null;
  start_at: string;
  price: number | null;
};

type OrderRow = { amount: number | null; created_at: string; status: string };
type RegistrationRow = { created_at: string; status: string };
type CheckinRow = { checked_in_at: string };

type ChartPoint = { date: string; revenue: number; registrations: number };

const EMPTY_CHART: ChartPoint[] = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (6 - index));
  return { date: date.toLocaleDateString('en-IN', { weekday: 'short' }), revenue: 0, registrations: 0 };
});

export default function DashboardOverviewPage() {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      const [eventsRes, ordersRes, registrationsRes, checkinsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id,title,status,capacity,registered_count,start_at,price')
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('amount,created_at,status')
          .eq('status', 'COMPLETED'),
        supabase
          .from('registrations')
          .select('created_at,status')
          .eq('status', 'CONFIRMED'),
        supabase
          .from('checkins')
          .select('checked_in_at')
          .gte('checked_in_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);

      if (!mounted) return;

      const firstError = eventsRes.error || ordersRes.error || registrationsRes.error || checkinsRes.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setEvents((eventsRes.data ?? []) as EventRow[]);
        setOrders((ordersRes.data ?? []) as OrderRow[]);
        setRegistrations((registrationsRes.data ?? []) as RegistrationRow[]);
        setCheckins((checkinsRes.data ?? []) as CheckinRow[]);
      }

      setLoading(false);
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  const now = Date.now();
  const upcomingEvents = events.filter(
    (event) => event.status === 'PUBLISHED' && new Date(event.start_at).getTime() > now,
  ).length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const totalRegistrations = registrations.length;
  const todayRegistrations = registrations.filter((registration) => {
    const d = new Date(registration.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const chartData = useMemo<ChartPoint[]>(() => {
    const days = EMPTY_CHART.map((point, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { ...point, key: date.toDateString() };
    });

    return days.map((day) => {
      const revenue = orders
        .filter((order) => new Date(order.created_at).toDateString() === day.key)
        .reduce((sum, order) => sum + Number(order.amount || 0), 0);
      const registrationCount = registrations.filter(
        (registration) => new Date(registration.created_at).toDateString() === day.key,
      ).length;
      return { date: day.date, revenue, registrations: registrationCount };
    });
  }, [orders, registrations]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Operations Overview</h1>
          <p className="text-xs text-gray-400 mt-1">Live production metrics from Supabase.</p>
        </div>
        <Link href="/events/create" className="px-5 py-2.5 rounded-xl gradient-bg text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 flex items-center justify-center gap-2">
          <PlusCircle className="w-4 h-4" /> Create New Event
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
          Unable to load live dashboard data: {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Kpi title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<CreditCard className="w-4 h-4" />} />
        <Kpi title="Registrations" value={String(totalRegistrations)} subtitle={`+${todayRegistrations} today`} icon={<Users className="w-4 h-4" />} />
        <Kpi title="Today's Check-ins" value={String(checkins.length)} subtitle="Live production count" icon={<QrCode className="w-4 h-4" />} />
        <Kpi title="Active Events" value={String(upcomingEvents)} subtitle={`${events.length} total created`} icon={<Calendar className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 dashboard-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Weekly Revenue & Registration Volume</h2>
              <p className="text-xs text-gray-400">Real completed orders and confirmed registrations.</p>
            </div>
            <span className="text-xs font-mono text-purple-400 px-3 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30">INR (₹)</span>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fill="rgba(139,92,246,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 dashboard-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Events</h2>
            <Link href="/events" className="text-xs font-semibold text-purple-400 hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading live events…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-gray-500">No events created yet.</p>
            ) : (
              events.slice(0, 5).map((event) => (
                <div key={event.id} className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-white truncate">{event.title}</h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{event.registered_count ?? 0}/{event.capacity ?? 0} Attendees</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${event.status === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'}`}>
                    {event.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {loading && <p className="text-xs text-gray-500">Loading production data…</p>}
    </div>
  );
}

function Kpi({ title, value, subtitle, icon }: { title: string; value: string; subtitle?: string; icon: React.ReactNode }) {
  return (
    <div className="dashboard-card p-5 rounded-2xl border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400">{title}</span>
        <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/30">{icon}</div>
      </div>
      <div>
        <span className="text-2xl font-extrabold text-white block">{value}</span>
        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
          <ArrowUpRight className="w-3 h-3" /> {subtitle || 'Production data'}
        </span>
      </div>
    </div>
  );
}
