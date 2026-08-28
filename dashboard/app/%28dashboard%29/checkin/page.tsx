'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, QrCode, Scan, XCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

type EventOption = { id: string; title: string; start_at: string };
type ScanResult = { success?: boolean; code?: string; message?: string; attendee_name?: string; attendeeName?: string; checkin?: { checked_in_at: string } | null };

export default function CheckinPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticketInput, setTicketInput] = useState('');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void fetch('/api/events/checkin', { cache: 'no-store' }).then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load events.');
      if (!active) return;
      setEvents(body.events ?? []);
      setSelectedEventId(body.events?.[0]?.id ?? '');
    }).catch(error => { if (active) setScannerError(error instanceof Error ? error.message : 'Unable to load events.'); });
    return () => { active = false; };
  }, []);

  const processScan = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || !selectedEventId || processing || lockedRef.current) return;
    lockedRef.current = true;
    setProcessing(true);
    setScannerError('');
    try {
      const response = await fetch('/api/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketCode: code, eventId: selectedEventId, deviceInfo: navigator.userAgent }) });
      const body = await response.json().catch(() => ({}));
      setLastResult(response.ok ? body : { success: false, code: body.code || 'CHECKIN_FAILED', message: body.error || body.message || 'Unable to validate ticket.' });
      setTicketInput('');
    } catch (error) {
      setLastResult({ success: false, code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Unable to reach check-in service.' });
    } finally {
      setProcessing(false);
      window.setTimeout(() => { lockedRef.current = false; }, 1500);
    }
  };

  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    const scanner = new Html5Qrcode('tss-qr-reader');
    scannerRef.current = scanner;
    void scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      decodedText => { if (!cancelled) void processScan(decodedText); },
      () => undefined,
    ).then(() => { if (!cancelled) setScannerReady(true); }).catch(error => { if (!cancelled) setScannerError(error instanceof Error ? error.message : 'Camera access is unavailable. Use manual ticket entry.'); });
    return () => {
      cancelled = true;
      setScannerReady(false);
      void scanner.stop().catch(() => undefined).finally(() => scanner.clear());
      scannerRef.current = null;
    };
  }, [selectedEventId]);

  const attendeeName = lastResult?.attendeeName || lastResult?.attendee_name;
  const successful = Boolean(lastResult?.success);

  return <div className="max-w-5xl mx-auto space-y-8 pb-12">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><QrCode className="w-6 h-6 text-purple-400" />Live Event Check-in Scanner</h1><p className="text-xs text-gray-400 mt-1">Scan the attendee QR code to validate the ticket and mark the registration present.</p></div><div className="flex items-center gap-2"><label className="text-xs text-gray-400 font-semibold whitespace-nowrap">Active Event:</label><select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-white outline-none"><option value="">Select event</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div></div>
    {scannerError && <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{scannerError}</div>}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="dashboard-card p-6 rounded-3xl border border-gray-800 space-y-6"><div className="flex items-center justify-between"><h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Scan className="w-4 h-4 text-purple-400" />Camera Scanner</h2><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${scannerReady ? 'text-emerald-400 bg-emerald-950 border-emerald-500/30' : 'text-gray-400 bg-gray-900 border-gray-700'}`}>{scannerReady ? 'Camera Ready' : 'Starting Camera'}</span></div><div className="relative min-h-72 w-full bg-gray-950 rounded-2xl border border-purple-500/30 overflow-hidden"><div id="tss-qr-reader" className="w-full" />{!scannerReady && <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"><Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" /><span className="text-xs text-gray-400">Starting camera…</span></div>}</div><form onSubmit={e => { e.preventDefault(); void processScan(ticketInput); }} className="space-y-3"><label className="text-xs font-semibold text-gray-300 uppercase block">Manual Ticket Code Fallback</label><div className="flex gap-2"><input value={ticketInput} onChange={e => setTicketInput(e.target.value)} placeholder="e.g. TSS-2026-9B4A7C2E" className="flex-1 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-white placeholder-gray-600 outline-none focus:border-purple-500" /><button type="submit" disabled={processing || !selectedEventId} className="px-5 py-3 rounded-xl gradient-bg text-xs font-bold text-white shadow-md disabled:opacity-50">{processing ? 'Checking…' : 'Validate'}</button></div></form></div>
      <div className="dashboard-card p-6 rounded-3xl border border-gray-800 space-y-6 flex flex-col justify-between"><h2 className="text-sm font-bold text-white uppercase tracking-wider">Verification Output</h2>{lastResult ? <div className={`p-6 rounded-2xl border text-center space-y-4 ${successful ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}><div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-gray-950/80">{successful ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <XCircle className="w-8 h-8 text-red-400" />}</div><div><h3 className="text-lg font-extrabold">{lastResult.message || (successful ? 'Check-in successful.' : 'Check-in failed.')}</h3>{attendeeName && <p className="text-sm font-semibold text-white mt-1">Attendee: {attendeeName}</p>}{lastResult.checkin?.checked_in_at && <span className="text-[11px] font-mono text-gray-400 block mt-2">Timestamp: {new Date(lastResult.checkin.checked_in_at).toLocaleTimeString('en-IN')}</span>}</div></div> : <div className="p-8 rounded-2xl bg-gray-900/60 border border-gray-800 text-center text-gray-500 space-y-2"><QrCode className="w-10 h-10 mx-auto text-gray-700" /><p className="text-xs">Scan a ticket QR code to display the attendee validation result.</p></div>}<div className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-400">A successful scan writes the check-in to Supabase. The registration list refreshes attendance automatically.</div></div>
    </div>
  </div>;
}
