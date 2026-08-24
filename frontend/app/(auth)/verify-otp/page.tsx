'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getFirebaseAuth } from '@/lib/firebase/client';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  return value;
}

function VerifyOtpContent() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('tss_auth_phone') || '';
    const storedNext = sessionStorage.getItem('tss_auth_next');
    setPhone(storedPhone);
    if (!storedPhone) router.replace('/login');
    if (!storedNext) sessionStorage.setItem('tss_auth_next', '/profile');
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const verifyBody = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyBody.error || 'Invalid or expired OTP.');

      await signInWithCustomToken(getFirebaseAuth(), verifyBody.customToken);
      const idToken = await getFirebaseAuth().currentUser?.getIdToken(true);
      if (!idToken) throw new Error('Unable to establish Firebase authentication.');

      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const sessionBody = await sessionResponse.json();
      if (!sessionResponse.ok) throw new Error(sessionBody.error || 'Unable to establish your session.');

      const next = safeNext(sessionStorage.getItem('tss_auth_next'));
      sessionStorage.removeItem('tss_auth_next');
      sessionStorage.removeItem('tss_auth_phone');
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0 || !phone) return;
    setError('');
    setResending(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to resend OTP.');
      setCooldown(30);
      setOtp('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-gray-800 shadow-2xl relative z-10 space-y-6">
      <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Change number</Link>
      <div className="text-center space-y-2">
        <div className="inline-flex w-10 h-10 rounded-xl gradient-bg items-center justify-center mb-2"><Sparkles className="w-5 h-5 text-white" /></div>
        <h1 className="text-2xl font-extrabold text-white">Verify your mobile</h1>
        <p className="text-xs text-gray-400">We sent a 6-digit code to <span className="font-bold text-purple-300">+91 {phone}</span></p>
      </div>
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-2">
          <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="w-full text-center tracking-[0.5em] text-2xl font-bold py-4 rounded-xl bg-gray-900/90 border border-gray-700 text-white placeholder-gray-700 focus:outline-none focus:border-purple-500" required />
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>
        <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100">
          {loading ? <span className="animate-pulse">Verifying...</span> : <><CheckCircle2 className="w-4 h-4" /><span>Verify & Continue</span></>}
        </button>
      </form>
      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-800">
        <span>Didn't receive it?</span>
        {cooldown > 0 ? <span className="text-gray-500 font-medium">Resend in {cooldown}s</span> : <button type="button" onClick={resendOtp} disabled={resending} className="text-purple-400 font-semibold hover:underline flex items-center gap-1 disabled:opacity-50"><RefreshCw className="w-3 h-3" /> {resending ? 'Sending...' : 'Resend OTP'}</button>}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return <div className="min-h-screen bg-[#090a0f] text-gray-100 flex items-center justify-center p-4 relative overflow-hidden"><div className="gradient-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /><Suspense fallback={<div className="text-white text-xs">Loading OTP page...</div>}><VerifyOtpContent /></Suspense></div>;
}
