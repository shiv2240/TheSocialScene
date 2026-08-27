'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, ShieldCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login');
      setChecking(false);
    });
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 10) return setError('Password must be at least 10 characters long.');
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) return setError('Use at least one uppercase letter, one lowercase letter and one number.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }

      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false, updated_at: new Date().toISOString() })
        .eq('auth_user_id', user.id);
      if (profileError) throw profileError;

      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md dashboard-card p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl gradient-bg mx-auto flex items-center justify-center mb-4"><LockKeyhole className="w-6 h-6 text-white" /></div>
          <h1 className="text-2xl font-extrabold text-white">Set your dashboard password</h1>
          <p className="text-xs text-gray-400 mt-2">This is required before you can access your assigned dashboard.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-gray-300">New password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-semibold text-gray-300">Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500" /></label>
          <p className="text-[11px] text-gray-500">Minimum 10 characters, with uppercase, lowercase and a number.</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button disabled={loading} className="w-full py-3.5 rounded-xl gradient-bg text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Save password</button>
        </form>
      </div>
    </div>
  );
}
