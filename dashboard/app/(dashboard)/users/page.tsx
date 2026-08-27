'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Users, UserPlus, ShieldCheck, Loader2, CheckCircle2, XCircle, Mail, MapPin, Edit3 } from 'lucide-react';

const ALL_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full platform administration & user role management.' },
  { value: 'ADMIN', label: 'Admin', description: 'Platform operations, approvals and support.' },
  { value: 'HOST', label: 'Host', description: 'Own events, registrations and host-only sales analytics.' },
  { value: 'EVENT_MANAGER', label: 'Event Manager', description: 'Manage events and attendee operations.' },
  { value: 'CHECKIN_STAFF', label: 'Check-in Staff', description: 'Scanner and event-entry operations.' },
  { value: 'EDITOR', label: 'Editor', description: 'Event/content editing without financial access.' },
  { value: 'FINANCE', label: 'Finance', description: 'Payments, revenue and refund operations.' },
  { value: 'SUPPORT', label: 'Support', description: 'Customer and attendee support operations.' },
] as const;

const CREATE_ROLES = ALL_ROLES.filter((r) => r.value !== 'SUPER_ADMIN');

type UserRow = { id: string; name: string; email: string; phone?: string | null; role: string; role_description?: string | null; status: string; must_change_password: boolean; created_at: string };
type Application = { id: string; full_name: string; email: string; phone?: string | null; organization_name?: string | null; city?: string | null; event_types: string[]; experience?: string | null; proposed_event?: string | null; expected_frequency?: string | null; social_links?: { instagram?: string | null; website?: string | null }; why_host: string; status: string; created_at: string; rejection_reason?: string | null };

export default function UsersPage() {
  const [tab, setTab] = useState<'USERS' | 'APPLICATIONS'>('USERS');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedEditUser, setSelectedEditUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'ADMIN' });
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', role: 'ADMIN', status: 'ACTIVE' });

  const pendingApplications = useMemo(() => applications.filter((item) => item.status === 'PENDING').length, [applications]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [usersResponse, applicationsResponse] = await Promise.all([fetch('/api/users', { cache: 'no-store' }), fetch('/api/host-applications', { cache: 'no-store' })]);
      const usersBody = await usersResponse.json().catch(() => ({}));
      const applicationsBody = await applicationsResponse.json().catch(() => ({}));
      if (!usersResponse.ok) throw new Error(usersBody.error || 'Unable to load users.');
      if (!applicationsResponse.ok) throw new Error(applicationsBody.error || 'Unable to load host applications.');
      setUsers(usersBody.users || []); setApplications(applicationsBody.applications || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load access management data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to create user.');
      setSuccess(body.message || 'Invitation sent.'); setShowCreate(false); setForm({ full_name: '', email: '', phone: '', role: 'ADMIN' }); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create user.'); }
    finally { setBusy(false); }
  };

  const updateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEditUser) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEditUser.id,
          full_name: editForm.full_name,
          phone: editForm.phone || null,
          role: editForm.role,
          status: editForm.status,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to update user.');
      setSuccess(body.message || 'User updated successfully.');
      setSelectedEditUser(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user.');
    } finally {
      setBusy(false);
    }
  };

  const reviewApplication = async (application: Application, action: 'APPROVE' | 'REJECT') => {
    let rejection_reason = '';
    if (action === 'REJECT') {
      rejection_reason = window.prompt('Optional rejection reason:') || '';
    }
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/host-applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: application.id, action, rejection_reason }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to process application.');
      setSelectedApplication(null); setSuccess(body.message || 'Application updated.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to process application.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Users className="w-6 h-6 text-[#c85a3c]" /> User & RBAC Access Management</h1>
          <p className="text-xs text-gray-400 mt-1">Create staff accounts, edit user roles, approve hosts, and control dashboard access.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2 self-start"><UserPlus className="w-4 h-4" /> Add User Account</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Summary label="Dashboard Users" value={users.length} />
        <Summary label="Pending Host Applications" value={pendingApplications} accent />
        <Summary label="Host Accounts" value={users.filter((user) => user.role === 'HOST').length} />
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">{success}</div>}

      <div className="flex items-center gap-2 border-b border-white/10">
        <button onClick={() => setTab('USERS')} className={`px-4 py-3 text-xs font-bold border-b-2 ${tab === 'USERS' ? 'text-white border-[#c85a3c]' : 'text-gray-500 border-transparent'}`}>Team Users</button>
        <button onClick={() => setTab('APPLICATIONS')} className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 ${tab === 'APPLICATIONS' ? 'text-white border-[#c85a3c]' : 'text-gray-500 border-transparent'}`}>Host Applications {pendingApplications > 0 && <span className="px-1.5 py-0.5 rounded-full bg-[#c85a3c]/20 text-[#e59838]">{pendingApplications}</span>}</button>
      </div>

      {loading ? <div className="p-12 text-center text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading access management…</div> : tab === 'USERS' ? (
        <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Access</th><th className="p-4">Status</th><th className="p-4">Created</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">
            {users.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-gray-500">No dashboard users yet.</td></tr> : users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4"><span className="font-bold text-white block">{user.name}</span><span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{user.email}</span></td>
                <td className="p-4"><span className="px-2.5 py-1 rounded-lg bg-[#c85a3c]/10 text-[#e59838] border border-[#c85a3c]/30 font-mono text-[10px] font-bold">{user.role}</span></td>
                <td className="p-4 text-gray-400 max-w-xs">{user.role_description || 'Configured dashboard access'}</td>
                <td className="p-4"><div className="flex flex-col gap-1"><span className={user.status === 'SUSPENDED' ? 'text-red-400 font-bold' : 'text-emerald-300 font-bold'}>{user.status}</span>{user.must_change_password && <span className="text-[10px] text-amber-400">Password setup pending</span>}</div></td>
                <td className="p-4 text-gray-500">{new Date(user.created_at).toLocaleDateString('en-IN')}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedEditUser(user);
                      setEditForm({
                        full_name: user.name || '',
                        phone: user.phone || '',
                        role: user.role || 'ADMIN',
                        status: user.status || 'ACTIVE',
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-bold text-[10px] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-[#e59838]" /> Edit User
                  </button>
                </td>
              </tr>
            ))}
          </tbody></table></div>
        </div>
      ) : (
        <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">Applicant</th><th className="p-4">Host Profile</th><th className="p-4">Event Direction</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">
          {applications.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-gray-500">No host applications yet.</td></tr> : applications.map((application) => <tr key={application.id} className="hover:bg-white/5 transition-colors"><td className="p-4"><button onClick={() => setSelectedApplication(application)} className="text-left"><span className="font-bold text-white block hover:text-[#e59838]">{application.full_name}</span><span className="text-[10px] text-gray-500 block mt-1">{application.email}</span></button></td><td className="p-4 text-gray-300"><span className="block">{application.organization_name || 'Independent host'}</span><span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{application.city}</span></td><td className="p-4 text-gray-300"><span className="block">{application.event_types?.join(', ') || 'Not specified'}</span><span className="text-[10px] text-gray-500">{application.expected_frequency || 'Frequency not specified'}</span></td><td className="p-4"><Status status={application.status} /></td><td className="p-4 text-right">{application.status === 'PENDING' && <div className="flex justify-end gap-2"><button disabled={busy} onClick={() => void reviewApplication(application, 'APPROVE')} className="px-3 py-1.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">Approve</button><button disabled={busy} onClick={() => void reviewApplication(application, 'REJECT')} className="px-3 py-1.5 rounded-lg bg-red-950/70 text-red-300 border border-red-500/30 font-bold text-[10px]">Reject</button></div>}</td></tr>)}
        </tbody></table></div></div>
      )}

      {showCreate && (
        <Modal title="Create dashboard user" onClose={() => setShowCreate(false)}>
          <form onSubmit={createUser} className="space-y-4">
            <Field label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} required />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
            <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">Role</label>
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white">
                {CREATE_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label} — {role.description}</option>)}
              </select>
            </div>
            <div className="rounded-xl border border-[#c85a3c]/20 bg-[#c85a3c]/5 p-3 text-[11px] text-gray-400">The user will receive a secure invitation email and will set their own password. Passwords are never stored or displayed in the admin dashboard.</div>
            <button disabled={busy} className="w-full py-3 rounded-xl gradient-terracotta text-xs font-extrabold text-white flex items-center justify-center gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Send invitation</button>
          </form>
        </Modal>
      )}

      {selectedEditUser && (
        <Modal title="Edit User & Role" onClose={() => setSelectedEditUser(null)}>
          <form onSubmit={updateUser} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Email Address</label>
              <input type="text" value={selectedEditUser.email} disabled className="w-full px-3.5 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-500 cursor-not-allowed font-mono" />
            </div>
            <Field label="Full Name" value={editForm.full_name} onChange={(value) => setEditForm({ ...editForm, full_name: value })} required />
            <Field label="Phone Number" value={editForm.phone} onChange={(value) => setEditForm({ ...editForm, phone: value })} />
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">Assigned Dashboard Role</label>
              <select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value })} className="w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white">
                {ALL_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label} — {role.description}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">Account Status</label>
              <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })} className="w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white">
                <option value="ACTIVE">ACTIVE — Full access according to assigned role</option>
                <option value="SUSPENDED">SUSPENDED — Block dashboard access</option>
              </select>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-[11px] text-amber-300">
              Role changes take effect immediately on next page load or API request for this user.
            </div>
            <button disabled={busy} className="w-full py-3 rounded-xl gradient-terracotta text-xs font-extrabold text-white flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Save User & Role Changes
            </button>
          </form>
        </Modal>
      )}

      {selectedApplication && <Modal title="Host application" onClose={() => setSelectedApplication(null)}><div className="space-y-5"><div><h3 className="text-lg font-black text-white">{selectedApplication.full_name}</h3><p className="text-xs text-gray-500 mt-1">{selectedApplication.email} · {selectedApplication.phone || 'No phone provided'}</p></div><div className="grid sm:grid-cols-2 gap-3"><Info label="Organization" value={selectedApplication.organization_name || 'Independent'} /><Info label="City" value={selectedApplication.city || 'Not provided'} /><Info label="Event types" value={selectedApplication.event_types?.join(', ') || 'Not specified'} /><Info label="Frequency" value={selectedApplication.expected_frequency || 'Not specified'} /></div><section><h4 className="text-xs font-bold text-gray-300">Previous experience</h4><p className="text-xs text-gray-400 leading-relaxed mt-1.5 whitespace-pre-wrap">{selectedApplication.experience || 'Not provided.'}</p></section><section><h4 className="text-xs font-bold text-gray-300">Proposed event</h4><p className="text-xs text-gray-400 leading-relaxed mt-1.5 whitespace-pre-wrap">{selectedApplication.proposed_event || 'Not provided.'}</p></section><section><h4 className="text-xs font-bold text-gray-300">Why host?</h4><p className="text-xs text-gray-400 leading-relaxed mt-1.5 whitespace-pre-wrap">{selectedApplication.why_host}</p></section>{selectedApplication.status === 'PENDING' && <div className="flex gap-3 pt-2"><button disabled={busy} onClick={() => void reviewApplication(selectedApplication, 'APPROVE')} className="flex-1 py-3 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Approve & Invite</button><button disabled={busy} onClick={() => void reviewApplication(selectedApplication, 'REJECT')} className="flex-1 py-3 rounded-xl bg-red-950/70 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> Reject</button></div>}</div></Modal>}
    </div>
  );
}

function Summary({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) { return <div className="dashboard-card rounded-2xl border border-white/10 p-5"><span className="text-xs text-gray-500 font-semibold">{label}</span><span className={`block mt-2 text-2xl font-black ${accent ? 'text-[#e59838]' : 'text-white'}`}>{value}</span></div>; }
function Status({ status }: { status: string }) { return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : status === 'REJECTED' ? 'bg-red-950 text-red-300 border border-red-500/30' : 'bg-amber-950 text-amber-300 border border-amber-500/30'}`}>{status}</span>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-gray-950/60 border border-gray-800 p-3"><span className="text-[10px] uppercase tracking-wider text-gray-600 block">{label}</span><span className="text-xs text-gray-300 block mt-1">{value}</span></div>; }
function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="space-y-1.5 block"><span className="text-xs font-bold text-gray-300">{label}{required && ' *'}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#c85a3c]" /></label>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"><div className="w-full max-w-xl max-h-[90vh] overflow-y-auto dashboard-card rounded-3xl border border-white/10 p-6"><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-black text-white">{title}</h2><button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button></div>{children}</div></div>; }
