'use client';

import React from 'react';
import { CreditCard, Download, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PaymentsPage() {
  const payments = [
    { id: 'pay-001', orderId: 'ord-101', provider: 'RAZORPAY', amount: 599, status: 'CAPTURED', user: 'Rohan Mehta', date: 'Aug 22, 2026' },
    { id: 'pay-002', orderId: 'ord-102', provider: 'RAZORPAY', amount: 299, status: 'CAPTURED', user: 'Ananya Sharma', date: 'Aug 22, 2026' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#c85a3c]" /> Payments & Order Transactions
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Monitor Razorpay payment captures, order IDs, and process refunds.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-2xl bg-gray-900 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-[#c85a3c]" /> Export Financial Report
        </button>
      </div>

      <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10">
              <th className="p-4">Payment ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Provider</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors font-mono">
                <td className="p-4 text-[#c85a3c] font-bold">{p.id}</td>
                <td className="p-4 text-white font-sans font-bold">{p.user}</td>
                <td className="p-4 text-gray-300">{p.provider}</td>
                <td className="p-4 text-white font-extrabold">{formatCurrency(p.amount)}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-gray-400 font-sans">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
