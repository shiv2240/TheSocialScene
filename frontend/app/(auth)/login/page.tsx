'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function PhoneLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/profile';
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const normalizedPhone = `+91${phone}`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      sessionStorage.setItem('tss_otp_phone', normalizedPhone);
      sessionStorage.setItem('tss_auth_next', next);
      router.push(`/verify-otp?phone=${encodeURIComponent(normalizedPhone)}`);
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
          <p className="text-xs text-gray-400">Enter your phone number to receive a 6-digit verification code.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Mobile Number</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-bold text-gray-400"><span>+91</span><span className="w-px h-4 bg-gray-700 mx-1" /></div>
              <input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className="w-full pl-16 pr-4 py-3.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm font-semibold text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 tracking-wider" required />
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100">
            {loading ? <span className="animate-pulse">Sending OTP...</span> : <><span>Get OTP Code</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-800"><ShieldCheck className="w-4 h-4 text-purple-400" /><span>Secure SMS Phone Authentication</span></div>
      </div>
    </div>
  );
}

export default function PhoneLoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#090a0f] text-white flex items-center justify-center text-sm">Loading...</div>}><PhoneLoginContent /></Suspense>;
}
