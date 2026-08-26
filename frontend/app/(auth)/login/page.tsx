'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthProvider, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup } from 'firebase/auth';
import { ArrowRight, Mail, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/profile';
  return value;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const establishSession = async () => {
    const auth = getFirebaseAuth();
    const idToken = await auth.currentUser?.getIdToken(true);
    if (!idToken) throw new Error('Unable to establish Firebase authentication.');
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to establish your session.');
  };

  useEffect(() => {
    const completeEmailLinkLogin = async () => {
      const auth = getFirebaseAuth();
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      setEmailLoading(true);
      setError('');
      try {
        const storedEmail = window.localStorage.getItem('tss_email_for_signin') || window.prompt('Enter the email address you used to request the login link:') || '';
        if (!storedEmail) throw new Error('Email address is required to complete sign-in.');
        await signInWithEmailLink(auth, storedEmail.trim(), window.location.href);
        window.localStorage.removeItem('tss_email_for_signin');
        await establishSession();
        router.replace(next);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'This email login link is invalid or expired.');
      } finally {
        setEmailLoading(false);
      }
    };
    void completeEmailLinkLogin();
  }, [next, router]);

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

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setEmailSent(false);
    setEmailLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) throw new Error('Please enter your email address.');
      const actionCodeSettings = {
        url: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(getFirebaseAuth(), normalizedEmail, actionCodeSettings);
      window.localStorage.setItem('tss_email_for_signin', normalizedEmail);
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send the email login link.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getFirebaseAuth(), provider);
      await establishSession();
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="gradient-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-gray-800 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-purple-500/20"><Sparkles className="w-5 h-5 text-white" /></div>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Join The Social Scene</h1>
            <p className="text-xs text-gray-400">Use mobile OTP or passwordless email login.</p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Mobile number</label>
              <div className="flex gap-2">
                <div className="px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm font-bold text-gray-300">+91</div>
                <input id="phone" type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className="flex-1 px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm font-semibold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" required />
              </div>
            </div>
            <button type="submit" disabled={loading || phone.length !== 10} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <span className="animate-pulse">Sending OTP...</span> : <><Smartphone className="w-4 h-4" /><span>Continue with Mobile OTP</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="relative py-2"><div className="border-t border-gray-800" /><span className="absolute left-1/2 -translate-x-1/2 -top-2 px-3 bg-[#12131a] text-[10px] uppercase tracking-widest text-gray-600">or</span></div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <label htmlFor="email" className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Email login</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm font-semibold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" required />
            <button type="submit" disabled={emailLoading || !email.trim()} className="w-full py-3.5 rounded-xl border border-gray-700 bg-gray-900/70 text-white font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> {emailLoading ? 'Sending login link...' : 'Email me a login link'}
            </button>
            {emailSent && <p className="text-xs text-emerald-400 text-center">Login link sent. Check your inbox.</p>}
          </form>

          <div className="relative py-1"><div className="border-t border-gray-800" /><span className="absolute left-1/2 -translate-x-1/2 -top-2 px-3 bg-[#12131a] text-[10px] uppercase tracking-widest text-gray-600">or</span></div>

          <button type="button" onClick={handleGoogle} disabled={googleLoading} className="w-full py-3.5 rounded-xl border border-gray-700 bg-gray-900/70 text-white font-bold text-sm hover:bg-gray-800 transition-colors disabled:opacity-60">
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </button>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-800"><ShieldCheck className="w-4 h-4 text-purple-400" /><span>Secure authentication powered by 2Factor + Firebase</span></div>
          <div className="text-center pt-1"><Link href="/" className="text-xs font-semibold text-gray-500 hover:text-white transition-colors">Back to home</Link></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center text-sm">Loading...</div>}><LoginContent /></Suspense>;
}
