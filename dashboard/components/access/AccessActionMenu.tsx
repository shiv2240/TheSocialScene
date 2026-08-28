'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Edit3, ShieldOff, ShieldCheck, UserCog, Trash2, RefreshCw } from 'lucide-react';

type Props = {
  userId: string;
  status: string;
  isSelf?: boolean;
  canResend?: boolean;
  onEdit: () => void;
  onChangeRole: () => void;
  onToggleStatus: () => void;
  onRemoveAccess: () => void;
  onResend?: () => void;
  busy?: boolean;
};

export function AccessActionMenu({ userId, status, isSelf, canResend, onEdit, onChangeRole, onToggleStatus, onRemoveAccess, onResend, busy }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const run = (action: () => void) => { setOpen(false); action(); };
  const StatusIcon = status === 'SUSPENDED' ? ShieldCheck : ShieldOff;
  return (
    <div ref={ref} className="relative inline-block text-left">
      <button type="button" disabled={busy} onClick={() => setOpen((value) => !value)} className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 inline-flex items-center justify-center transition-colors disabled:opacity-50" aria-label={`Actions for ${userId}`} title="More actions"><MoreHorizontal className="w-4 h-4" /></button>
      {open && <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-white/10 bg-[#151720] shadow-2xl shadow-black/40 p-1.5">
        <button type="button" onClick={() => run(onEdit)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><Edit3 className="w-3.5 h-3.5 text-[#e59838]" /> Edit user</button>
        <button type="button" onClick={() => run(onChangeRole)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><UserCog className="w-3.5 h-3.5 text-[#e59838]" /> Change role</button>
        <button type="button" disabled={isSelf} onClick={() => run(onToggleStatus)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left disabled:opacity-40 disabled:cursor-not-allowed"><StatusIcon className="w-3.5 h-3.5" /> {status === 'SUSPENDED' ? 'Restore access' : 'Suspend access'}</button>
        {canResend && onResend && <button type="button" onClick={() => run(onResend)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-gray-200 hover:bg-white/5 text-left"><RefreshCw className="w-3.5 h-3.5 text-amber-300" /> Resend activation</button>}
        <div className="my-1 border-t border-white/10" />
        <button type="button" disabled={isSelf} onClick={() => run(onRemoveAccess)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-red-300 hover:bg-red-500/10 text-left disabled:opacity-40 disabled:cursor-not-allowed"><Trash2 className="w-3.5 h-3.5" /> Remove dashboard access</button>
      </div>}
    </div>
  );
}
