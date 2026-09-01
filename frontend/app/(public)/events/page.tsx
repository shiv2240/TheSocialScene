import React, { Suspense } from 'react';
import { Compass } from 'lucide-react';
import { EventsSearch } from '@/components/event/EventsSearch';
import { getPublicEvents } from '@/lib/events';
import { Navbar } from '@/components/layout/Navbar';

// Do not prerender this page during the Vercel build. The server-side Supabase
// admin JWT can be rejected by PostgREST when the build environment clock is
// behind the token's iat. Public event data remains cached for 30 seconds by
// getPublicEvents(), so this avoids build-time failure without removing caching.
export const dynamic = 'force-dynamic';
export const revalidate = 30;

function EventsSearchFallback() {
  return (
    <section className="bg-[#c93a2a] px-4 sm:px-6 lg:px-8 py-10 sm:py-14" aria-busy="true" aria-label="Loading experiences">
      <div className="max-w-7xl mx-auto">
        <div className="h-3 w-40 rounded bg-[#f7f0e3]/30 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mt-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-80 rounded-2xl bg-[#f7f0e3]/15 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function EventDiscoveryPage() {
  const { events, total } = await getPublicEvents(1, 9, 'all');

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f0e3] text-[#1e1a14] pb-24 md:pb-0">
      <Navbar />
      <main className="flex-1 w-full">
        <section className="bg-[#f7f0e3] border-b-2 border-[#1e1a14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#c93a2a] flex items-center gap-1.5">
              <Compass className="w-3 h-3" /> Live Social Calendar
            </span>
            <h1 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(52px, 12vw, 110px)', lineHeight: 0.88, color: '#1e1a14' }} className="mt-1">
              DISCOVER <span style={{ color: '#c93a2a' }}>EXPERIENCES</span>
            </h1>
            <p className="font-body text-sm text-[#1e1a14]/70 mt-3 max-w-lg leading-relaxed">
              Find sunset run clubs, rooftop acoustic gigs, mountain expeditions, and intimate social gatherings in Bengaluru &amp; beyond.
            </p>
          </div>
        </section>
        <Suspense fallback={<EventsSearchFallback />}>
          <EventsSearch initialEvents={events} initialTotal={total} />
        </Suspense>
      </main>
    </div>
  );
}
