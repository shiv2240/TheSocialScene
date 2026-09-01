import React from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Sparkles, ArrowRight, Info, QrCode, Ticket, Users, Mountain, Music
} from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function PublicHomePage() {
  const supabase = await createClient();
  const { data: featuredEvents } = await supabase
    .from('events')
    .select('*, category:event_categories(id,name,slug,display_order), venue:venues(id,name,slug,address,city,capacity)')
    .eq('status', 'PUBLISHED')
    .eq('featured', true)
    .order('start_at', { ascending: true })
    .limit(6);

  let displayEvents = featuredEvents;
  if (!displayEvents?.length) {
    const { data: fallback } = await supabase
      .from('events')
      .select('*, category:event_categories(id,name,slug,display_order), venue:venues(id,name,slug,address,city,capacity)')
      .eq('status', 'PUBLISHED')
      .order('start_at', { ascending: true })
      .limit(6);
    displayEvents = fallback;
  }

  return (
    <div className="min-h-screen bg-[#ede4d0] text-[#1e1a14] pb-24 md:pb-0">
      <Navbar />

      {/* ─── Ticker ───────────────────────────── */}
      <div className="bg-[#c93a2a] text-[#f7f0e3] py-2.5 overflow-hidden border-y-2 border-[#1e1a14]">
        <div className="marquee-track items-center gap-12 font-mono text-[10px] font-bold uppercase tracking-widest">
          <span>★ Since 2026</span><span>·</span>
          <span>COME SOLO</span><span>·</span>
          <span>LEAVE WITH STORIES</span><span>·</span>
          <span>SUNSET RUN CLUBS</span><span>·</span>
          <span>MOUNTAIN TREKS</span><span>·</span>
          <span>ACOUSTIC ROOFTOP GIGS</span><span>·</span>
          <span>BENGALURU</span><span>·</span>
          <span>★ LIMITED SPOTS</span><span>·</span>
          {/* duplicate for seamless loop */}
          <span>★ Since 2026</span><span>·</span>
          <span>COME SOLO</span><span>·</span>
          <span>LEAVE WITH STORIES</span><span>·</span>
          <span>SUNSET RUN CLUBS</span><span>·</span>
          <span>MOUNTAIN TREKS</span><span>·</span>
          <span>ACOUSTIC ROOFTOP GIGS</span><span>·</span>
          <span>BENGALURU</span><span>·</span>
          <span>★ LIMITED SPOTS</span>
        </div>
      </div>

      <main>
        {/* ─── HERO ─────────────────────────────── */}
        <section className="relative overflow-hidden grain">
          {/* Big photo */}
          <div className="relative h-[480px] sm:h-[600px] w-full">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80"
              alt="The Social Scene — gather, connect, explore"
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e1a14]/80 via-[#1e1a14]/20 to-transparent" />

            {/* Hero type */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
              <div className="max-w-7xl mx-auto">
                <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-widest bg-[#c93a2a] text-[#f7f0e3] px-3 py-1 rounded-full mb-3">
                  ● Curated Social Club · India
                </span>
                <h1
                  style={{ fontFamily: 'Bebas Neue, Impact, sans-serif' }}
                  className="text-[72px] sm:text-[110px] md:text-[140px] text-[#f7f0e3] leading-[0.88] tracking-wide"
                >
                  THE
                  <br />
                  SOCIAL
                  <br />
                  <span className="text-[#d4963a]">SCENE.</span>
                </h1>
              </div>
            </div>
          </div>

          {/* ─── Story row (below photo) ───── */}
          <div className="bg-[#f7f0e3] border-b-2 border-[#1e1a14]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 items-start">
              {/* Left: Our Story heading */}
              <div className="md:col-span-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#c93a2a] font-bold">From India with ♥</span>
                <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif' }} className="text-[52px] sm:text-[72px] text-[#c93a2a] leading-[0.9] mt-1">
                  OUR<br />STORY
                </h2>
                <div className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[#1e1a14]/50 space-y-0.5 border-t border-[#1e1a14]/15 pt-4">
                  <p>Est. 2026</p>
                  <p>Bengaluru</p>
                </div>
              </div>

              {/* Right: Two-column text block (newspaper style) */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p style={{ fontFamily: 'Oswald, sans-serif' }} className="text-[22px] sm:text-[28px] font-light text-[#1e1a14] leading-tight tracking-wide">
                    we are a collective of enthusiasts united by a passion for authentic human connection and the art of shared experience.
                  </p>
                </div>
                <div className="space-y-3 font-body text-sm text-[#1e1a14]/80 leading-relaxed border-l-2 border-[#c93a2a] pl-5">
                  <p>We work with people for whom community is not just a product, but a source of inspiration and harmony. Our dedication and commitment to sharing this culture inspires us every day.</p>
                  <p>Every gathering is carefully curated — from high-altitude Western Ghats treks to sunset run clubs and intimate acoustic gigs on rooftops with the city skyline as backdrop.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 70-80s MANIFESTO ─────────────────── */}
        <section className="bg-[#c93a2a] border-b-2 border-[#1e1a14] overflow-hidden relative grain">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left text block */}
              <div className="lg:col-span-5 space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#f7f0e3]/70 font-bold">from India with ♥</span>
                <p style={{ fontFamily: 'Oswald, sans-serif' }} className="text-[22px] sm:text-[28px] font-light text-[#f7f0e3] leading-snug">
                  we are inspired by the spirit of the
                </p>
                <div
                  style={{
                    fontFamily: 'Bebas Neue, Impact, sans-serif',
                    fontSize: 'clamp(96px, 20vw, 176px)',
                    lineHeight: 0.85,
                    color: '#f7f0e3',
                    textShadow: '5px 7px 0px #8b2218, 10px 14px 0px rgba(30,26,20,0.22)',
                    letterSpacing: '0.01em',
                  }}
                >
                  70-80s
                </div>
              </div>

              {/* Right column: mission + facts */}
              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <p style={{ fontFamily: 'Oswald, sans-serif' }} className="text-[17px] font-medium text-[#f7f0e3] leading-snug">
                    our mission is to bring this timeless connection to the modern world.
                  </p>
                  <p className="font-body text-xs text-[#f7f0e3]/80 leading-relaxed">
                    About freedom of expression and selfexpression, our products pay tribute to the culture and the people that shaped the world.
                  </p>
                  <p className="font-body text-xs text-[#f7f0e3]/80 leading-relaxed">
                    our team believes in a future where authentic connection can exist in tandem with our rapidly changing society.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="font-body text-xs text-[#f7f0e3]/80 leading-relaxed">
                    as interpreted by the youth of today, our interpretation is an original and organic reflection of life.
                  </p>
                  <div className="border-t bord er-[#f7f0e3]/20 pt-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#f7f0e3]/60">say hello:</p>
                    <p className="font-mono text-[11px] text-[#f7f0e3] mt-0.5">support@thesocialscene.club</p>
                  </div>
                  <Link
                    href="/become-a-host"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f7f0e3] text-[#c93a2a] font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-[#d4963a] hover:text-[#f7f0e3] transition-colors border-2 border-[#f7f0e3]"
                  >
                    Host an Event ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Activity / Action Photo Section ─── */}
        <section className="border-b-2 border-[#1e1a14] overflow-hidden relative">
          <div className="h-[340px] sm:h-[460px] w-full relative">
            <img
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80"
              alt="People at a social event"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e1a14]/60 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-end p-6 sm:p-10">
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <span className="pill pill-rust border-[#f7f0e3] text-[#f7f0e3]">Instagram ↗</span>
                  {/* <span className="pill border-[#f7f0e3] text-[#f7f0e3]">Youtube ↗</span>
                  <span className="pill border-[#f7f0e3] text-[#f7f0e3]">Facebook ↗</span> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── LOCATIONS ────────────────────────── */}
        <section className="bg-[#ede4d0] border-b-2 border-[#1e1a14]">
          {/* Giant LOCATIONS header */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-6 flex items-baseline justify-between">
            <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(64px, 14vw, 160px)', lineHeight: 0.88, color: '#c93a2a', textShadow: '4px 5px 0px #8b2218' }} >
              LOCATIONS
            </h2>
            <Link href="/events" className="hidden sm:block font-mono text-[11px] uppercase tracking-widest text-[#1e1a14] hover:text-[#c93a2a] transition-colors">
              find more →
            </Link>
          </div>

          {/* City grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { id: '01', name: 'BENGALURU', desc: 'Indiranagar, Koramangala & Cubbon Park sunset runs, acoustic sets, and Western Ghats treks.', color: '#c93a2a' },
              // { id: '02', name: 'DELHI NCR', desc: 'Hauz Khas, Gurgaon & Sunder Nursery run clubs, candlelight acoustic sessions, and rooftop mixers.', color: '#d4963a' },
              // { id: '03', name: 'GOA & HILLS', desc: 'Cliff mixers, surf retreats, and high-altitude Himalayan wilderness camps.', color: '#c93a2a' },
            ].map(c => (
              <div key={c.id} className="border-2 border-[#1e1a14] rounded-2xl p-6 bg-[#f7f0e3] hover:shadow-[4px_5px_0px_#1e1a14] transition-all group">
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: c.color }}>● HUB {c.id}</span>
                <h3 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '2.2rem', color: '#1e1a14', lineHeight: 1 }} className="mt-1 group-hover:text-[#c93a2a] transition-colors">
                  {c.name}
                </h3>
                <p className="font-body text-xs text-[#1e1a14]/70 leading-relaxed mt-2">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURED EXPERIENCES ─────────────── */}
        <section className="bg-[#f7f0e3] border-b-2 border-[#1e1a14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="flex items-baseline justify-between mb-8 sm:mb-12 gap-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#c93a2a] font-bold">● Live Calendar</span>
                <h2 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(40px, 7vw, 80px)', color: '#1e1a14', lineHeight: 0.9 }} className="mt-0.5">
                  FEATURED
                  <br className="hidden sm:block" />
                  <span className="text-[#c93a2a]"> EXPERIENCES</span>
                </h2>
              </div>
              <Link href="/events" className="pill shrink-0">
                View All ↗
              </Link>
            </div>

            {displayEvents?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {displayEvents.map(evt => <EventCard key={evt.id} event={evt} />)}
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#1e1a14]/25 rounded-2xl p-12 text-center">
                <h3 style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '2rem', color: '#c93a2a' }}>No upcoming events yet</h3>
                <p className="font-body text-sm text-[#1e1a14]/70 mt-2">Come back soon or create your own experience as a host.</p>
                <Link href="/become-a-host" className="inline-block mt-5 pill pill-filled">Become a Host ↗</Link>
              </div>
            )}
          </div>
        </section>

        {/* ─── BOTTOM QUICK LINKS GRID ──────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 border-b-2 border-[#1e1a14]">
          {[
            { href: '/events', bg: '#d4963a', textC: '#1e1a14', label: 'WHERE\nTO GO?', sub: 'City Venues', Icon: MapPin },
            { href: '/how-it-works', bg: '#c93a2a', textC: '#f7f0e3', label: 'HOW IT\nWORKS', sub: 'Community Rules', Icon: Info },
            { href: '/tickets', bg: '#f7f0e3', textC: '#1e1a14', label: 'DIGITAL\nPASSES', sub: 'QR Check-in', Icon: QrCode },
            { href: '/become-a-host', bg: '#1e1a14', textC: '#f7f0e3', label: 'HOST\nCLUB', sub: 'Host Perks', Icon: Sparkles },
          ].map(({ href, bg, textC, label, sub, Icon }) => (
            <Link
              key={href}
              href={href}
              style={{ backgroundColor: bg, color: textC, borderRight: '2px solid #1e1a14' }}
              className="group p-7 sm:p-10 flex flex-col items-center justify-center text-center space-y-3 transition-opacity hover:opacity-90 last:border-r-0"
            >
              <div
                style={{ background: textC === '#1e1a14' ? '#1e1a14' : '#f7f0e3', color: textC === '#1e1a14' ? '#f7f0e3' : '#1e1a14' }}
                className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-sm"
              >
                <Icon className="w-6 h-6" />
              </div>
              <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '1.5rem', lineHeight: 1, letterSpacing: '0.03em' }}>
                {label.split('\n').map((l, i) => <div key={i}>{l}</div>)}
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest opacity-70">[ {sub} ]</span>
            </Link>
          ))}
        </section>

        {/* ─── YOUR GATEWAY ─────────────────────── */}
        <section className="bg-[#d4963a] border-b-2 border-[#1e1a14] overflow-hidden relative grain">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-3">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#1e1a14]/70 font-bold">● newsletter</span>
              <div
                style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(52px, 10vw, 96px)', lineHeight: 0.88, color: '#1e1a14' }}
              >
                YOUR<br />GATEWAY TO<br />SOCIAL DELIGHT
              </div>
              <p className="font-body text-sm text-[#1e1a14]/80 leading-relaxed max-w-sm">
                First access to sunset run clubs, mountain summits, secret supper clubs, and rooftop acoustic sets — delivered to your inbox.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="retro-input flex-1"
                  style={{ background: 'rgba(30,26,20,0.08)', borderColor: 'rgba(30,26,20,0.3)' }}
                />
                <button className="px-6 py-3 rounded-xl bg-[#c93a2a] text-[#f7f0e3] font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-[#a82f20] transition-colors border-2 border-[#1e1a14] shrink-0">
                  Subscribe ↗
                </button>
              </div>
              <p className="font-mono text-[9px] text-[#1e1a14]/50 uppercase tracking-widest">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
