'use client';

import React from 'react';
import { Users, PlusCircle, Search, CheckCircle2, Shield } from 'lucide-react';

export default function HostsPage() {
  const hosts = [
    { id: 'h-1', name: 'Bengaluru Runners Club', email: 'runners@social.club', eventsCount: 14, status: 'ACTIVE' },
    { id: 'h-2', name: 'Acoustic Underground', email: 'acoustic@social.club', eventsCount: 9, status: 'ACTIVE' },
    { id: 'h-3', name: 'Tech Collective India', email: 'tech@social.club', eventsCount: 19, status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#c85a3c]" /> Event Hosts & Organizers
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage verified event host profiles and organizer permissions.
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add New Host Profile
        </button>
      </div>

      <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10">
              <th className="p-4">Host Name</th>
              <th className="p-4">Contact Email</th>
              <th className="p-4">Events Hosted</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {hosts.map((h) => (
              <tr key={h.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white flex items-center gap-2">
                  {h.name} <CheckCircle2 className="w-4 h-4 text-[#c85a3c]" />
                </td>
                <td className="p-4 text-gray-300">{h.email}</td>
                <td className="p-4 font-bold text-white">{h.eventsCount} Events</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {h.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
