'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase/client';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  return value;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to send OTP.');
      sessionStorage.setItem('tss_auth_next', next);
      sessionStorage.setItem('tss_auth_phone', phone);
      router.push('/verify-otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getFirebaseAuth(), provider);
      const idToken = await result.user.getIdToken(true);
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to sign in with Google.');
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="gradient-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-gray-800 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-purple-500/20"><Sparkles className="w-5 h-5 text-white" /></div>
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Join The Social Scene</h1>
          <p className="text-xs text-gray-400">Your mobile number is the primary account identity.</p>
        </div>

        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="phone" className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Mobile Number</label>
            <div className="flex gap-2">
              <div className="px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm font-bold text-gray-300">+91</div>
              <input id="phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone.replace(/^\\+91\\s?/, '')} onChange={(e) => setPhone(e.target.value.replace(/\\D/g, '').slice(0, 10))} placeholder="9876543210" className="flex-1 px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm font-semibold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" required />
            </div>
            <p className="text-[11px] text-gray-500">We’ll send a secure OTP to verify your number.</p>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <button type="submit" disabled={loading || phone.length !== 10} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100">
            {loading ? <span className="animate-pulse">Sending OTP...</span> : <><span>Continue with Mobile</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="relative py-2"><div className="border-t border-gray-800" /><span className="absolute left-1/2 -translate-x-1/2 -top-2 px-3 bg-[#12131a] text-[10px] uppercase tracking-widest text-gray-600">or</span></div>

        <button type="button" onClick={handleGoogle} disabled={googleLoading} className="w-full py-3.5 rounded-xl border border-gray-700 bg-gray-900/70 text-white font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-60">
          {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-800"><ShieldCheck className="w-4 h-4 text-purple-400" /><span>Secure authentication powered by 2Factor + Firebase</span></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center text-sm">Loading...</div>}><LoginContent /></Suspense>;
}
