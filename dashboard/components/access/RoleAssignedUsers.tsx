'use client';

import React, { useMemo, useState } from 'react';
import { Edit3, Loader2, Mail, Search, UserMinus, UserPlus, X } from 'lucide-react';

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  roles: string[];
  status: string;
};

type Props = {
  roleName: string;
  roleLabel: string;
  users: UserRow[];
  onClose: () => void;
  onEditUser: (user: UserRow) => void;
  onChanged: () => Promise<void>;
};

export function RoleAssignedUsers({ roleName, roleLabel, users, onClose, onEditUser, onChanged }: Props) {
  const [query, setQuery] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const assignedUsers = useMemo(
    () => users.filter((user) => user.roles.includes(roleName)),
    [users, roleName],
  );

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return assignedUsers;
    return assignedUsers.filter((user) =>
      [user.name, user.email, user.phone || '', user.status].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [assignedUsers, query]);

  const availableUsers = useMemo(
    () => users.filter((user) => !user.roles.includes(roleName)).sort((a, b) => a.name.localeCompare(b.name)),
    [users, roleName],
  );

  const assignUser = async () => {
    if (!selectedUserId) return;
    const user = users.find((item) => item.id === selectedUserId);
    if (!user) return;
    setAssigning(true);
    setError('');
    setSuccess('');
    try {
      const roles = [...new Set([...user.roles, roleName])];
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, roles }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to assign user to this role.');
      setSelectedUserId('');
      setShowAssign(false);
      setSuccess(`${user.name} was assigned to ${roleLabel}.`);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign user to this role.');
    } finally {
      setAssigning(false);
    }
  };

  const removeUser = async (user: UserRow) => {
    if (roleName === 'SUPER_ADMIN' && user.roles.includes('SUPER_ADMIN') && user.roles.length === 1) {
      setError('A user cannot lose their only Super Admin role from this screen.');
      return;
    }
    if (!window.confirm(`Remove ${roleLabel} from ${user.name}? The user account will remain active.`)) return;
    setRemovingId(user.id);
    setError('');
    setSuccess('');
    try {
      const roles = user.roles.filter((role) => role !== roleName);
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, roles }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to remove role assignment.');
      setSuccess(`${user.name} was removed from ${roleLabel}.`);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove role assignment.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#151720] shadow-2xl shadow-black/60" role="dialog" aria-modal="true" aria-labelledby="assigned-users-title">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p id="assigned-users-title" className="text-lg font-extrabold text-white">{roleLabel} — Assigned Users</p>
            <p className="mt-1 text-xs text-gray-500">View, assign, edit, or remove users assigned to this role.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white" aria-label="Close assigned users"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, phone..." className="w-full rounded-xl border border-gray-800 bg-gray-950 py-2.5 pl-9 pr-3 text-xs text-white outline-none placeholder:text-gray-600 focus:border-gray-700" />
          </div>
          <button type="button" onClick={() => { setShowAssign((value) => !value); setError(''); setSuccess(''); }} disabled={availableUsers.length === 0} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl gradient-terracotta px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><UserPlus className="h-4 w-4" /> Assign User</button>
        </div>

        {showAssign && <div className="shrink-0 border-b border-white/10 bg-black/10 px-6 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2.5 text-xs text-white outline-none">
              <option value="">Select a dashboard user...</option>
              {availableUsers.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.email}</option>)}
            </select>
            <button type="button" disabled={!selectedUserId || assigning} onClick={() => void assignUser()} className="rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-200 border border-gray-700 disabled:cursor-not-allowed disabled:opacity-40">{assigning ? 'Assigning…' : 'Confirm assignment'}</button>
          </div>
          <p className="mt-2 text-[10px] text-gray-500">This adds the role without removing any roles the user already has.</p>
        </div>}

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{error}</div>}
        {success && <div className="mx-6 mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">{success}</div>}

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {filteredUsers.length === 0 ? <div className="rounded-2xl border border-white/10 bg-black/10 px-6 py-12 text-center"><UserPlus className="mx-auto h-7 w-7 text-gray-600" /><p className="mt-3 text-sm font-bold text-white">{assignedUsers.length === 0 ? 'No users assigned' : 'No matching users'}</p><p className="mt-1 text-xs text-gray-500">{assignedUsers.length === 0 ? `Assign a dashboard user to ${roleLabel} to get started.` : 'Try a different search term.'}</p></div> : <div className="overflow-hidden rounded-2xl border border-white/10"><table className="w-full text-left"><thead><tr className="bg-gray-900/90 text-[10px] uppercase text-gray-500"><th className="p-4">User</th><th className="p-4">Status</th><th className="p-4">Other roles</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-white/5 text-xs">{filteredUsers.map((user) => {
            const otherRoles = user.roles.filter((role) => role !== roleName);
            const protectedSuperAdmin = roleName === 'SUPER_ADMIN' && user.roles.includes('SUPER_ADMIN') && user.roles.length === 1;
            return <tr key={user.id} className="hover:bg-white/5">
              <td className="p-4"><span className="block font-bold text-white">{user.name}</span><span className="mt-1 flex items-center gap-1 text-[10px] text-gray-500"><Mail className="h-3 w-3" />{user.email}</span></td>
              <td className="p-4"><span className={user.status === 'SUSPENDED' ? 'font-bold text-red-400' : 'font-bold text-emerald-300'}>{user.status}</span></td>
              <td className="p-4"><div className="flex max-w-xs flex-wrap gap-1.5">{otherRoles.length ? otherRoles.map((role) => <span key={role} className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1 text-[9px] font-bold text-gray-400">{role.replaceAll('_', ' ')}</span>) : <span className="text-[10px] text-gray-600">No other roles</span>}</div></td>
              <td className="p-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => onEditUser(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-[10px] font-bold text-gray-200 hover:border-gray-600 hover:text-white"><Edit3 className="h-3 w-3 text-[#e59838]" /> Edit</button><button type="button" disabled={protectedSuperAdmin || removingId === user.id} onClick={() => void removeUser(user)} title={protectedSuperAdmin ? 'Protected Super Admin role' : 'Remove this role from user'} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-1.5 text-[10px] font-bold text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"><UserMinus className="h-3 w-3" />{removingId === user.id ? 'Removing…' : 'Remove'}</button></div></td>
            </tr>;
          })}</tbody></table></div>}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-6 py-4"><p className="text-[10px] text-gray-500">{assignedUsers.length} {assignedUsers.length === 1 ? 'user' : 'users'} assigned</p><button type="button" onClick={onClose} className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-300 hover:text-white">Done</button></div>
      </div>
    </div>
  );
}
