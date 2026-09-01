'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, ExternalLink, Loader2, ReceiptText } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type Payment = {
  id: string;
  order_id: string;
  registration_id: string | null;
  registration_number: string | null;
  event_id: string | null;
  event_title: string;
  event_slug: string | null;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  provider_payment_id: string | null;
  created_at: string;
};

const statusClasses: Record<Payment['status'], string> = {
  SUCCESS: 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40',
  PENDING: 'bg-amber-950/60 text-amber-400 border-amber-500/40',
  FAILED: 'bg-red-950/60 text-red-400 border-red-500/40',
  REFUNDED: 'bg-sky-950/60 text-sky-400 border-sky-500/40',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/payments', { cache: 'no-store' });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to load payments.');
        setPayments(body.payments ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load payments.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 font-sans-clean font-extrabold text-xs text-[#f4ebd9] hover:text-[#cb4b31] mb-6 uppercase tracking-wider bg-[#16151c] px-4 py-2 rounded-full border border-white/20 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#cb4b31]" /> Back to Profile
        </Link>

        <div className="mb-8">
          <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
            ● BILLING RECORDS
          </span>
          <h1 className="font-puffy text-4xl sm:text-6xl text-white uppercase mt-2">
            MY <span className="text-[#cb4b31]">PAYMENTS</span>
          </h1>
          <p className="font-sans-clean text-xs sm:text-sm text-[#f4ebd9]/70 mt-1 font-semibold">
            History of registrations, orders, and payment transactions.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#f4ebd9]/60 font-sans-clean text-xs font-bold">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#cb4b31]" /> Loading payment receipts...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500 bg-red-950/40 p-6 text-xs text-red-400 font-sans-clean font-bold">
            {error}
          </div>
        ) : payments.length === 0 ? (
          <div className="max-w-md mx-auto rounded-3xl border border-white/20 bg-[#16151c] p-8 sm:p-12 text-center shadow-2xl">
            <ReceiptText className="w-12 h-12 mx-auto text-[#cb4b31] mb-4" />
            <h2 className="font-puffy text-2xl text-white uppercase">No payment receipts yet</h2>
            <p className="font-sans-clean text-xs text-[#f4ebd9]/70 mt-2 font-semibold">
              Your payment receipts will appear here after registering for experiences.
            </p>
            <Link
              href="/events"
              className="inline-flex mt-6 px-7 py-3.5 rounded-full bg-[#cb4b31] font-sans-clean font-extrabold text-xs tracking-wider text-white uppercase shadow-md border border-white/20"
            >
              [ Explore Gatherings ↗ ]
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <article
                key={payment.id}
                className="bg-[#16151c] rounded-3xl border border-white/15 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 shadow-xl hover:border-[#cb4b31] transition-all"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-[#cb4b31]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-puffy text-xl text-white truncate">
                      {payment.event_title}
                    </h2>
                    <p className="font-sans-clean text-xs text-[#f4ebd9]/60 mt-0.5 font-bold">
                      {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.created_at))}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[#f4ebd9]/60 font-mono">
                      <span>Order: {payment.order_id}</span>
                      {payment.registration_number && <span>Reg: {payment.registration_number}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-5">
                  <div className="text-right">
                    <div className="font-puffy text-2xl text-white">
                      {payment.currency} {payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className={`inline-flex mt-1 px-3 py-0.5 rounded-full border font-sans-clean text-[10px] font-bold uppercase tracking-wider ${statusClasses[payment.status]}`}>
                      ● {payment.status}
                    </span>
                  </div>

                  {payment.status === 'SUCCESS' && payment.event_slug && (
                    <Link
                      href={`/events/${payment.event_slug}`}
                      className="p-2.5 rounded-2xl border border-white/20 text-[#f4ebd9] hover:bg-[#cb4b31] hover:text-white transition-colors"
                      title="View Event"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
