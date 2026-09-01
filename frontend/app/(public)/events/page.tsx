import React from 'react';
import { Compass } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EventsSearch } from '@/components/event/EventsSearch';
import { getPublicEvents } from '@/lib/events';

export default async function EventDiscoveryPage() {
  const { events, total } = await getPublicEvents(1, 9, 'all');

  return (
    <div className="min-h-screen bg-[#ede4d0] text-[#1e1a14] flex flex-col pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 w-full">
        <section className="bg-[#f7f0e3] border-b-2 border-[#1e1a14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#c93a2a] flex items-center gap-1.5">
              <Compass className="w-3 h-3" /> Live Social Calendar
            </span>
            <h1
              style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(52px, 12vw, 110px)', lineHeight: 0.88, color: '#1e1a14' }}
              className="mt-1"
            >
              DISCOVER{' '}
              <span style={{ color: '#c93a2a' }}>EXPERIENCES</span>
            </h1>
            <p className="font-body text-sm text-[#1e1a14]/70 mt-3 max-w-lg leading-relaxed">
              Find sunset run clubs, rooftop acoustic gigs, mountain expeditions, and intimate social gatherings in Bengaluru &amp; beyond.
            </p>
          </div>
        </section>

        <EventsSearch initialEvents={events} initialTotal={total} />
      </main>

      <Footer />
    </div>
  );
}
