'use client';

import React from 'react';
import { FileText, Shield, User, Clock, CheckCircle } from 'lucide-react';
import { AuditService } from '@backend/services/audit.service';

export default function AuditLogsPage() {
  const mockAuditLogs = [
    AuditService.logActivity('EVENT_PUBLISHED', 'EVENT', 'evt-001', 'usr-super-admin', { slug: 'sunday-sunset-run' }),
    AuditService.logActivity('CHECKIN_CREATED', 'TICKET', 'tkt-001', 'usr-staff-01', { ticket_code: 'TSS-2026-9B4A7C2E' }),
    AuditService.logActivity('EVENT_CREATED', 'EVENT', 'evt-002', 'usr-host-01', { title: 'Indie Music Night' }),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-400" />
          System Activity Audit Logs
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Immutable trail of administrative operations, publishing decisions, role changes, and check-in scans.
        </p>
      </div>

      <div className="dashboard-card rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-800">
                <th className="p-4">Action Key</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs">
              {mockAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900/40 transition-colors font-mono">
                  <td className="p-4 text-purple-300 font-bold">{log.action}</td>
                  <td className="p-4 text-gray-300">{log.entity_type}</td>
                  <td className="p-4 text-gray-400">{log.entity_id}</td>
                  <td className="p-4 text-white font-bold">{log.actor_user_id}</td>
                  <td className="p-4 text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
