'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface ProfileEditorProps {
  initialName: string;
  initialEmail: string;
  initialMarketingOptIn: boolean;
}

export function ProfileEditor({ initialName, initialEmail, initialMarketingOptIn }: ProfileEditorProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [marketingOptIn, setMarketingOptIn] = useState(initialMarketingOptIn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          marketing_opt_in: marketingOptIn,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to update profile.');
      setName(body.profile?.full_name ?? name.trim());
      setEmail(body.profile?.email ?? '');
      setMarketingOptIn(Boolean(body.profile?.marketing_opt_in));
      setMessage('Profile updated successfully. Your email is saved for tickets and updates.');
      window.dispatchEvent(new Event('tss:profile-updated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pt-2">
      <div>
        <label htmlFor="profile-name" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full name</label>
        <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full px-4 py-3 rounded-xl bg-[#1d1a24] border border-white/10 text-sm text-white focus:outline-none focus:border-[#ff573d]" />
      </div>
      <div>
        <label htmlFor="profile-email" className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email for tickets & updates</label>
        <input id="profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-2 w-full px-4 py-3 rounded-xl bg-[#1d1a24] border border-white/10 text-sm text-white focus:outline-none focus:border-[#ff573d]" />
        <p className="mt-1 text-[11px] text-gray-500">Optional. This email is stored on your The Social Scene profile. It does not change your phone-based sign-in method.</p>
      </div>
      <label className="flex items-start gap-3 p-4 rounded-xl bg-[#1d1a24] border border-white/10 cursor-pointer">
        <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-1 accent-[#ff573d]" />
        <span><span className="text-sm font-bold text-white block">Receive promotions and recommendations</span><span className="text-xs text-gray-500">We'll only use your email for marketing when you opt in.</span></span>
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {message && <p className="text-xs text-emerald-400">{message}</p>}
      <button type="button" onClick={save} disabled={saving || name.trim().length < 2} className="px-5 py-3 rounded-xl gradient-terracotta text-white text-xs font-extrabold flex items-center gap-2 disabled:opacity-50">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
}
