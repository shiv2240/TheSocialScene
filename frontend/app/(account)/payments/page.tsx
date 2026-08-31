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
  SUCCESS: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  FAILED: 'bg-red-500/10 text-red-300 border-red-500/20',
  REFUNDED: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
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
    <div className="min-h-screen bg-[#121118] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Link href="/profile" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white mb-8"><ArrowLeft className="w-4 h-4" />Back to Profile</Link>
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest font-bold text-[#ffaa00]">Account</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">My Payments</h1>
          <p className="text-sm text-gray-400 mt-2">View all successful, pending, failed and refunded payments.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" />Loading payments...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300">{error}</div>
        ) : payments.length === 0 ? (
          <div className="max-w-md mx-auto rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center"><ReceiptText className="w-10 h-10 mx-auto text-gray-500 mb-4" /><h2 className="text-lg font-bold text-white">No payments yet</h2><p className="text-sm text-gray-400 mt-2">Your payment history will appear here after you register for an event.</p><Link href="/events" className="inline-flex mt-6 px-5 py-3 rounded-2xl gradient-terracotta text-xs font-extrabold text-white">Explore Events</Link></div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <article key={payment.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#c85a3c]/10 border border-[#c85a3c]/20 flex items-center justify-center flex-shrink-0"><CreditCard className="w-5 h-5 text-[#c85a3c]" /></div>
                  <div className="min-w-0"><h2 className="font-extrabold text-white truncate">{payment.event_title}</h2><p className="text-xs text-gray-500 mt-1">{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.created_at))}</p><div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-500 font-mono"><span>Order: {payment.order_id}</span>{payment.registration_number && <span>Reg: {payment.registration_number}</span>}{payment.provider_payment_id && <span>Payment: {payment.provider_payment_id}</span>}</div></div>
                </div>
                <div className="flex items-center justify-between lg:justify-end gap-5"><div className="text-right"><div className="font-black text-white">{payment.currency} {payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div><span className={`inline-flex mt-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase ${statusClasses[payment.status]}`}>{payment.status}</span></div>{payment.status === 'SUCCESS' && payment.event_slug && <Link href={`/events/${payment.event_slug}`} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5" title="View event"><ExternalLink className="w-4 h-4" /></Link>}</div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
