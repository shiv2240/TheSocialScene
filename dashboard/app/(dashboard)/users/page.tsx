'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Edit3, Loader2, Mail, MapPin, PlusCircle, Settings2, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { AccessActionMenu } from '@/components/access/AccessActionMenu';
import { RoleAssignedUsers } from '@/components/access/RoleAssignedUsers';

const ROLES = ['ADMIN', 'HOST', 'EVENT_MANAGER', 'CHECKIN_STAFF', 'EDITOR', 'FINANCE', 'SUPPORT'] as const;
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', HOST: 'Host', EVENT_MANAGER: 'Event Manager', CHECKIN_STAFF: 'Check-in Staff', EDITOR: 'Editor', FINANCE: 'Finance', SUPPORT: 'Support',
};
const CATEGORY_LABELS: Record<string, string> = {
  EVENTS: 'Events', REGISTRATIONS: 'Registrations', CHECKIN: 'Check-in', HOSTS: 'Hosts', USERS: 'Users', PAYMENTS: 'Payments', ANALYTICS: 'Analytics', SETTINGS: 'Settings', AUDIT: 'Audit Logs',
};

type UserRow = {
  id: string; auth_user_id?: string | null; name: string; email: string; phone?: string | null; role: string; roles: string[];
  role_descriptions?: { name: string; description: string | null }[]; role_description?: string | null; status: string; must_change_password: boolean; created_at: string;
};
type RoleRow = { id: string; name: string; description: string | null; is_system: boolean; assigned_users: number; assigned_user_names: string[]; permission_keys: string[] };
type Permission = { id: string; key: string; description: string | null; category: string };
type Application = { id: string; full_name: string; email: string; organization_name?: string | null; city?: string | null; event_types: string[]; expected_frequency?: string | null; status: string; created_at: string };
type UsersResponse = { users?: UserRow[]; error?: string };
type ApplicationsResponse = { applications?: Application[]; error?: string };
type RolesResponse = { roles?: RoleRow[]; permissions?: Permission[]; error?: string };
type RoleEditorState = { id?: string; name: string; description: string; permission_keys: string[]; is_system: boolean };

export default function UsersPage() {
  const [tab, setTab] = useState<'USERS' | 'ROLES' | 'APPLICATIONS'>('USERS');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [viewingRole, setViewingRole] = useState<RoleRow | null>(null);
  const [roleEditor, setRoleEditor] = useState<RoleEditorState | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'ADMIN' });
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', status: 'ACTIVE' });
  const pendingApplications = useMemo(() => applications.filter((item) => item.status === 'PENDING').length, [applications]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [usersResponse, applicationsResponse, rolesResponse] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }), fetch('/api/host-applications', { cache: 'no-store' }), fetch('/api/roles', { cache: 'no-store' }),
      ]);
      const [usersBody, applicationsBody, rolesBody] = await Promise.all([
        usersResponse.json().catch(() => ({} as UsersResponse)), applicationsResponse.json().catch(() => ({} as ApplicationsResponse)), rolesResponse.json().catch(() => ({} as RolesResponse)),
      ]) as [UsersResponse, ApplicationsResponse, RolesResponse];
      if (!usersResponse.ok) throw new Error(usersBody.error || 'Unable to load users.');
      if (!applicationsResponse.ok) throw new Error(applicationsBody.error || 'Unable to load host applications.');
      if (!rolesResponse.ok) throw new Error(rolesBody.error || 'Unable to load roles.');
      setUsers((usersBody.users ?? []).map((user) => ({ ...user, roles: Array.isArray(user.roles) ? user.roles : user.role && user.role !== 'UNASSIGNED' ? [user.role] : [] })));
      setApplications(applicationsBody.applications ?? []);
      setRoles(rolesBody.roles ?? []);
      setPermissions(rolesBody.permissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load access management data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openEdit = (user: UserRow) => { setEditingUser(user); setEditForm({ full_name: user.name || '', phone: user.phone || '', status: user.status || 'ACTIVE' }); };
  const openCreateRole = () => { setError(''); setSuccess(''); setRoleEditor({ name: '', description: '', permission_keys: [], is_system: false }); };
  const openEditRole = (role: RoleRow) => { setError(''); setSuccess(''); setRoleEditor({ id: role.id, name: role.name, description: role.description || '', permission_keys: role.permission_keys, is_system: role.is_system }); };
  const openAssignedUsers = (role: RoleRow) => { setError(''); setSuccess(''); setViewingRole(role); };
  const editAssignedUser = (user: UserRow) => { setViewingRole(null); openEdit(user); };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to create user.');
      setShowCreateUser(false); setForm({ full_name: '', email: '', phone: '', role: 'ADMIN' }); setSuccess(body.message || 'Invitation sent.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create user.'); } finally { setBusy(false); }
  };

  const updateUser = async (event: React.FormEvent) => {
    event.preventDefault(); if (!editingUser) return; setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingUser.id, full_name: editForm.full_name, phone: editForm.phone || null, status: editForm.status }) });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to update user.');
      setEditingUser(null); setSuccess(body.message || 'User access updated.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update user.'); } finally { setBusy(false); }
  };

  const toggleStatus = async (user: UserRow) => {
    setBusyId(user.id); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, status: user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' }) });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to update access.');
      setSuccess(body.message || 'Access status updated.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update access.'); } finally { setBusyId(null); }
  };

  const removeAccess = async (user: UserRow) => {
    if (!window.confirm(`Remove dashboard access for ${user.name}? The account will be retained for audit history.`)) return;
    setBusyId(user.id); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id }) });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to remove access.');
      setSuccess(body.message || 'Dashboard access removed.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to remove access.'); } finally { setBusyId(null); }
  };

  const resendInvite = async (user: UserRow) => {
    setBusyId(user.id); setError(''); setSuccess('');
    try {
      const response = await fetch(`/api/users/${user.id}/resend-invite`, { method: 'POST' });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to resend activation.');
      setSuccess(body.message || `Activation email resent to ${user.email}.`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to resend activation.'); } finally { setBusyId(null); }
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault(); if (!roleEditor) return; setBusy(true); setError(''); setSuccess('');
    try {
      const isCreate = !roleEditor.id;
      const response = await fetch('/api/roles', {
        method: isCreate ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isCreate ? { name: roleEditor.name, description: roleEditor.description, permission_keys: roleEditor.permission_keys } : { id: roleEditor.id, description: roleEditor.description, permission_keys: roleEditor.permission_keys }),
      });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to save role.');
      setRoleEditor(null); setSuccess(body.message || (isCreate ? 'Role created.' : 'Role updated.')); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save role.'); } finally { setBusy(false); }
  };

  const deleteRole = async (role: RoleRow) => {
    if (role.is_system) return;
    if (role.assigned_users > 0) { setError('Unassign this role from all users before deleting it.'); return; }
    if (!window.confirm(`Delete the ${ROLE_LABELS[role.name] || role.name} role? This cannot be undone.`)) return;
    setBusyId(role.id); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/roles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: role.id }) });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to delete role.');
      setSuccess(body.message || 'Role deleted.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete role.'); } finally { setBusyId(null); }
  };

  const reviewApplication = async (application: Application, action: 'APPROVE' | 'REJECT') => {
    let rejection_reason = ''; if (action === 'REJECT') rejection_reason = window.prompt('Optional rejection reason:') || '';
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/host-applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: application.id, action, rejection_reason }) });
      const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
      if (!response.ok) throw new Error(body.error || 'Unable to process application.');
      setSuccess(body.message || 'Application updated.'); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to process application.'); } finally { setBusy(false); }
  };

  const permissionsByCategory = useMemo(() => permissions.reduce<Record<string, Permission[]>>((groups, permission) => {
    const current = groups[permission.category] || []; current.push(permission); groups[permission.category] = current; return groups;
  }, {}), [permissions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Users className="w-6 h-6 text-[#c85a3c]" /> User & RBAC Access Management</h1><p className="text-xs text-gray-400 mt-1">Manage staff accounts, multiple roles, host access and effective permissions.</p></div>
        <div className="flex gap-2"><button onClick={() => setShowCreateUser(true)} className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2"><UserPlus className="w-4 h-4" /> Add User Account</button></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Summary label="Dashboard Users" value={users.length} /><Summary label="Pending Host Applications" value={pendingApplications} accent /><Summary label="Host Accounts" value={users.filter((user) => user.roles.includes('HOST')).length} /></div>
      {error && <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">{success}</div>}
      <div className="flex items-center gap-2 border-b border-white/10"><Tab active={tab === 'USERS'} onClick={() => setTab('USERS')}>Team Users</Tab><Tab active={tab === 'ROLES'} onClick={() => setTab('ROLES')}>Roles</Tab><Tab active={tab === 'APPLICATIONS'} onClick={() => setTab('APPLICATIONS')}>Host Applications {pendingApplications > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#c85a3c]/20 text-[#e59838]">{pendingApplications}</span>}</Tab></div>
      {loading ? <div className="p-12 text-center text-sm text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading access management…</div> : tab === 'USERS' ? <UsersTable users={users} busyId={busyId} onEdit={openEdit} onToggle={toggleStatus} onRemove={removeAccess} onResend={resendInvite} onRolesSaved={(userId, assignedRoles) => setUsers((current) => current.map((user) => user.id === userId ? { ...user, roles: assignedRoles, role: assignedRoles.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' : assignedRoles.includes('ADMIN') ? 'ADMIN' : assignedRoles[0] || 'UNASSIGNED' } : user))} /> : tab === 'ROLES' ? <RolesTable roles={roles} onCreate={openCreateRole} onEdit={openEditRole} onDelete={deleteRole} onViewAssignedUsers={openAssignedUsers} busyId={busyId} /> : <ApplicationsTable applications={applications} busy={busy} onReview={reviewApplication} />}
      {showCreateUser && <Modal title="Create dashboard user" onClose={() => setShowCreateUser(false)}><form onSubmit={createUser} className="space-y-4"><Field label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} required /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required /><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Select label="Initial role" value={form.role} onChange={(value) => setForm({ ...form, role: value })} options={ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))} /><p className="text-[10px] text-gray-500">Additional roles can be assigned later without replacing existing access.</p><ModalActions busy={busy} submitLabel="Create & invite" onCancel={() => setShowCreateUser(false)} /></form></Modal>}
      {editingUser && <Modal title="Edit dashboard user" onClose={() => setEditingUser(null)}><form onSubmit={updateUser} className="space-y-4"><Field label="Full name" value={editForm.full_name} onChange={(value) => setEditForm({ ...editForm, full_name: value })} required /><Field label="Phone" value={editForm.phone} onChange={(value) => setEditForm({ ...editForm, phone: value })} /><Select label="Status" value={editForm.status} onChange={(value) => setEditForm({ ...editForm, status: value })} options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }, { value: 'PENDING', label: 'Pending' }]} /><div className="rounded-xl border border-white/10 bg-gray-950/40 p-3"><p className="text-[10px] uppercase tracking-wider text-gray-500">Assigned roles</p><div className="flex flex-wrap gap-1.5 mt-2">{editingUser.roles.length ? editingUser.roles.map((role) => <span key={role} className="px-2 py-1 rounded-lg bg-[#c85a3c]/10 border border-[#c85a3c]/30 text-[10px] font-bold text-[#e59838]">{ROLE_LABELS[role] || role}</span>) : <span className="text-[10px] text-gray-500">No dashboard roles assigned.</span>}</div><p className="text-[10px] text-gray-500 mt-2">Use the row action menu → Change roles to modify role assignments.</p></div><ModalActions busy={busy} submitLabel="Save changes" onCancel={() => setEditingUser(null)} /></form></Modal>}
      {roleEditor && <RoleEditorModal editor={roleEditor} permissionsByCategory={permissionsByCategory} busy={busy} onChange={setRoleEditor} onClose={() => setRoleEditor(null)} onSave={saveRole} />}
      {viewingRole && <RoleAssignedUsers roleName={viewingRole.name} roleLabel={ROLE_LABELS[viewingRole.name] || viewingRole.name} users={users} onClose={() => setViewingRole(null)} onEditUser={editAssignedUser} onChanged={load} />}
    </div>
  );
}

function UsersTable({ users, busyId, onEdit, onToggle, onRemove, onResend, onRolesSaved }: { users: UserRow[]; busyId: string | null; onEdit: (user: UserRow) => void; onToggle: (user: UserRow) => void; onRemove: (user: UserRow) => void; onResend: (user: UserRow) => void; onRolesSaved: (userId: string, roles: string[]) => void }) {
  return <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">User</th><th className="p-4">Roles</th><th className="p-4">Effective access</th><th className="p-4">Status</th><th className="p-4">Created</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">{users.length === 0 ? <tr><td colSpan={6} className="p-12 text-center text-gray-500">No dashboard users yet.</td></tr> : users.map((user) => <tr key={user.id} className="hover:bg-white/5"><td className="p-4"><span className="font-bold text-white block">{user.name}</span><span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" />{user.email}</span></td><td className="p-4"><div className="flex flex-wrap gap-1.5 max-w-xs">{user.roles.length ? user.roles.map((role) => <span key={role} className="px-2 py-1 rounded-lg bg-[#c85a3c]/10 text-[#e59838] border border-[#c85a3c]/30 font-mono text-[10px] font-bold">{ROLE_LABELS[role] || role}</span>) : <span className="text-[10px] text-gray-500">Unassigned</span>}</div></td><td className="p-4 text-gray-400 max-w-xs">{user.roles.length > 1 ? `${user.roles.length} role permissions combined` : user.role_description || 'Configured dashboard access'}</td><td className="p-4"><span className={user.status === 'SUSPENDED' ? 'text-red-400 font-bold' : 'text-emerald-300 font-bold'}>{user.status}</span>{user.must_change_password && <span className="text-[10px] text-amber-400 block">Password setup pending</span>}</td><td className="p-4 text-gray-500">{new Date(user.created_at).toLocaleDateString('en-IN')}</td><td className="p-4 text-right"><AccessActionMenu userId={user.id} userName={user.name} status={user.status} currentRoles={user.roles} isSelf={user.roles.includes('SUPER_ADMIN')} canResend={user.must_change_password} busy={busyId === user.id} onEdit={() => onEdit(user)} onRolesSaved={(assignedRoles) => onRolesSaved(user.id, assignedRoles)} onToggleStatus={() => onToggle(user)} onRemoveAccess={() => onRemove(user)} onResend={() => onResend(user)} /></td></tr>)}</tbody></table></div></div>;
}

function RolesTable({ roles, onCreate, onEdit, onDelete, onViewAssignedUsers, busyId }: { roles: RoleRow[]; onCreate: () => void; onEdit: (role: RoleRow) => void; onDelete: (role: RoleRow) => void; onViewAssignedUsers: (role: RoleRow) => void; busyId: string | null }) {
  return <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden"><div className="p-4 border-b border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#c85a3c]" /><div><p className="text-sm font-bold text-white">Dashboard roles</p><p className="text-[10px] text-gray-500">Select multiple sections and granular permissions when creating a custom role.</p></div></div><button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-xl gradient-terracotta px-4 py-2.5 text-xs font-bold text-white"><PlusCircle className="w-4 h-4" /> Create Role</button></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">Role</th><th className="p-4">Assigned Users</th><th className="p-4">Access</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">{roles.length === 0 ? <tr><td colSpan={4} className="p-12 text-center text-gray-500">No dashboard roles configured.</td></tr> : roles.map((role) => <tr key={role.id} className="hover:bg-white/5"><td className="p-4"><span className="block font-bold text-[#e59838]">{ROLE_LABELS[role.name] || role.name}</span><span className="mt-1 block text-[10px] text-gray-500">{role.is_system ? 'System role' : 'Custom role'}</span></td><td className="p-4"><div className="flex flex-wrap gap-1.5 max-w-sm">{role.assigned_user_names.length ? role.assigned_user_names.map((name) => <button key={name} type="button" onClick={() => onViewAssignedUsers(role)} className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1 text-[10px] font-semibold text-gray-200 hover:border-[#c85a3c]/50">{name}</button>) : <span className="text-[10px] text-gray-600">No assigned users</span>}<button type="button" onClick={() => onViewAssignedUsers(role)} className="text-[10px] font-bold text-[#e59838]">{role.assigned_users} {role.assigned_users === 1 ? 'user' : 'users'}</button></div></td><td className="p-4"><span className="font-bold text-white">{role.permission_keys.length}</span><span className="ml-1 text-gray-500">permissions</span></td><td className="p-4 text-right"><div className="inline-flex gap-2"><button type="button" onClick={() => onEdit(role)} className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 text-[10px] font-bold inline-flex items-center gap-1.5"><Edit3 className="w-3 h-3 text-[#e59838]" /> Edit</button>{!role.is_system && <button type="button" disabled={busyId === role.id} onClick={() => onDelete(role)} className="px-3 py-1.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-300 text-[10px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40"><Trash2 className="w-3 h-3" /> Delete</button>}</div></td></tr>)}</tbody></table></div></div>;
}

function RoleEditorModal({ editor, permissionsByCategory, busy, onChange, onClose, onSave }: { editor: RoleEditorState; permissionsByCategory: Record<string, Permission[]>; busy: boolean; onChange: (editor: RoleEditorState) => void; onClose: () => void; onSave: (event: React.FormEvent) => void }) {
  const categories = Object.keys(permissionsByCategory).sort((a, b) => (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b));
  const togglePermission = (key: string) => onChange({ ...editor, permission_keys: editor.permission_keys.includes(key) ? editor.permission_keys.filter((value) => value !== key) : [...editor.permission_keys, key] });
  const toggleCategory = (category: string) => {
    const keys = permissionsByCategory[category].map((permission) => permission.key);
    const allSelected = keys.every((key) => editor.permission_keys.includes(key));
    const next = allSelected ? editor.permission_keys.filter((key) => !keys.includes(key)) : [...new Set([...editor.permission_keys, ...keys])];
    onChange({ ...editor, permission_keys: next });
  };
  return <Modal title={editor.id ? `Edit ${ROLE_LABELS[editor.name] || editor.name} role` : 'Create dashboard role'} onClose={onClose} wide><form onSubmit={onSave} className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Role name" value={editor.name} disabled={Boolean(editor.id)} onChange={(value) => onChange({ ...editor, name: value })} required /><Field label="Description" value={editor.description} onChange={(value) => onChange({ ...editor, description: value })} /></div><div className="rounded-xl border border-white/10 bg-gray-950/40 p-4"><div className="flex items-center justify-between gap-3 mb-3"><div><p className="text-xs font-bold text-white">Dashboard sections & permissions</p><p className="text-[10px] text-gray-500">Tick any number of sections. Then choose the exact permissions this role should have.</p></div><span className="rounded-lg border border-[#c85a3c]/30 bg-[#c85a3c]/10 px-2 py-1 text-[10px] font-bold text-[#e59838]">{new Set(editor.permission_keys.map((key) => permissionsByCategory[Object.keys(permissionsByCategory).find((category) => permissionsByCategory[category].some((permission) => permission.key === key)) || '']?.[0]?.category || '')).size} sections selected</span></div>{editor.name === 'SUPER_ADMIN' && <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-950/10 px-3 py-2 text-[10px] text-amber-300">Super Admin permissions are protected and cannot be changed.</div>}<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{categories.map((category) => { const categoryPermissions = permissionsByCategory[category]; const selected = categoryPermissions.filter((permission) => editor.permission_keys.includes(permission.key)).length; const allSelected = selected === categoryPermissions.length; const locked = editor.name === 'SUPER_ADMIN'; return <div key={category} className="rounded-xl border border-white/10 bg-gray-900/50 p-3"><div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 mb-2"><label className={`flex items-center gap-2 text-xs font-bold ${locked ? 'text-gray-500' : 'text-white'}`}><input type="checkbox" checked={allSelected} disabled={locked} onChange={() => toggleCategory(category)} className="h-4 w-4 accent-[#c85a3c]" />{CATEGORY_LABELS[category] || category}</label><span className="text-[9px] text-gray-500">{selected}/{categoryPermissions.length}</span></div><div className="space-y-1.5">{categoryPermissions.map((permission) => <label key={permission.key} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${locked ? 'opacity-50' : 'hover:bg-white/5'}`}><input type="checkbox" checked={editor.permission_keys.includes(permission.key)} disabled={locked} onChange={() => togglePermission(permission.key)} className="mt-0.5 h-3.5 w-3.5 accent-[#c85a3c]" /><span><span className="block text-[10px] font-semibold text-gray-200">{permissionLabel(permission.key)}</span><span className="block text-[9px] text-gray-600">{permission.description || ''}</span></span></label>)}</div></div>; })}</div></div><p className="text-[10px] text-gray-500">Custom roles can include any number of sections. Permissions are combined with any other roles assigned to the same user.</p><ModalActions busy={busy} submitLabel={editor.id ? 'Save role' : 'Create role'} onCancel={onClose} /></form></Modal>;
}

function permissionLabel(key: string): string { return key.split('_').map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(' '); }
function ApplicationsTable({ applications, busy, onReview }: { applications: Application[]; busy: boolean; onReview: (application: Application, action: 'APPROVE' | 'REJECT') => void }) { return <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10"><th className="p-4">Applicant</th><th className="p-4">Host Profile</th><th className="p-4">Event Direction</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">{applications.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-gray-500">No host applications yet.</td></tr> : applications.map((application) => <tr key={application.id}><td className="p-4"><span className="font-bold text-white block">{application.full_name}</span><span className="text-[10px] text-gray-500">{application.email}</span></td><td className="p-4 text-gray-300">{application.organization_name || 'Independent host'}<span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{application.city || '—'}</span></td><td className="p-4 text-gray-300">{application.event_types?.join(', ') || 'Not specified'}<span className="text-[10px] text-gray-500 block mt-1">{application.expected_frequency || 'Frequency not specified'}</span></td><td className="p-4 font-bold text-gray-300">{application.status}</td><td className="p-4 text-right">{application.status === 'PENDING' && <div className="flex justify-end gap-2"><button disabled={busy} onClick={() => onReview(application, 'APPROVE')} className="px-3 py-1.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">Approve</button><button disabled={busy} onClick={() => onReview(application, 'REJECT')} className="px-3 py-1.5 rounded-lg bg-red-950/70 text-red-300 border border-red-500/30 font-bold text-[10px]">Reject</button></div>}</td></tr>)}</tbody></table></div></div>; }
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`px-4 py-3 text-xs font-bold border-b-2 ${active ? 'text-white border-[#c85a3c]' : 'text-gray-500 border-transparent'}`}>{children}</button>; }
function Summary({ label, value, accent }: { label: string; value: number; accent?: boolean }) { return <div className="dashboard-card rounded-2xl border border-white/10 p-4"><span className="text-[10px] uppercase tracking-wider text-gray-500">{label}</span><p className={`text-xl font-black mt-1 ${accent ? 'text-[#e59838]' : 'text-white'}`}>{value}</p></div>; }
function Field({ label, value, onChange, type = 'text', required, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean }) { return <label className="block"><span className="text-xs font-bold text-gray-300">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled} className="mt-1.5 w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-50" /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="block"><span className="text-xs font-bold text-gray-300">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full px-3.5 py-3 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function ModalActions({ busy, submitLabel, onCancel }: { busy: boolean; submitLabel: string; onCancel: () => void }) { return <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs font-bold text-gray-300">Cancel</button><button type="submit" disabled={busy} className="px-4 py-2.5 rounded-xl gradient-terracotta text-xs font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : submitLabel}</button></div>; }
function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"><div className={`${wide ? 'max-w-4xl' : 'max-w-md'} w-full max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-[#151720] p-6 shadow-2xl`}><div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings2 className="w-4 h-4 text-[#e59838]" />{title}</h2><button type="button" onClick={onClose} className="text-gray-500 hover:text-white text-xl" aria-label="Close">×</button></div>{children}</div></div>; }
