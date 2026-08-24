'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { CheckCircle2, Camera, Keyboard, Loader2, QrCode, ScanLine, ShieldCheck, XCircle } from 'lucide-react';

interface Html5QrcodeLike { start: (camera: unknown, config: unknown, success: (text: string) => void, failure?: (error: string) => void) => Promise<void>; stop: () => Promise<void>; clear: () => void }
declare global { interface Window { Html5Qrcode?: new (elementId: string) => Html5QrcodeLike } }

export default function ScannerPage() {
  const [eventId, setEventId] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  const [ticketCode, setTicketCode] = useState('');
  const [result, setResult] = useState<{ success: boolean; code?: string; message?: string; attendee_name?: string; checked_in_at?: string } | null>(null);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeLike | null>(null);
  const lastScanRef = useRef('');

  useEffect(() => {
    fetch('/api/events/checkin')
      .then((r) => r.ok ? r.json() : { events: [] })
      .then((body) => { setEvents(body.events || []); if (body.events?.[0]) setEventId(body.events[0].id); })
      .catch(() => setEvents([]));
  }, []);

  const processScan = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code || !eventId || loading || lastScanRef.current === code) return;
    lastScanRef.current = code;
    setLoading(true);
    setTicketCode(code);
    setResult(null);
    try {
      const response = await fetch('/api/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketCode: code, eventId, deviceInfo: 'Browser Camera QR Scanner' }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Check-in failed.');
      setResult(body);
      if (body.success && scannerRef.current) await scannerRef.current.stop().catch(() => undefined);
      if (body.success) setCameraRunning(false);
    } catch (error) {
      setResult({ success: false, code: 'ERROR', message: error instanceof Error ? error.message : 'Check-in failed.' });
    } finally {
      setLoading(false);
      setTimeout(() => { lastScanRef.current = ''; }, 1500);
    }
  };

  const startCamera = async () => {
    if (!window.Html5Qrcode || !eventId) return;
    const scanner = new window.Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 260 } }, (decodedText) => processScan(decodedText));
      setCameraRunning(true);
      setResult(null);
    } catch (error) {
      setResult({ success: false, code: 'CAMERA_ERROR', message: error instanceof Error ? error.message : 'Unable to access camera.' });
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) await scannerRef.current.stop().catch(() => undefined);
    setCameraRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      <Script src="https://unpkg.com/html5-qrcode" strategy="afterInteractive" />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider"><ShieldCheck className="w-4 h-4" /> Secure entry verification</div><h1 className="text-3xl font-black text-white mt-2">QR Attendance Scanner</h1><p className="text-xs text-gray-400 mt-1">Scan a digital ticket, validate it against the selected event, and record a one-time check-in.</p></div><select value={eventId} onChange={(e) => setEventId(e.target.value)} className="px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-white outline-none min-w-64"><option value="">Select event</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div>

      <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
        <div className="rounded-3xl border border-gray-800 bg-gray-950 p-6 space-y-5"><div className="flex items-center justify-between"><h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2"><Camera className="w-4 h-4 text-purple-400" /> Live camera</h2><span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${cameraRunning ? 'text-emerald-300 border-emerald-500/30 bg-emerald-950' : 'text-gray-400 border-gray-700 bg-gray-900'}`}>{cameraRunning ? 'SCANNING' : 'READY'}</span></div><div id="qr-reader" className="w-full min-h-[360px] rounded-2xl overflow-hidden bg-black border border-gray-800" /><div className="flex gap-3"><button onClick={cameraRunning ? stopCamera : startCamera} disabled={!eventId} className="flex-1 py-3 rounded-xl bg-white text-gray-950 text-xs font-black disabled:opacity-40">{cameraRunning ? 'Stop camera' : 'Start camera'}</button></div><p className="text-[11px] text-gray-500">Camera access requires HTTPS and browser permission. The scanner supports mobile and desktop camera workflows.</p></div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6 space-y-5"><h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2"><Keyboard className="w-4 h-4 text-purple-400" /> Manual fallback</h2><input value={ticketCode} onChange={(e) => setTicketCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') processScan(ticketCode); }} placeholder="TSS-2026-XXXXXXXX" className="w-full px-4 py-3 rounded-xl bg-gray-950 border border-gray-800 text-xs font-mono text-white placeholder-gray-600 outline-none focus:border-purple-500" /><button onClick={() => processScan(ticketCode)} disabled={loading || !eventId || !ticketCode} className="w-full py-3 rounded-xl gradient-bg text-xs font-black text-white disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />} Validate ticket</button>

          <div className="min-h-56 rounded-2xl border border-gray-800 bg-gray-950 p-6 flex flex-col items-center justify-center text-center">{result ? <>{result.success ? <CheckCircle2 className="w-14 h-14 text-emerald-400" /> : <XCircle className="w-14 h-14 text-red-400" />}<h3 className={`mt-4 text-lg font-black ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>{result.message}</h3>{result.attendee_name && <p className="mt-1 text-sm font-bold text-white">{result.attendee_name}</p>}{result.checked_in_at && <p className="mt-2 text-[11px] font-mono text-gray-500">{new Date(result.checked_in_at).toLocaleTimeString()}</p>}</> : <><QrCode className="w-12 h-12 text-gray-700" /><p className="text-xs text-gray-500 mt-3">Scan a ticket to see verification status.</p></>}</div>
        </div>
      </div>
    </div>
  );
}
