import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#ede4d0] flex items-center justify-center px-5 py-16 text-[#1e1a14]">
      <section className="w-full max-w-lg rounded-3xl border-2 border-[#1e1a14] bg-[#f7f0e3] p-7 sm:p-10 text-center shadow-[7px_8px_0px_#1e1a14]">
        <div className="font-display text-8xl sm:text-9xl leading-none text-[#c93a2a]">404</div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mt-2">Experience not found</p>
        <h1 className="font-display text-4xl sm:text-5xl uppercase mt-1 leading-none">WRONG TURN</h1>
        <p className="font-body text-sm text-[#1e1a14]/65 mt-3 leading-relaxed">That page or experience doesn't exist anymore, or the link may be outdated.</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c93a2a] text-[#f7f0e3] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest border-2 border-[#c93a2a]">
            <Compass className="w-3.5 h-3.5" /> Explore Experiences
          </Link>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1e1a14] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-[#1e1a14] hover:text-[#f7f0e3] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </section>
    </main>
  );
}
