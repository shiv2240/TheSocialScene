'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, CreditCard, Calendar, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { formatCurrency } from '@/lib/utils';

type Point = { date: string; revenue: number; registrations: number; checkins: number };
type AnalyticsResponse = { kpis: { totalEvents: number; upcomingEvents: number; totalRegistrations: number; totalRevenue: number; todayRegistrations: number; todayCheckins: number; activeUsers: number }; daily: Point[]; generatedAt: string };

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/analytics', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load analytics.');
      setData(body as AnalyticsResponse);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load analytics.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const chartData = data?.daily ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6 text-[#c85a3c]" />Performance & Growth Analytics</h1><p className="text-xs text-gray-400 mt-1">Live production metrics calculated from Supabase.</p></div>
        <button onClick={() => void load()} disabled={loading} className="px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50"><RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
      </div>
      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">Unable to load live analytics: {error}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Revenue" value={formatCurrency(data?.kpis.totalRevenue ?? 0)} icon={<CreditCard className="w-4 h-4" />} />
        <Kpi title="Registrations" value={String(data?.kpis.totalRegistrations ?? 0)} icon={<Users className="w-4 h-4" />} />
        <Kpi title="Upcoming Events" value={String(data?.kpis.upcomingEvents ?? 0)} icon={<Calendar className="w-4 h-4" />} />
        <Kpi title="Today's Check-ins" value={String(data?.kpis.todayCheckins ?? 0)} icon={<TrendingUp className="w-4 h-4" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Chart title="Revenue — Last 30 Days"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Area type="monotone" dataKey="revenue" /></AreaChart></ResponsiveContainer></Chart>
        <Chart title="Registrations & Check-ins — Last 30 Days"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="registrations" radius={[6,6,0,0]} /><Bar dataKey="checkins" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></Chart>
      </div>
      <p className="text-[11px] text-gray-500">{data?.generatedAt ? `Last updated ${new Date(data.generatedAt).toLocaleString()}` : 'Loading production data…'}</p>
    </div>
  );
}
function Kpi({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) { return <div className="dashboard-card p-5 rounded-2xl border border-gray-800"><div className="flex justify-between text-gray-400 text-xs"><span>{title}</span><span className="p-2 rounded-xl bg-purple-950/80 text-purple-400">{icon}</span></div><div className="text-2xl font-extrabold text-white mt-3">{value}</div></div>; }
function Chart({ title, children }: { title: string; children: React.ReactNode }) { return <div className="dashboard-card p-6 rounded-3xl border border-white/10"><h2 className="text-base font-bold text-white mb-4">{title}</h2><div className="h-72 w-full">{children}</div></div>; }
