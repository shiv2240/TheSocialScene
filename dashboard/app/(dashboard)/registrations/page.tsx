'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Download, Loader2, Ticket } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type Registration = { id: string; registration_number: string; status: string; total_amount: number | null; currency: string; created_at: string; events: { id: string; title: string; slug: string; host_id: string }; profiles: { full_name: string | null; email: string | null; phone: string | null } };

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void fetch('/api/registrations', { cache: 'no-store' }).then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load registrations.');
      if (active) setRegistrations(body.registrations || []);
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load registrations.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><UserCheck className="w-6 h-6 text-[#c85a3c]" /> Attendee Registrations</h1><p className="text-xs text-gray-400 mt-1">Live production registrations scoped to your dashboard role.</p></div><button className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-gray-300 flex items-center gap-2"><Download className="w-4 h-4 text-purple-400" /> Export CSV</button></div>
    {error && <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300">{error}</div>}
    <div className="dashboard-card rounded-2xl border border-gray-800 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-gray-800"><th className="p-4">Registration #</th><th className="p-4">Attendee</th><th className="p-4">Event</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Registered</th></tr></thead><tbody className="divide-y divide-gray-800/60 text-xs">
      {loading ? <tr><td colSpan={6} className="p-12 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading live registrations…</td></tr> : registrations.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-gray-500"><Ticket className="w-6 h-6 mx-auto mb-2" />No registrations yet.</td></tr> : registrations.map(reg => <tr key={reg.id} className="hover:bg-gray-900/40 transition-colors"><td className="p-4 font-mono text-purple-300 font-bold">{reg.registration_number}</td><td className="p-4"><span className="font-bold text-white block">{reg.profiles?.full_name || 'Attendee'}</span><span className="text-[10px] text-gray-500 block mt-1">{reg.profiles?.email || '—'}{reg.profiles?.phone ? ` · ${reg.profiles.phone}` : ''}</span></td><td className="p-4 text-gray-300 font-medium">{reg.events?.title || 'Event'}</td><td className="p-4 font-bold text-white">{formatCurrency(Number(reg.total_amount || 0))}</td><td className="p-4"><span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">{reg.status}</span></td><td className="p-4 text-gray-500">{new Date(reg.created_at).toLocaleString('en-IN')}</td></tr>)}
    </tbody></table></div></div>
  </div>;
}
