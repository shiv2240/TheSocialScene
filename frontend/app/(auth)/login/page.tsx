'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthProvider, isSignInWithEmailLink, sendSignInLinkToEmail, signInWithEmailLink, signInWithPopup } from 'firebase/auth';
import { Mail, ShieldCheck, Sparkles } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const establishSession = async () => {
    const auth = getFirebaseAuth();
    const idToken = await auth.currentUser?.getIdToken(true);
    if (!idToken) throw new Error('Unable to establish authentication.');
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to establish your session.');
  };

  const continueAfterAuth = async () => {
    const response = await fetch('/api/profile', { cache: 'no-store', credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Unable to load your profile.');
    const destination = body.profile?.onboarding_completed ? next : `/onboarding?next=${encodeURIComponent(next)}`;
    router.replace(destination);
    router.refresh();
  };

  useEffect(() => {
    const completeEmailLinkLogin = async () => {
      const auth = getFirebaseAuth();
      if (!isSignInWithEmailLink(auth, window.location.href)) return;
      setEmailLoading(true);
      setError('');
      try {
        const storedEmail =
          window.localStorage.getItem('tss_email_for_signin') ||
          window.prompt('Enter the email address you used to request the login link:') ||
          '';
        if (!storedEmail) throw new Error('Email address is required to complete sign-in.');
        await signInWithEmailLink(auth, storedEmail.trim(), window.location.href);
        window.localStorage.removeItem('tss_email_for_signin');
        await establishSession();
        await continueAfterAuth();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'This email login link is invalid or expired.');
      } finally {
        setEmailLoading(false);
      }
    };
    void completeEmailLinkLogin();
  }, [next, router]);

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
        handleCodeInApp: true
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
      await signInWithPopup(getFirebaseAuth(), provider);
      await establishSession();
      await continueAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 md:pb-0">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-md bg-[#16151c] p-8 sm:p-10 rounded-3xl border border-white/20 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 mx-auto p-0.5 bg-[#cb4b31] shadow-sm">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
            <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest block">● STEP INTO THE SCENE</span>
            <h1 className="font-puffy text-3xl sm:text-4xl text-white uppercase">JOIN THE SCENE</h1>
            <p className="font-sans-clean text-xs text-[#f4ebd9]/70 font-semibold">Log in with passwordless email or Google.</p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <label htmlFor="email" className="font-sans-clean text-[11px] font-extrabold text-[#f4ebd9] block uppercase tracking-wider">Email Address</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-xs font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-[#cb4b31] focus:bg-[#16151c] font-sans-clean transition-colors" required />
            <button type="submit" disabled={emailLoading || googleLoading || !email.trim()} className="w-full py-3.5 rounded-full bg-[#cb4b31] hover:bg-[#e05338] text-white font-sans-clean font-extrabold text-xs tracking-wider uppercase shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 border border-white/20">
              <Mail className="w-4 h-4" />{emailLoading ? 'Sending link...' : '[ Email Login Link ]'}
            </button>
            {emailSent && <p className="text-xs text-emerald-400 text-center font-sans-clean font-bold">Login link sent to your inbox.</p>}
          </form>

          <div className="relative py-1"><div className="border-t border-white/10" /><span className="absolute left-1/2 -translate-x-1/2 -top-2 px-3 bg-[#16151c] text-[10px] font-sans-clean font-extrabold text-[#f4ebd9]/40 uppercase tracking-wider">or</span></div>

          <button type="button" onClick={handleGoogle} disabled={emailLoading || googleLoading} className="w-full py-3 rounded-full border border-white/20 bg-white/5 text-white font-sans-clean font-extrabold text-xs tracking-wider uppercase hover:bg-white/15 transition-colors disabled:opacity-60">
            {googleLoading ? 'Connecting to Google...' : '[ Continue with Google ]'}
          </button>

          {error && <p className="text-xs text-red-400 text-center font-sans-clean font-bold">{error}</p>}
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#f4ebd9]/60 pt-3 border-t border-white/10 font-sans-clean font-semibold"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span>Secure Email + Google Authentication powered by Firebase</span></div>
          <div className="text-center pt-1"><Link href="/" className="text-xs font-semibold text-[#f4ebd9]/50 hover:text-white transition-colors">Back to home</Link></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex items-center justify-center text-xs">Loading...</div>}><LoginContent /></Suspense>;
}
