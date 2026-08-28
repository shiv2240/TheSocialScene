'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ChevronRight, Download, Loader2, Search, Ticket, Users } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

type EventRow = { id: string; title: string; slug: string; start_at: string; end_at: string; capacity: number; registered_count: number; price: number; currency: string; status: string; registration_open: boolean; cover_image?: string | null };

export default function RegistrationsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    void fetch('/api/registrations', { cache: 'no-store' }).then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load events.');
      if (active) setEvents(body.events || []);
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load events.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => events.filter(event => event.title.toLowerCase().includes(query.trim().toLowerCase())), [events, query]);

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Users className="w-6 h-6 text-[#c85a3c]" /> Event Registrations</h1><p className="text-xs text-gray-400 mt-1">Select an event to view and manage its complete attendee register.</p></div>
      <div className="flex gap-2"><button type="button" disabled className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-gray-500 flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button></div>
    </div>
    {error && <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">{error}</div>}
    <div className="relative max-w-md"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search event name..." className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 outline-none focus:border-gray-700" /></div>
    <div className="dashboard-card rounded-2xl border border-gray-800 overflow-hidden">
      {loading ? <div className="p-12 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading events…</div> : filtered.length === 0 ? <div className="p-12 text-center text-gray-500"><Ticket className="w-6 h-6 mx-auto mb-2" />No events found.</div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-gray-800"><th className="p-4">Event</th><th className="p-4">Schedule</th><th className="p-4">Registrations</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-gray-800/60 text-xs">{filtered.map(event => { const capacity = Math.max(Number(event.capacity) || 1, 1); const percentage = Math.min(100, Math.max(0, Number(event.registered_count || 0) / capacity * 100)); return <tr key={event.id} className="hover:bg-gray-900/40 transition-colors"><td className="p-4"><div className="flex items-center gap-3"><img src={event.cover_image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=120&q=80'} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-800" /><div><span className="font-bold text-white block">{event.title}</span><span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><CalendarDays className="w-3 h-3" />{formatDate(event.start_at)}</span></div></div></td><td className="p-4 text-gray-400">{new Date(event.start_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}<span className="block text-[10px] text-gray-600 mt-1">{formatCurrency(Number(event.price || 0), event.currency || 'INR')} per registration</span></td><td className="p-4"><div className="min-w-40"><div className="flex items-center justify-between mb-1"><span className="font-bold text-white">{event.registered_count || 0} registered</span><span className="text-[10px] text-gray-500">{event.capacity || 0} capacity</span></div><div className="h-1.5 rounded-full bg-gray-800 overflow-hidden"><div className="h-full gradient-bg" style={{ width: `${percentage}%` }} /></div></div></td><td className="p-4"><span className="px-3 py-1 rounded-full text-[10px] font-bold border bg-gray-900 text-gray-300 border-gray-700">{event.status}</span></td><td className="p-4 text-right"><Link href={`/registrations/${event.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl gradient-terracotta text-[10px] font-bold text-white"><span>View Registrations</span><ChevronRight className="w-3.5 h-3.5" /></Link></td></tr>; })}</tbody></table></div>}
    </div>
  </div>;
}
