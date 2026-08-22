'use client';

import React from 'react';
import { UserCheck, Search, Download, Filter, Ticket, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RegistrationsPage() {
  const mockRegistrations = [
    {
      id: 'reg-001',
      number: 'REG-2026-9B4A7C2E',
      eventTitle: 'Sunday Sunset Run & Social',
      attendeeName: 'Ananya Sharma',
      phone: '+91 9876543210',
      email: 'ananya@example.com',
      ticketType: 'General Pass',
      amount: 299,
      status: 'CONFIRMED',
      created_at: new Date().toISOString(),
    },
    {
      id: 'reg-002',
      number: 'REG-2026-8F1A9D22',
      eventTitle: 'Indie Music & Acoustic Rooftop Night',
      attendeeName: 'Rohan Mehta',
      phone: '+91 9812345678',
      email: 'rohan@example.com',
      ticketType: 'VIP Pass',
      amount: 599,
      status: 'CONFIRMED',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Attendee Registrations</h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage confirmed tickets, attendee contact info, and registration statuses.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-2">
          <Download className="w-4 h-4 text-purple-400" />
          Export CSV List
        </button>
      </div>

      <div className="dashboard-card rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-800">
                <th className="p-4">Registration #</th>
                <th className="p-4">Attendee Info</th>
                <th className="p-4">Event</th>
                <th className="p-4">Ticket Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs">
              {mockRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="p-4 font-mono text-purple-300 font-bold">{reg.number}</td>
                  <td className="p-4">
                    <span className="font-bold text-white block">{reg.attendeeName}</span>
                    <span className="text-[10px] text-gray-400 block">{reg.phone}</span>
                  </td>
                  <td className="p-4 text-gray-300 font-medium">{reg.eventTitle}</td>
                  <td className="p-4 text-gray-300">{reg.ticketType}</td>
                  <td className="p-4 font-bold text-white">{formatCurrency(reg.amount)}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {reg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
