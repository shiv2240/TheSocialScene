'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [portalReady, setPortalReady] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    setSelectedRoles(currentRoles);
  }, [currentRoles]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      // The role picker is rendered through a portal, so its events do not
      // belong to the action-menu ref. Let the modal manage its own closing.
      if (rolePicker) return;
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [rolePicker]);

  useEffect(() => {
    if (!rolePicker) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingRoles) closeRolePicker();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [rolePicker, savingRoles]);

  const closeRolePicker = () => {
    if (savingRoles) return;
    setSelectedRoles(currentRoles);
    setOpen(false);
    setRolePicker(false);
  };

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
      const availableRoles = Array.isArray(body.roles) ? (body.roles as RoleOption[]) : [];
      availableRoles.sort((a, b) => {
        const ai = ROLE_PRIORITY.indexOf(a.name);
        const bi = ROLE_PRIORITY.indexOf(b.name);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
      setRoles(availableRoles);
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
  const hasChanges = useMemo(() => [...selectedRoles].sort().join('|') !== [...currentRoles].sort().join('|'), [currentRoles, selectedRoles]);

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

  const rolePickerModal = open && rolePicker && portalReady ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRolePicker(); }}>
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#151720] shadow-2xl shadow-black/60" role="dialog" aria-modal="true" aria-labelledby="change-roles-title">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div><p id="change-roles-title" className="text-lg font-extrabold text-white">Change dashboard roles</p><p className="mt-1 text-xs text-gray-500">Assign one or more roles. Permissions are combined across all selected roles.</p></div>
          <button type="button" disabled={savingRoles} onClick={closeRolePicker} className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="Close role picker"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 bg-black/10 px-6 py-4">
          <div><p className="text-xs font-bold text-white">{userName}</p><p className="mt-0.5 text-[10px] text-gray-500">{selectedCount} {selectedCount === 1 ? 'role' : 'roles'} selected</p></div>
          {isSelf && <span className="rounded-lg border border-[#c85a3c]/30 bg-[#c85a3c]/10 px-2 py-1 text-[10px] font-bold text-[#e59838]">Super Admin account</span>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {rolesLoading ? <div className="py-12 text-center text-xs text-gray-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading roles…</div> : rolesError ? <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{rolesError}</div> : roles.length === 0 ? <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-6 text-center text-xs text-gray-500">No dashboard roles are configured.</div> : <div className="space-y-2">{roles.map((role) => { const selected = selectedRoles.includes(role.name); const protectedRole = role.name === 'SUPER_ADMIN' && isSelf; return <button key={role.id} type="button" onClick={() => toggleRole(role.name)} disabled={protectedRole || savingRoles} className={`w-full rounded-xl border p-4 text-left transition-all ${selected ? 'border-[#c85a3c]/50 bg-[#c85a3c]/10' : 'border-white/10 bg-gray-950/30 hover:bg-white/5'} ${protectedRole ? 'cursor-not-allowed' : ''}`}><span className="flex items-start gap-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? 'border-[#c85a3c] bg-[#c85a3c] text-white' : 'border-gray-600 bg-gray-950 text-transparent'}`}><Check className="h-3.5 w-3.5" /></span><span className="min-w-0"><span className="flex items-center gap-2"><span className="text-sm font-bold text-white">{ROLE_LABELS[role.name] || role.name}</span>{protectedRole && <span className="text-[9px] font-bold uppercase tracking-wider text-[#e59838]">Protected</span>}</span>{role.description && <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">{role.description}</span>}</span></span></button>; })}</div>}
          {saveError && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-xs text-red-300">{saveError}</div>}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#151720] px-6 py-4">
          <p className="text-[10px] text-gray-500">{selectedCount === 0 ? 'No roles means no dashboard authorization.' : 'Changes apply immediately after saving.'}</p>
          <div className="flex shrink-0 gap-2"><button type="button" disabled={savingRoles} onClick={closeRolePicker} className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-300 hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">Cancel</button><button type="button" disabled={savingRoles || !hasChanges || (isSelf && !selectedRoles.includes('SUPER_ADMIN'))} onClick={() => void saveRoleSelection()} className="rounded-xl gradient-terracotta px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{savingRoles ? 'Saving…' : 'Save roles'}</button></div>
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button type="button" disabled={busy} onClick={() => { setOpen((value) => !value); setRolePicker(false); }} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700 bg-gray-900 text-gray-300 transition-colors hover:border-gray-600 hover:text-white disabled:opacity-50" aria-label={`Actions for ${userName}`} title="More actions"><MoreHorizontal className="h-4 w-4" /></button>
      {open && !rolePicker && <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-white/10 bg-[#151720] p-1.5 shadow-2xl shadow-black/40">
        <button type="button" onClick={() => run(onEdit)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-gray-200 hover:bg-white/5"><Edit3 className="h-3.5 w-3.5 text-[#e59838]" /> Edit user</button>
        <button type="button" onClick={() => void openRolePicker()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-gray-200 hover:bg-white/5"><UserCog className="h-3.5 w-3.5 text-[#e59838]" /> Change roles <span className="ml-auto text-[10px] text-gray-500">{currentRoles.length}</span></button>
        <button type="button" disabled={isSelf} onClick={() => run(onToggleStatus)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-gray-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><StatusIcon className="h-3.5 w-3.5" /> {status === 'SUSPENDED' ? 'Restore access' : 'Suspend access'}</button>
        {canResend && onResend && <button type="button" onClick={() => run(onResend)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-gray-200 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5 text-amber-300" /> Resend activation</button>}
        <div className="my-1 border-t border-white/10" />
        <button type="button" disabled={isSelf} onClick={() => run(onRemoveAccess)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /> Remove dashboard access</button>
      </div>}
      {rolePickerModal}
    </div>
  );
}
