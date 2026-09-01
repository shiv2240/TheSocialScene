'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, MapPin, ShieldCheck, Ticket, Phone, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface CheckoutProps {
  event: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    cover_image?: string | null;
    start_at: string;
    venue?: { name?: string; address?: string; city?: string } | null;
  };
  existingPhone?: string | null;
  phoneVerified?: boolean;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutClient({ event, existingPhone, phoneVerified }: CheckoutProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(existingPhone?.replace(/^\+91/, '') || '');
  const [verified, setVerified] = useState(Boolean(phoneVerified));
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const normalizedPhone = phone.replace(/\D/g, '').slice(0, 10);
  const validPhone = /^[6-9]\d{9}$/.test(normalizedPhone);
  const phoneLocked = Boolean(existingPhone && phoneVerified);

  const finish = (ticketCode?: string) => {
    setSuccess(true);
    setTimeout(() => router.push(ticketCode ? `/ticket/${encodeURIComponent(ticketCode)}` : '/tickets'), 700);
  };

  const sendPhoneOtp = async () => {
    setError('');
    setOtpLoading(true);
    try {
      const r = await fetch('/api/profile/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || 'Unable to send OTP.');
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyPhone = async () => {
    setError('');
    setOtpLoading(true);
    try {
      const r = await fetch('/api/profile/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || 'Invalid OTP.');
      setVerified(true);
      setOtpSent(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to verify phone number.');
    } finally {
      setOtpLoading(false);
    }
  };

  const startCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      if (!validPhone || !verified) throw new Error('Please verify your mobile number with OTP before booking.');
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: event.slug, phone: normalizedPhone }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to start registration.');
      if (body.alreadyRegistered) {
        finish(body.ticketCode);
        return;
      }
      if (body.free) {
        finish(body.ticketCode);
        return;
      }
      if (!window.Razorpay) throw new Error('Razorpay Checkout is still loading. Please try again.');
      const razorpay = new window.Razorpay({
        key: body.keyId,
        amount: body.amount,
        currency: body.currency,
        name: 'The Social Scene',
        description: event.title,
        order_id: body.orderId,
        timeout: body.timeoutSeconds || 600,
        handler: async (paymentResponse: Record<string, string>) => {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registrationId: body.registrationId,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              }),
            });
            const verifyBody = await verifyResponse.json();
            if (!verifyBody.ok) throw new Error(verifyBody.error || 'Payment verification failed.');
            finish(verifyBody.ticketCode);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Payment verification failed.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment window closed or expired. If your bank shows a debit, please do not retry until the payment status is verified.');
          },
        },
        theme: { color: '#cb4b31' },
        retry: { enabled: true },
        prefill: body.prefill,
      });
      razorpay.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to start payment.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 font-sans-clean font-extrabold text-xs text-[#f4ebd9] hover:text-[#cb4b31] mb-6 uppercase tracking-wider bg-[#16151c] px-4 py-2 rounded-full border border-white/20 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#cb4b31]" /> Back to Event
        </Link>

        <div className="grid md:grid-cols-[1.1fr_.9fr] gap-6">
          <section className="rounded-3xl overflow-hidden border border-white/15 bg-[#16151c] shadow-xl">
            {event.cover_image && (
              <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-[#1f1d26]">
                <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d12]/90 via-transparent to-transparent" />
              </div>
            )}
            <div className="p-6 sm:p-7 space-y-4">
              <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
                ● EXPERIENCE PASS
              </span>
              <h1 className="font-puffy text-2xl sm:text-3xl text-white leading-tight">
                {event.title}
              </h1>
              <div className="space-y-2.5 font-sans-clean text-xs sm:text-sm text-[#f4ebd9]/80 pt-2 border-t border-white/10 font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#cb4b31] shrink-0" />
                  <span suppressHydrationWarning>
                    {formatDate(event.start_at)} • {formatTime(event.start_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#e5a83b] shrink-0" />
                  <span>
                    {event.venue?.name}
                    {event.venue?.city ? `, ${event.venue.city}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/20 bg-[#16151c] p-6 sm:p-7 shadow-2xl h-fit space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <span className="font-sans-clean text-xs font-extrabold text-[#f4ebd9]/60 uppercase tracking-wider">Pass Investment</span>
              <span className="font-puffy text-3xl text-white" suppressHydrationWarning>
                {formatCurrency(event.price, event.currency)}
              </span>
            </div>

            <div className="space-y-3">
              <label htmlFor="booking-phone" className="font-sans-clean text-[11px] font-extrabold text-[#f4ebd9] block uppercase tracking-wider">
                Booking Mobile Number
              </label>
              <div className="flex gap-2">
                <span className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-xs font-bold text-white font-sans-clean">
                  +91
                </span>
                <input
                  id="booking-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setVerified(false);
                    setOtpSent(false);
                  }}
                  disabled={phoneLocked || otpSent}
                  placeholder="9876543210"
                  className="min-w-0 flex-1 px-4 py-2.5 rounded-2xl border border-white/15 bg-white/5 text-xs font-semibold text-white outline-none focus:border-[#cb4b31] focus:bg-[#16151c] disabled:opacity-70 font-sans-clean"
                />
              </div>

              {verified ? (
                <p className="font-sans-clean text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mobile number verified with 2Factor.
                </p>
              ) : !otpSent ? (
                <button
                  type="button"
                  onClick={sendPhoneOtp}
                  disabled={!validPhone || otpLoading}
                  className="w-full py-3 rounded-full border border-white/20 text-xs font-extrabold font-sans-clean tracking-wider uppercase hover:bg-white hover:text-[#0e0d12] text-white disabled:opacity-50 transition-colors"
                >
                  {otpLoading ? 'Sending OTP...' : '[ Verify Mobile with OTP ]'}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full px-4 py-2.5 rounded-2xl border border-white/15 bg-white/5 text-xs font-semibold text-white outline-none focus:border-[#cb4b31] focus:bg-[#16151c] font-sans-clean"
                  />
                  <button
                    type="button"
                    onClick={verifyPhone}
                    disabled={otp.length !== 6 || otpLoading}
                    className="w-full py-2.5 rounded-full bg-[#cb4b31] text-white font-sans-clean text-xs font-bold tracking-wider uppercase disabled:opacity-50 border border-white/20"
                  >
                    {otpLoading ? 'Verifying...' : '[ Verify & Continue ]'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2.5 font-sans-clean text-xs text-[#f4ebd9]/80 font-semibold">
              <div className="flex gap-2 items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure payment via Razorpay
              </div>
              <div className="flex gap-2 items-center">
                <Ticket className="w-4 h-4 text-[#cb4b31]" /> Instant digital QR entry ticket pass
              </div>
            </div>

            {success ? (
              <div className="rounded-2xl bg-emerald-950/50 border border-emerald-500 p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                <p className="font-puffy text-xl text-white">Registration Confirmed</p>
                <p className="font-sans-clean text-xs text-[#f4ebd9]/70 mt-0.5 font-semibold">Opening your pass...</p>
              </div>
            ) : (
              <button
                onClick={startCheckout}
                disabled={loading || !validPhone || !verified}
                className="w-full py-4 rounded-full bg-[#cb4b31] hover:bg-[#e05338] text-white font-sans-clean text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 border border-white/20"
              >
                <CreditCard className="w-4 h-4" />
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : event.price === 0 ? (
                  '[ Confirm Free Registration ]'
                ) : (
                  `[ Pay ${formatCurrency(event.price, event.currency)} ]`
                )}
              </button>
            )}

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-500 rounded-2xl p-3 font-sans-clean font-bold">
                {error}
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
