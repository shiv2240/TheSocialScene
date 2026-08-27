'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CalendarDays, UserRound } from 'lucide-react';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  return value;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch('/api/profile', { cache: 'no-store', credentials: 'include' });
      if (response.status === 401) {
        router.replace('/login');
        return;
      }
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || 'Unable to load your profile.');
        return;
      }
      if (body.profile?.onboarding_completed) {
        router.replace(next);
        return;
      }
      setName(body.profile?.full_name && body.profile.full_name !== 'The Social Scene Member' ? body.profile.full_name : '');
      setAge(body.profile?.age ? String(body.profile.age) : '');
      setPhone(body.profile?.phone || '');
      setUsername(body.profile?.username || '');
    };
    void loadProfile();
  }, [next, router]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = name.trim();
    const numericAge = Number(age);
    if (fullName.length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 120) {
      setError('Please enter a valid age between 13 and 120.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: fullName, age: numericAge }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to complete your profile.');
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090a0f] text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-7">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl gradient-bg flex items-center justify-center"><UserRound className="w-6 h-6 text-white" /></div>
          <h1 className="text-2xl font-extrabold text-white">Welcome to The Social Scene</h1>
          <p className="text-xs text-gray-400">Tell us who you are before you start exploring.</p>
        </div>

        <form onSubmit={saveProfile} className="space-y-5">
          <div>
            <label htmlFor="name" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Your full name" className="mt-2 w-full px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500" required />
            <p className="mt-1.5 text-[11px] text-gray-500">This becomes your account name and cannot be changed later.</p>
          </div>

          <div>
            <label htmlFor="age" className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" />Age</label>
            <input id="age" type="number" inputMode="numeric" min={13} max={120} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Your age" className="mt-2 w-full px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700 text-sm text-white focus:outline-none focus:border-purple-500" required />
            <p className="mt-1.5 text-[11px] text-gray-500">Used for your member profile and age-based event eligibility.</p>
          </div>

          <div className="rounded-xl bg-gray-900/60 border border-gray-800 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mobile</span><span className="text-sm font-bold text-white">{phone || 'Verified'}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Social ID</span><span className="text-sm font-bold text-purple-300">{username ? `@${username}` : 'Assigned automatically'}</span></div>
            <p className="text-[11px] text-gray-500">Your Social ID is permanent and is used to identify your account across The Social Scene.</p>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? 'Setting up your profile...' : <>Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center text-sm">Loading...</div>}><OnboardingContent /></Suspense>;
}
