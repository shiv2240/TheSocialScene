'use client';

import React, { useState } from 'react';
import { QrCode, Scan, CheckCircle2, XCircle, AlertTriangle, Search, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';
import { TicketService } from '@backend/services/ticket.service';
import { CheckinService, CheckinResult } from '@backend/services/checkin.service';
import { EventService } from '@backend/services/event.service';
import { Checkin } from '@backend/types/database.types';

export default function CheckinPage() {
  const events = EventService.getMockEvents();
  const [selectedEventId, setSelectedEventId] = useState(events[0].id);

  const [ticketInput, setTicketInput] = useState('');
  const [lastResult, setLastResult] = useState<CheckinResult | null>(null);

  // Simulated check-in history database in state
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  const handleProcessScan = (codeToProcess: string) => {
    const code = codeToProcess.trim().toUpperCase();
    if (!code) return;

    // Validate payload
    const qrValidation = TicketService.verifyQrPayload(code);
    if (!qrValidation.isValid) {
      setLastResult({
        success: false,
        code: 'INVALID_TICKET',
        message: 'Invalid QR Code payload format. Must start with TSS-2026-',
      });
      return;
    }

    const mockTickets = TicketService.getMockTickets();
    const matchingTicket = mockTickets.find((t) => t.ticket_code === code) || {
      id: `tkt-${Date.now()}`,
      ticket_code: code,
      registration_id: 'reg-demo',
      event_id: selectedEventId,
      user_id: 'usr-demo',
      qr_payload: code,
      status: 'ACTIVE' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: { full_name: 'Ananya Sharma', phone: '+91 9876543210' } as any,
    };

    // Evaluate rules
    const result = CheckinService.processCheckinRules(
      matchingTicket as any,
      selectedEventId,
      checkins,
      'staff-op-01',
      'Browser Camera QR Scanner'
    );

    if (result.success && result.checkin) {
      setCheckins((prev) => [result.checkin!, ...prev]);
    }

    setLastResult(result);
    setTicketInput('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-purple-400" />
            Live Event Check-in Scanner
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Scan attendee QR code passes or manually input ticket identifiers for entry validation.
          </p>
        </div>

        {/* Target Event Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 font-semibold whitespace-nowrap">Active Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-white outline-none"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Panel */}
        <div className="dashboard-card p-6 rounded-3xl border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scan className="w-4 h-4 text-purple-400" />
              Camera Viewport & Input
            </h2>
            <span className="text-[10px] font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/30">
              Camera Ready
            </span>
          </div>

          {/* Scanner Viewport Simulation */}
          <div className="relative h-60 w-full bg-gray-950 rounded-2xl border-2 border-dashed border-purple-500/40 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
            <div className="w-36 h-36 rounded-xl border-2 border-purple-400 relative flex items-center justify-center">
              <div className="w-full h-0.5 bg-pink-500 absolute animate-pulse shadow-lg shadow-pink-500" />
              <QrCode className="w-16 h-16 text-purple-400/40" />
            </div>
            <span className="text-xs text-gray-400 mt-3 font-mono">
              Align attendee QR Code inside viewport
            </span>
          </div>

          {/* Manual Ticket Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessScan(ticketInput);
            }}
            className="space-y-3"
          >
            <label className="text-xs font-semibold text-gray-300 uppercase block">
              Manual Ticket Code Fallback
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="e.g. TSS-2026-9B4A7C2E"
                className="flex-1 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-white placeholder-gray-600 outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl gradient-bg text-xs font-bold text-white shadow-md hover:opacity-90"
              >
                Validate
              </button>
            </div>
          </form>

          {/* Quick Demo Scan Shortcuts */}
          <div className="pt-2">
            <span className="text-[11px] text-gray-500 block mb-2 font-semibold">Test Demo QR Inputs:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleProcessScan('TSS-2026-9B4A7C2E')}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-purple-300 hover:border-purple-500"
              >
                TSS-2026-9B4A7C2E (Valid)
              </button>
              <button
                onClick={() => handleProcessScan('INVALID-CODE')}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-red-400 hover:border-red-500"
              >
                INVALID-CODE
              </button>
            </div>
          </div>
        </div>

        {/* Scan Result Feedback Card */}
        <div className="dashboard-card p-6 rounded-3xl border border-gray-800 space-y-6 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Verification Output
          </h2>

          {lastResult ? (
            <div
              className={`p-6 rounded-2xl border text-center space-y-4 ${
                lastResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-gray-950/80">
                {lastResult.success ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-extrabold">{lastResult.message}</h3>
                {lastResult.attendeeName && (
                  <p className="text-sm font-semibold text-white mt-1">
                    Attendee: {lastResult.attendeeName}
                  </p>
                )}
                {lastResult.checkin && (
                  <span className="text-[11px] font-mono text-gray-400 block mt-2">
                    Timestamp: {new Date(lastResult.checkin.checked_in_at).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-800 text-center text-gray-500 space-y-2">
              <QrCode className="w-10 h-10 mx-auto text-gray-700" />
              <p className="text-xs">Scan a ticket QR code to display real-time attendee status.</p>
            </div>
          )}

          {/* Stats Bar */}
          <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span>Checked In This Session:</span>
            <span className="font-bold text-white font-mono">{checkins.length} Attendees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
