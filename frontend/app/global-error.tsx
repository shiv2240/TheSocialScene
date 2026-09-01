'use client';

import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="bg-[#ede4d0] text-[#1e1a14]">
        <main className="min-h-screen flex items-center justify-center px-5 py-16">
          <section className="w-full max-w-lg rounded-3xl border-2 border-[#1e1a14] bg-[#f7f0e3] p-7 sm:p-10 text-center shadow-[7px_8px_0px_#1e1a14]">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[#c93a2a] text-[#f7f0e3] flex items-center justify-center border-2 border-[#1e1a14]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#c93a2a] mt-5">Critical error</p>
            <h1 className="font-display text-5xl sm:text-6xl uppercase mt-1 leading-none">SCENE OFFLINE</h1>
            <p className="font-body text-sm text-[#1e1a14]/65 mt-3 leading-relaxed">The application hit an unexpected error. Reload the experience to continue.</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => reset()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c93a2a] text-[#f7f0e3] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest">
                <RefreshCw className="w-3.5 h-3.5" /> Reload
              </button>
              <a href="/" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1e1a14] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest">
                <Home className="w-3.5 h-3.5" /> Home
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
