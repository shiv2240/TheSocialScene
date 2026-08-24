'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { applyActionCode } from 'firebase/auth';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      const oobCode = params.get('oobCode');

      if (mode !== 'verifyEmail' || !oobCode) {
        setStatus('error');
        setMessage('This verification link is missing or invalid. Please request a new verification email from your profile.');
        return;
      }

      try {
        const auth = getFirebaseAuth();
        await applyActionCode(auth, oobCode);

        if (auth.currentUser) {
          await auth.currentUser.reload();
          const idToken = await auth.currentUser.getIdToken(true);
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken }),
          });
        }

        setStatus('success');
        setMessage('Your email has been verified successfully.');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'This verification link is invalid or has expired.');
      }
    };

    void verify();
  }, []);

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-gray-800 shadow-2xl text-center space-y-5">
          {status === 'loading' && <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />}
          {status === 'success' && <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />}
          {status === 'error' && <XCircle className="w-12 h-12 text-red-400 mx-auto" />}
          <h1 className="text-2xl font-extrabold text-white">{status === 'loading' ? 'Verifying email' : status === 'success' ? 'Email verified' : 'Verification failed'}</h1>
          <p className="text-sm text-gray-400">{message}</p>
          {status !== 'loading' && <Link href="/profile" className="inline-flex px-5 py-3 rounded-xl gradient-bg text-white text-sm font-bold">Return to profile</Link>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
