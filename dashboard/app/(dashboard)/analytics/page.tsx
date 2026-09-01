'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, CreditCard, Calendar, RefreshCw, Radio, Eye, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/utils';

type Point = { date: string; revenue: number; registrations: number; checkins: number };
type AnalyticsResponse = { kpis: { totalEvents: number; upcomingEvents: number; totalRegistrations: number; totalRevenue: number; todayRegistrations: number; todayCheckins: number; activeUsers: number }; daily: Point[]; generatedAt: string };
type RealtimePage = { page: string; activeUsers: number; pageViews: number };
type RealtimeResponse = { configured?: boolean; provider?: string; activeUsers?: number; pageViews?: number; pages?: RealtimePage[]; generatedAt?: string; error?: string };
type TrafficPoint = { date: string; activeUsers: number; sessions: number; pageViews: number };
type TrafficPage = { page: string; activeUsers: number; pageViews: number; sessions: number };
type TrafficResponse = { configured?: boolean; provider?: string; totals?: { activeUsers: number; sessions: number; pageViews: number }; daily?: TrafficPoint[]; pages?: TrafficPage[]; generatedAt?: string; error?: string };

type Provider = 'google' | 'firebase';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [realtime, setRealtime] = useState<RealtimeResponse | null>(null);
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null);
  const [provider, setProvider] = useState<Provider>('google');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [trafficLoading, setTrafficLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load analytics.');
      setData(body as AnalyticsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const loadTraffic = async (selectedProvider: Provider) => {
    setTrafficLoading(true);
    try {
      const [realtimeResponse, trafficResponse] = await Promise.all([
        fetch(`/api/analytics/realtime?provider=${selectedProvider}`, { cache: 'no-store' }),
        fetch(`/api/analytics/traffic?provider=${selectedProvider}`, { cache: 'no-store' }),
      ]);
      const realtimeBody = await realtimeResponse.json() as RealtimeResponse;
      const trafficBody = await trafficResponse.json() as TrafficResponse;
      setRealtime(realtimeResponse.ok ? realtimeBody : { error: realtimeBody.error || 'Unable to load realtime analytics.' });
      setTraffic(trafficResponse.ok ? trafficBody : { error: trafficBody.error || 'Unable to load traffic analytics.' });
    } catch (err) {
      setRealtime({ error: err instanceof Error ? err.message : 'Unable to load realtime analytics.' });
      setTraffic({ error: err instanceof Error ? err.message : 'Unable to load traffic analytics.' });
    } finally {
      setTrafficLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadTraffic('google');
  }, []);

  const chartData = data?.daily ?? [];
  const trafficData = (traffic?.daily ?? []).map((point) => ({ ...point, date: formatDate(point.date) }));
  const providerLabel = provider === 'google' ? 'Google Analytics 4' : 'Firebase Analytics / GA4';

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6 text-[#c85a3c]" />Performance & Growth Analytics</h1>
          <p className="text-xs text-gray-400 mt-1">Business KPIs plus live website traffic from Google Analytics and Firebase Analytics.</p>
        </div>
        <button onClick={() => { void load(); void loadTraffic(provider); }} disabled={loading || trafficLoading} className="px-3 py-2 rounded-xl border border-white/10 text-xs text-gray-300 hover:bg-white/5 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 inline mr-2 ${(loading || trafficLoading) ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">Unable to load live analytics: {error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Revenue" value={formatCurrency(data?.kpis.totalRevenue ?? 0)} icon={<CreditCard className="w-4 h-4" />} />
        <Kpi title="Registrations" value={String(data?.kpis.totalRegistrations ?? 0)} icon={<Users className="w-4 h-4" />} />
        <Kpi title="Upcoming Events" value={String(data?.kpis.upcomingEvents ?? 0)} icon={<Calendar className="w-4 h-4" />} />
        <Kpi title="Today's Check-ins" value={String(data?.kpis.todayCheckins ?? 0)} icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      <section className="dashboard-card p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" />Website Traffic</h2>
            <p className="text-xs text-gray-400 mt-1">30-day GA4 user traffic, sessions, page views and top pages.</p>
          </div>
          <div className="flex items-center gap-2 p-1 rounded-xl bg-gray-900 border border-gray-800 w-fit">
            <ProviderButton active={provider === 'google'} onClick={() => { setProvider('google'); void loadTraffic('google'); }}>Google Analytics</ProviderButton>
            <ProviderButton active={provider === 'firebase'} onClick={() => { setProvider('firebase'); void loadTraffic('firebase'); }}>Firebase Analytics</ProviderButton>
          </div>
        </div>

        {trafficLoading ? (
          <p className="text-sm text-gray-500">Loading {providerLabel} traffic…</p>
        ) : traffic?.error ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-300">{traffic.error}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TrafficKpi title="Active users" value={traffic?.totals?.activeUsers ?? 0} icon={<Users className="w-4 h-4" />} />
              <TrafficKpi title="Sessions" value={traffic?.totals?.sessions ?? 0} icon={<Radio className="w-4 h-4" />} />
              <TrafficKpi title="Page views" value={traffic?.totals?.pageViews ?? 0} icon={<Eye className="w-4 h-4" />} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Chart title="Users & Sessions — Last 30 Days" subtitle={providerLabel}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="activeUsers" name="Active users" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sessions" name="Sessions" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Chart>
              <Chart title="Page Views — Last 30 Days" subtitle="Total web/app screen views">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Area type="monotone" dataKey="pageViews" name="Page views" fillOpacity={0.18} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Chart>
            </div>

            <div className="rounded-2xl bg-gray-900/70 border border-gray-800 overflow-hidden">
              <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                <div><h3 className="text-sm font-bold text-white">Top pages / screens</h3><p className="text-[11px] text-gray-500 mt-1">Ranked by page views over the last 30 days.</p></div>
                <span className="text-[11px] text-emerald-400">{providerLabel}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-500 border-b border-gray-800"><th className="px-5 py-3 font-medium">Page / screen</th><th className="px-5 py-3 font-medium text-right">Active users</th><th className="px-5 py-3 font-medium text-right">Views</th><th className="px-5 py-3 font-medium text-right">Sessions</th></tr></thead>
                  <tbody>{(traffic?.pages ?? []).map((page) => <tr key={page.page} className="border-b border-gray-800/70 last:border-0"><td className="px-5 py-3 text-gray-200 max-w-[420px] truncate">{page.page}</td><td className="px-5 py-3 text-right text-gray-300">{page.activeUsers.toLocaleString()}</td><td className="px-5 py-3 text-right text-white font-semibold">{page.pageViews.toLocaleString()}</td><td className="px-5 py-3 text-right text-gray-300">{page.sessions.toLocaleString()}</td></tr>)}{(traffic?.pages ?? []).length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-500">No page traffic available for this property.</td></tr>}</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="border-t border-white/10 pt-5">
          <div className="flex items-center justify-between mb-3"><div><h3 className="text-sm font-bold text-white flex items-center gap-2"><Radio className="w-4 h-4 text-emerald-400" />Realtime — last 30 minutes</h3><p className="text-[11px] text-gray-500">Currently active users and the pages/screens they are viewing.</p></div><span className="text-2xl font-extrabold text-white">{realtime?.activeUsers ?? 0}</span></div>
          {realtime?.error ? <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300">{realtime.error}</div> : <div className="space-y-2">{(realtime?.pages ?? []).slice(0, 8).map((page) => <div key={page.page} className="flex items-center justify-between gap-4 rounded-xl bg-gray-900/60 px-4 py-3"><span className="text-xs text-gray-300 truncate">{page.page}</span><span className="text-xs text-white font-bold whitespace-nowrap">{page.activeUsers} users · {page.pageViews} views</span></div>)}{(realtime?.pages ?? []).length === 0 && <p className="text-xs text-gray-500">No realtime page activity available.</p>}</div>}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Chart title="Revenue — Last 30 Days"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Area type="monotone" dataKey="revenue" /></AreaChart></ResponsiveContainer></Chart>
        <Chart title="Registrations & Check-ins — Last 30 Days"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="registrations" radius={[6,6,0,0]} /><Bar dataKey="checkins" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></Chart>
      </div>
      <p className="text-[11px] text-gray-500">{data?.generatedAt ? `Last updated ${new Date(data.generatedAt).toLocaleString()}` : 'Loading production data…'}</p>
    </div>
  );
}

function formatDate(value: string) {
  if (!value || value.length !== 8) return value;
  return `${value.slice(4, 6)}/${value.slice(6, 8)}`;
}

function Kpi({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="dashboard-card p-5 rounded-2xl border border-gray-800"><div className="flex justify-between text-gray-400 text-xs"><span>{title}</span><span className="p-2 rounded-xl bg-purple-950/80 text-purple-400">{icon}</span></div><div className="text-2xl font-extrabold text-white mt-3">{value}</div></div>;
}

function TrafficKpi({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-5"><div className="flex items-center justify-between text-xs text-gray-400"><span>{title}</span><span className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400">{icon}</span></div><p className="text-3xl font-extrabold text-white mt-3">{value.toLocaleString()}</p><p className="text-[11px] text-gray-500 mt-1">Last 30 days</p></div>;
}

function ProviderButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`px-3 py-2 rounded-lg text-xs font-bold ${active ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>{children}</button>;
}

function Chart({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <div className="dashboard-card p-6 rounded-3xl border border-white/10"><div className="mb-4"><h2 className="text-base font-bold text-white">{title}</h2>{subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}</div><div className="h-72 w-full">{children}</div></div>;
}
