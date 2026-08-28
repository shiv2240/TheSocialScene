'use client';

import React, { useEffect, useState } from 'react';
import { Users, PlusCircle, CheckCircle2, Loader2, Mail, Edit3 } from 'lucide-react';
import { AccessActionMenu } from '@/components/access/AccessActionMenu';

type Host = { id: string; name: string; email: string | null; phone: string | null; status: string; organization_name: string | null; city: string | null; events_count: number; published_events: number; registrations: number; gross_value: number; created_at: string };

export default function HostsPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState<Host | null>(null);
  const [form, setForm] = useState({ full_name: '', phone: '' });

  const load = async () => {
    setLoading(true); setError('');
    try { const response = await fetch('/api/hosts', { cache: 'no-store' }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'Unable to load hosts.'); setHosts(body.hosts || []); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load hosts.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const updateHost = async (id: string, payload: Record<string, unknown>, message: string) => {
    setBusyId(id); setError(''); setSuccess('');
    try { const response = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...payload }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'Unable to update host.'); setSuccess(message); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update host.'); }
    finally { setBusyId(null); }
  };

  const editHost = (host: Host) => { setEditing(host); setForm({ full_name: host.name || '', phone: host.phone || '' }); };
  const submitEdit = async (event: React.FormEvent) => { event.preventDefault(); if (!editing) return; await updateHost(editing.id, { full_name: form.full_name, phone: form.phone || null }, 'Host profile updated successfully.'); setEditing(null); };
  const changeRole = async (host: Host) => { const role = window.prompt('New dashboard role:', 'HOST')?.trim().toUpperCase(); if (role) await updateHost(host.id, { role }, 'Host role updated successfully.'); };
  const toggleStatus = async (host: Host) => { await updateHost(host.id, { status: host.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }, host.status === 'SUSPENDED' ? 'Host access restored.' : 'Host access suspended.'); };
  const removeAccess = async (host: Host) => {
    if (!window.confirm(`Remove dashboard access for ${host.name}? This revokes the HOST role and retains the account for audit history.`)) return;
    setBusyId(host.id); setError(''); setSuccess('');
    try { const response = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: host.id }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || 'Unable to remove host access.'); setSuccess(body.message || 'Host dashboard access removed.'); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to remove host access.'); }
    finally { setBusyId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Users className="w-6 h-6 text-[#c85a3c]" /> Event Hosts & Organizers</h1><p className="text-xs text-gray-400 mt-1">Manage verified host profiles, roles and dashboard access.</p></div><button type="button" onClick={() => window.location.href = '/users'} className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Add New Host</button></div>
      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{error}</div>}{success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">{success}</div>}
      <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">{loading ? <div className="p-12 text-center text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading hosts…</div> : <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">Host Name</th><th className="p-4">Contact</th><th className="p-4">Events Hosted</th><th className="p-4">Registrations</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">{hosts.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-gray-500">No host accounts yet.</td></tr> : hosts.map((host) => <tr key={host.id} className="hover:bg-white/5 transition-colors"><td className="p-4"><div className="flex items-center gap-2 font-bold text-white">{host.name}<CheckCircle2 className="w-4 h-4 text-[#c85a3c]" /></div><span className="text-[10px] text-gray-500 block mt-1">{host.organization_name || 'Independent host'}{host.city ? ` · ${host.city}` : ''}</span></td><td className="p-4"><span className="text-gray-300 flex items-center gap-1"><Mail className="w-3 h-3" />{host.email || '—'}</span>{host.phone && <span className="text-[10px] text-gray-500 block mt-1">{host.phone}</span>}</td><td className="p-4 font-bold text-white">{host.events_count}<span className="text-[10px] text-gray-500 block font-normal">{host.published_events} published</span></td><td className="p-4 font-bold text-white">{host.registrations}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${host.status === 'SUSPENDED' ? 'bg-red-950 text-red-300 border-red-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'}`}>{host.status}</span></td><td className="p-4 text-right"><AccessActionMenu userId={host.name} status={host.status} busy={busyId === host.id} onEdit={() => editHost(host)} onChangeRole={() => void changeRole(host)} onToggleStatus={() => void toggleStatus(host)} onRemoveAccess={() => void removeAccess(host)} /></td></tr>)}</tbody></table></div>}</div>
      {editing && <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"><form onSubmit={submitEdit} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151720] p-6 shadow-2xl space-y-4"><div><h2 className="text-lg font-bold text-white flex items-center gap-2"><Edit3 className="w-4 h-4 text-[#e59838]" /> Edit host profile</h2><p className="text-xs text-gray-500 mt-1">Update profile information without changing the HOST assignment.</p></div><label className="block"><span className="text-xs font-bold text-gray-300">Full name</span><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5 w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white outline-none" required /></label><label className="block"><span className="text-xs font-bold text-gray-300">Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white outline-none" /></label><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditing(null)} className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs font-bold text-gray-300">Cancel</button><button type="submit" disabled={busyId === editing.id} className="px-4 py-2.5 rounded-xl gradient-terracotta text-xs font-bold text-white disabled:opacity-50">{busyId === editing.id ? 'Saving…' : 'Save changes'}</button></div></form></div>}
    </div>
  );
}
