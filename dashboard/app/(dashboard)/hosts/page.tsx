'use client';

import React, { useEffect, useState } from 'react';
import { Users, PlusCircle, CheckCircle2, Loader2, MapPin, Mail, BarChart3 } from 'lucide-react';

type Host = { id: string; name: string; email: string | null; phone: string | null; status: string; organization_name: string | null; city: string | null; events_count: number; published_events: number; registrations: number; gross_value: number; created_at: string };

export default function HostsPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHosts = async () => {
      setLoading(true); setError('');
      try {
        const response = await fetch('/api/hosts', { cache: 'no-store' });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Unable to load hosts.');
        setHosts(body.hosts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load hosts.');
      } finally { setLoading(false); }
    };
    void loadHosts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Users className="w-6 h-6 text-[#c85a3c]" /> Event Hosts & Organizers</h1><p className="text-xs text-gray-400 mt-1">Manage verified host accounts and their live event performance.</p></div>
        <button type="button" onClick={() => window.location.href = '/users'} className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Add New Host</button>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{error}</div>}
      {loading ? <div className="dashboard-card rounded-2xl border border-white/10 p-14 text-center text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading hosts from database…</div> : hosts.length === 0 ? <div className="dashboard-card rounded-2xl border border-white/10 p-14 text-center"><Users className="w-8 h-8 mx-auto text-gray-600 mb-3" /><p className="text-sm font-bold text-white">No host accounts yet.</p><p className="text-xs text-gray-500 mt-1">Approved host applications and dashboard users with the HOST role will appear here.</p></div> : <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">Host</th><th className="p-4">Contact</th><th className="p-4">Events</th><th className="p-4">Registrations</th><th className="p-4">Gross Sales</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">{hosts.map((host) => <tr key={host.id} className="hover:bg-white/5 transition-colors"><td className="p-4"><span className="font-bold text-white flex items-center gap-2">{host.name}<CheckCircle2 className="w-4 h-4 text-[#c85a3c]" /></span>{host.organization_name && <span className="text-[10px] text-gray-500 block mt-1">{host.organization_name}</span>}{host.city && <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{host.city}</span>}</td><td className="p-4 text-gray-300"><span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-500" />{host.email || 'No email'}</span>{host.phone && <span className="text-[10px] text-gray-500 block mt-1">{host.phone}</span>}</td><td className="p-4"><span className="font-bold text-white">{host.events_count}</span><span className="text-[10px] text-gray-500 block">{host.published_events} published</span></td><td className="p-4"><span className="font-bold text-white">{host.registrations}</span><span className="text-[10px] text-gray-500 block">registrations</span></td><td className="p-4"><span className="font-bold text-white">₹{host.gross_value.toLocaleString('en-IN')}</span><span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><BarChart3 className="w-3 h-3" />based on registered_count × event price</span></td><td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${host.status === 'SUSPENDED' ? 'bg-red-950 text-red-300 border-red-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'} border`}>{host.status}</span></td></tr>)}</tbody></table></div></div>}
    </div>
  );
}
