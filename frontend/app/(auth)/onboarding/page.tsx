'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, UserRound } from 'lucide-react';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  return value;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('full_name, phone').eq('auth_user_id', user.id).maybeSingle();
      setName(data?.full_name || '');
      setPhone(data?.phone || user.phone || '');
    };
    void loadProfile();
  }, [router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = name.trim();
    const normalizedPhone = phone.trim();
    if (fullName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (normalizedPhone && !/^\+?[1-9]\d{7,14}$/.test(normalizedPhone.replace(/[\s()-]/g, ''))) {
      setError('Please enter a valid phone number or leave it blank.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Your session has expired. Please sign in again.');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: normalizedPhone || null })
        .eq('auth_user_id', user.id);

      if (updateError) throw updateError;
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090a0f] text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-7">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl gradient-bg flex items-center justify-center"><UserRound className="w-6 h-6 text-white" /></div>
          <h1 className="text-2xl font-extrabold text-white">Complete your profile</h1>
          <p className="text-xs text-gray-400">Just a couple of details before you continue.</p>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-2 w-full px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500" required />
          </div>
          <div>
            <label htmlFor="phone" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Phone (optional)</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+91 9876543210" className="mt-2 w-full px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? 'Saving...' : <>Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center text-sm">Loading...</div>}><OnboardingContent /></Suspense>;
}
