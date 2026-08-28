'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Edit3, ShieldOff, ShieldCheck, UserCog, Trash2, RefreshCw, ChevronLeft, Loader2 } from 'lucide-react';

type RoleOption = { id: string; name: string; description?: string | null; is_system?: boolean };
type Props = {
  userId: string;
  status: string;
  isSelf?: boolean;
  canResend?: boolean;
  onEdit: () => void;
  onChangeRole: (role?: string) => void;
  onToggleStatus: () => void;
  onRemoveAccess: () => void;
  onResend?: () => void;
  busy?: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', HOST: 'Host', EVENT_MANAGER: 'Event Manager',
  CHECKIN_STAFF: 'Check-in Staff', EDITOR: 'Editor', FINANCE: 'Finance', SUPPORT: 'Support',
};

export function AccessActionMenu({ userId, status, isSelf, canResend, onEdit, onChangeRole, onToggleStatus, onRemoveAccess, onResend, busy }: Props) {
  const [open, setOpen] = useState(false);
  const [rolePicker, setRolePicker] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) { setOpen(false); setRolePicker(false); }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const openRolePicker = async () => {
    setRolePicker(true);
    setRolesError('');
    if (roles.length) return;
    setRolesLoading(true);
    try {
      const response = await fetch('/api/roles', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load available roles.');
      setRoles((body.roles || []).filter((role: RoleOption) => role.name !== 'SUPER_ADMIN'));
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'Unable to load available roles.');
    } finally {
      setRolesLoading(false);
    }
  };

  const chooseRole = (role: string) => {
    setOpen(false); setRolePicker(false); onChangeRole(role);
  };
  const run = (action: () => void) => { setOpen(false); setRolePicker(false); action(); };
  const StatusIcon = status === 'SUSPENDED' ? ShieldCheck : ShieldOff;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button type="button" disabled={busy} onClick={() => { setOpen((value) => !value); setRolePicker(false); }} className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 inline-flex items-center justify-center transition-colors disabled:opacity-50" aria-label={`Actions for ${userId}`} title="More actions"><MoreHorizontal className="w-4 h-4" /></button>
      {open && !rolePicker && <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-white/10 bg-[#151720] shadow-2xl shadow-black/40 p-1.5">
        <button type="button" onClick={() => run(onEdit)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><Edit3 className="w-3.5 h-3.5 text-[#e59838]" /> Edit user</button>
        <button type="button" onClick={() => void openRolePicker()} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><UserCog className="w-3.5 h-3.5 text-[#e59838]" /> Change role</button>
        <button type="button" disabled={isSelf} onClick={() => run(onToggleStatus)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left disabled:opacity-40 disabled:cursor-not-allowed"><StatusIcon className="w-3.5 h-3.5" /> {status === 'SUSPENDED' ? 'Restore access' : 'Suspend access'}</button>
        {canResend && onResend && <button type="button" onClick={() => run(onResend)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><RefreshCw className="w-3.5 h-3.5 text-amber-300" /> Resend activation</button>}
        <div className="my-1 border-t border-white/10" />
        <button type="button" disabled={isSelf} onClick={() => run(onRemoveAccess)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-red-300 hover:bg-red-500/10 text-left disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /> Remove dashboard access</button>
      </div>}
      {open && rolePicker && <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-white/10 bg-[#151720] shadow-2xl shadow-black/40 p-2">
        <button type="button" onClick={() => setRolePicker(false)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-300 hover:bg-white/5 text-left"><ChevronLeft className="w-3.5 h-3.5" /> Back to actions</button>
        <div className="px-2.5 pt-2 pb-1"><p className="text-xs font-bold text-white">Select dashboard role</p><p className="text-[10px] text-gray-500 mt-0.5">Choose an existing role. Super Admin is protected.</p></div>
        {rolesLoading ? <div className="p-4 text-center text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />Loading roles…</div> : rolesError ? <div className="p-3 text-[10px] text-red-300">{rolesError}</div> : roles.length === 0 ? <div className="p-3 text-[10px] text-gray-500">No assignable roles available.</div> : <div className="mt-1 space-y-1">{roles.map((role) => <button key={role.id} type="button" onClick={() => chooseRole(role.name)} className="w-full rounded-lg px-2.5 py-2 text-left hover:bg-white/5 border border-transparent hover:border-white/10"><span className="block text-xs font-bold text-gray-100">{ROLE_LABELS[role.name] || role.name}</span>{role.description && <span className="block text-[10px] text-gray-500 mt-0.5 line-clamp-2">{role.description}</span>}</button>)}</div>}
      </div>}
    </div>
  );
}
