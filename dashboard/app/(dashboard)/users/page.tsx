'use client';

import React from 'react';
import { Users, PlusCircle, ShieldCheck } from 'lucide-react';

export default function UsersPage() {
  const users = [
    { id: 'u-1', name: 'Super Admin', email: 'admin@thesocialscene.club', role: 'SUPER_ADMIN', status: 'ACTIVE' },
    { id: 'u-2', name: 'Check-in Staff Indiranagar', email: 'staff@thesocialscene.club', role: 'CHECKIN_STAFF', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#c85a3c]" /> User & RBAC Access Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Assign system roles and manage administrative access privileges.
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add User Account
        </button>
      </div>

      <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10">
              <th className="p-4">User Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">System Role</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{u.name}</td>
                <td className="p-4 text-gray-300">{u.email}</td>
                <td className="p-4 font-mono font-bold text-[#c85a3c]">{u.role}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {u.status}
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
