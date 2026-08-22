'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function EmailLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/profile';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;

      sessionStorage.setItem('tss_otp_email', normalizedEmail);
      sessionStorage.setItem('tss_auth_next', next);
      router.push(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-extrabold text-white">Sign In to Continue</h1>
          <p className="text-xs text-gray-400">Enter your email to receive a 6-digit verification code.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm font-semibold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
              required
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100">
            {loading ? <span className="animate-pulse">Sending OTP...</span> : <><span>Get OTP Code</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-800"><ShieldCheck className="w-4 h-4 text-purple-400" /><span>Secure email authentication</span></div>
      </div>
    </div>
  );
}

export default function EmailLoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center text-sm">Loading...</div>}><EmailLoginContent /></Suspense>;
}
