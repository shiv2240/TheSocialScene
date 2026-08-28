'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal, Edit3, ShieldOff, ShieldCheck, UserCog, Trash2, RefreshCw, Loader2, Check, X } from 'lucide-react';

type RoleOption = { id: string; name: string; description?: string | null; is_system?: boolean };
type Props = {
  userId: string;
  userName: string;
  status: string;
  currentRoles: string[];
  isSelf?: boolean;
  canResend?: boolean;
  onEdit: () => void;
  onRolesSaved: (roles: string[]) => void;
  onToggleStatus: () => void;
  onRemoveAccess: () => void;
  onResend?: () => void;
  busy?: boolean;
};

const ROLE_PRIORITY = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER', 'HOST', 'CHECKIN_STAFF', 'EDITOR', 'FINANCE', 'SUPPORT'];
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', HOST: 'Host', EVENT_MANAGER: 'Event Manager',
  CHECKIN_STAFF: 'Check-in Staff', EDITOR: 'Editor', FINANCE: 'Finance', SUPPORT: 'Support',
};

export function AccessActionMenu({ userId, userName, status, currentRoles, isSelf, canResend, onEdit, onRolesSaved, onToggleStatus, onRemoveAccess, onResend, busy }: Props) {
  const [open, setOpen] = useState(false);
  const [rolePicker, setRolePicker] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState('');
  const [savingRoles, setSavingRoles] = useState(false);
  const [saveError, setSaveError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedRoles(currentRoles);
  }, [currentRoles]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setRolePicker(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const openRolePicker = async () => {
    setRolePicker(true);
    setRolesError('');
    setSaveError('');
    setSelectedRoles(currentRoles);
    if (roles.length) return;
    setRolesLoading(true);
    try {
      const response = await fetch('/api/roles', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load available roles.');
      setRoles((body.roles || []).sort((a: RoleOption, b: RoleOption) => {
        const ai = ROLE_PRIORITY.indexOf(a.name);
        const bi = ROLE_PRIORITY.indexOf(b.name);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      }));
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'Unable to load available roles.');
    } finally {
      setRolesLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    if (role === 'SUPER_ADMIN' && isSelf) return;
    setSelectedRoles((current) => current.includes(role) ? current.filter((value) => value !== role) : [...current, role]);
  };

  const selectedCount = selectedRoles.length;
  const hasChanges = useMemo(() => {
    const a = [...selectedRoles].sort().join('|');
    const b = [...currentRoles].sort().join('|');
    return a !== b;
  }, [currentRoles, selectedRoles]);

  const saveRoleSelection = async () => {
    if (isSelf && !selectedRoles.includes('SUPER_ADMIN')) {
      setSaveError('Super Admin must remain assigned to your own account.');
      return;
    }
    setSavingRoles(true);
    setSaveError('');
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, roles: selectedRoles }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to update dashboard roles.');
      const savedRoles = Array.isArray(body.roles) ? body.roles : selectedRoles;
      onRolesSaved(savedRoles);
      setOpen(false);
      setRolePicker(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to update dashboard roles.');
    } finally {
      setSavingRoles(false);
    }
  };

  const run = (action: () => void) => { setOpen(false); setRolePicker(false); action(); };
  const StatusIcon = status === 'SUSPENDED' ? ShieldCheck : ShieldOff;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button type="button" disabled={busy} onClick={() => { setOpen((value) => !value); setRolePicker(false); }} className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 inline-flex items-center justify-center transition-colors disabled:opacity-50" aria-label={`Actions for ${userName}`} title="More actions"><MoreHorizontal className="w-4 h-4" /></button>
      {open && !rolePicker && <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-white/10 bg-[#151720] shadow-2xl shadow-black/40 p-1.5">
        <button type="button" onClick={() => run(onEdit)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><Edit3 className="w-3.5 h-3.5 text-[#e59838]" /> Edit user</button>
        <button type="button" onClick={() => void openRolePicker()} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><UserCog className="w-3.5 h-3.5 text-[#e59838]" /> Change roles <span className="ml-auto text-[10px] text-gray-500">{currentRoles.length}</span></button>
        <button type="button" disabled={isSelf} onClick={() => run(onToggleStatus)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left disabled:opacity-40 disabled:cursor-not-allowed"><StatusIcon className="w-3.5 h-3.5" /> {status === 'SUSPENDED' ? 'Restore access' : 'Suspend access'}</button>
        {canResend && onResend && <button type="button" onClick={() => run(onResend)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><RefreshCw className="w-3.5 h-3.5 text-amber-300" /> Resend activation</button>}
        <div className="my-1 border-t border-white/10" />
        <button type="button" disabled={isSelf} onClick={() => run(onRemoveAccess)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-red-300 hover:bg-red-500/10 text-left disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /> Remove dashboard access</button>
      </div>}
      {open && rolePicker && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingRoles) { setOpen(false); setRolePicker(false); } }}>
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#151720] shadow-2xl shadow-black/60 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="change-roles-title">
          <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4"><div><p id="change-roles-title" className="text-lg font-extrabold text-white">Change dashboard roles</p><p className="text-xs text-gray-500 mt-1">Assign one or more roles. Permissions are combined across all selected roles.</p></div><button type="button" disabled={savingRoles} onClick={() => { setOpen(false); setRolePicker(false); }} className="text-gray-500 hover:text-white disabled:opacity-40"><X className="w-5 h-5" /></button></div>
          <div className="px-6 py-4 bg-black/10 border-b border-white/5 flex items-center justify-between"><div><p className="text-xs font-bold text-white">{userName}</p><p className="text-[10px] text-gray-500 mt-0.5">{selectedCount} {selectedCount === 1 ? 'role' : 'roles'} selected</p></div>{isSelf && <span className="px-2 py-1 rounded-lg bg-[#c85a3c]/10 border border-[#c85a3c]/30 text-[10px] font-bold text-[#e59838]">Super Admin account</span>}</div>
          <div className="p-6 max-h-[55vh] overflow-y-auto">
            {rolesLoading ? <div className="py-12 text-center text-xs text-gray-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading roles…</div> : rolesError ? <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{rolesError}</div> : <div className="space-y-2">{roles.map((role) => { const selected = selectedRoles.includes(role.name); const protectedRole = role.name === 'SUPER_ADMIN' && isSelf; return <button key={role.id} type="button" onClick={() => toggleRole(role.name)} disabled={protectedRole || savingRoles} className={`w-full text-left rounded-xl border p-4 transition-all ${selected ? 'border-[#c85a3c]/50 bg-[#c85a3c]/10' : 'border-white/10 bg-gray-950/30 hover:bg-white/5'} ${protectedRole ? 'cursor-not-allowed' : ''}`}><span className="flex items-start gap-3"><span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#c85a3c] border-[#c85a3c] text-white' : 'border-gray-600 bg-gray-950 text-transparent'}`}><Check className="w-3.5 h-3.5" /></span><span className="min-w-0"><span className="flex items-center gap-2"><span className="text-sm font-bold text-white">{ROLE_LABELS[role.name] || role.name}</span>{protectedRole && <span className="text-[9px] font-bold uppercase tracking-wider text-[#e59838]">Protected</span>}</span>{role.description && <span className="block text-[11px] text-gray-500 mt-1 leading-relaxed">{role.description}</span>}</span></span></button>; })}</div>}
            {saveError && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{saveError}</div>}
          </div>
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between gap-3"><p className="text-[10px] text-gray-500">{selectedCount === 0 ? 'No roles means no dashboard authorization.' : 'Changes apply immediately after saving.'}</p><div className="flex gap-2"><button type="button" disabled={savingRoles} onClick={() => { setSelectedRoles(currentRoles); setOpen(false); setRolePicker(false); }} className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs font-bold text-gray-300 disabled:opacity-50">Cancel</button><button type="button" disabled={savingRoles || !hasChanges || (isSelf && !selectedRoles.includes('SUPER_ADMIN'))} onClick={() => void saveRoleSelection()} className="px-4 py-2.5 rounded-xl gradient-terracotta text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed">{savingRoles ? 'Saving…' : 'Save roles'}</button></div></div>
        </div>
      </div>}
    </div>
  );
}
