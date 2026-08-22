'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '9876543210';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }
    setError('');
    setLoading(true);

    // Simulate OTP verification via Supabase Auth
    setTimeout(() => {
      setLoading(false);
      router.push('/tickets');
    }, 1200);
  };

  return (
    <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-gray-800 shadow-2xl relative z-10 space-y-6">
      <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Phone Number
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-white">Enter Verification Code</h1>
        <p className="text-xs text-gray-400">
          We sent a 6-digit SMS code to <span className="font-bold text-purple-300">+91 {phone}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div className="space-y-2">
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full text-center tracking-[0.5em] text-2xl font-bold py-4 rounded-xl bg-gray-900/90 border border-gray-700 text-white placeholder-gray-700 focus:outline-none focus:border-purple-500"
            required
          />
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl gradient-bg text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="animate-pulse">Verifying Code...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-800">
        <span>Didn't receive SMS?</span>
        {cooldown > 0 ? (
          <span className="text-gray-500 font-medium">Resend in {cooldown}s</span>
        ) : (
          <button
            onClick={() => setCooldown(30)}
            className="text-purple-400 font-semibold hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="gradient-glow top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <Suspense fallback={<div className="text-white text-xs">Loading OTP page...</div>}>
        <VerifyOtpContent />
      </Suspense>
    </div>
  );
}
