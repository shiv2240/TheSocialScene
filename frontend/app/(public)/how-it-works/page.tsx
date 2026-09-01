import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Search, UserCheck, Ticket, QrCode, Star, Sparkles, Mountain, Music, Users, ArrowRight, Heart
} from 'lucide-react';

export const metadata = {
  title: 'How It Works | The Social Scene',
  description: 'Discover how The Social Scene works — find events, register in seconds, show up with your QR pass, and leave with stories.',
};

const STEPS = [
  {
    num: '01',
    Icon: Search,
    title: 'Browse & Discover',
    body: 'Explore a curated calendar of real-world experiences — sunset run clubs, mountain treks, acoustic gigs, and intimate social gatherings. Filter by city, vibe, or date.',
    tip: 'New events drop every week.',
  },
  {
    num: '02',
    Icon: UserCheck,
    title: 'Register in Seconds',
    body: 'Create a free account with just your email or phone. No passwords — we use a one-time code. Select your event, review the details, and register with a single payment.',
    tip: 'Secure checkout via Razorpay.',
  },
  {
    num: '03',
    Icon: Ticket,
    title: 'Get Your Digital Pass',
    body: 'Immediately after payment, receive a unique QR pass on your email and in your account dashboard. Each pass is personal and tied to your name.',
    tip: 'No printing needed — it\'s on your phone.',
  },
  {
    num: '04',
    Icon: QrCode,
    title: 'Show Up & Check In',
    body: 'Arrive at the event, open your pass, and let the host scan your QR code. It\'s one-tap verification — no paper tickets, no queues.',
    tip: 'Passes are single-use and tamper-proof.',
  },
  {
    num: '05',
    Icon: Heart,
    title: 'Connect & Experience',
    body: 'Meet like-minded people, embrace the experience, and make real connections. Come solo, leave with a crew. That\'s the whole point.',
    tip: 'Every event is limited to keep it intimate.',
  },
];

const EXPERIENCE_TYPES = [
  { Icon: Mountain,  label: 'Outdoor Treks',       desc: 'Western Ghats day hikes, Himalayan camps, cliff walks, and sunrise summits.' },
  { Icon: Users,     label: 'Sunset Run Clubs',     desc: 'Weekly sunset runs through city parks, urban trails, and scenic routes.' },
  { Icon: Music,     label: 'Acoustic Rooftop Gigs',desc: 'Intimate candlelit acoustic sets on rooftops across the city skyline.' },
  { Icon: Sparkles,  label: 'Secret Supper Clubs',  desc: 'Pop-up dinners curated around a theme, a cuisine, or a community.' },
  { Icon: Star,      label: 'Tech Mixers',           desc: 'Casual networking evenings for builders, founders, and creative professionals.' },
  { Icon: Heart,     label: 'Art & Workshops',       desc: 'Hands-on creative workshops, pottery, life drawing, film photography, and more.' },
];

const RULES = [
  { title: 'Come with an open mind',       body: 'Leave your ego at the door. These events work best when you\'re genuinely present.' },
  { title: 'Respect the space & people',   body: 'Hosts put care into every event. Respect the venue, other guests, and the community.' },
  { title: 'Passes are non-transferable',  body: 'Your QR pass is tied to your name and can only be used by you. No reselling.' },
  { title: 'Arrive on time',               body: 'Many experiences have a set start time. Latecomers may be turned away, especially on treks.' },
  { title: 'Solo is welcome',              body: 'You don\'t need a group. Most of our attendees come alone and leave with new friends.' },
  { title: 'Cancel with notice',           body: 'Plans change — we get it. Check the event\'s refund policy before registering.' },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#ede4d0] text-[#1e1a14] flex flex-col pb-24 md:pb-0">
      <Navbar />

      {/* ── Hero ────────────────────────────── */}
      <section className="bg-[#f7f0e3] border-b-2 border-[#1e1a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
          <div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#c93a2a]">● Community Guide</span>
            <h1
              style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(60px, 14vw, 130px)', lineHeight: 0.88, color: '#1e1a14' }}
              className="mt-1"
            >
              HOW IT<br /><span style={{ color: '#c93a2a' }}>WORKS</span>
            </h1>
            <p className="font-body text-sm sm:text-base text-[#1e1a14]/70 mt-4 max-w-lg leading-relaxed">
              The Social Scene is simple by design. Find an experience you actually want to show up for, register in seconds, and come as you are. Here's exactly how it works.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['No Passwords', 'QR Check-in', 'Real People', 'Limited Spots', 'Come Solo', 'Leave With Stories'].map(t => (
              <span key={t} className="pill text-[9px]">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5 Steps ─────────────────────────── */}
      <section className="bg-[#ede4d0] border-b-2 border-[#1e1a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#c93a2a]">● Step by Step</span>
          <h2
            style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(40px, 8vw, 72px)', color: '#1e1a14', lineHeight: 0.9 }}
            className="mt-0.5 mb-10 sm:mb-14"
          >
            FROM DISCOVERY TO<br />CHECK-IN
          </h2>

          <div className="space-y-0 divide-y-2 divide-[#1e1a14]/10">
            {STEPS.map(({ num, Icon, title, body, tip }, i) => (
              <div
                key={num}
                className="grid grid-cols-1 sm:grid-cols-[80px_1fr_auto] gap-4 sm:gap-8 py-8 sm:py-10 items-start group"
              >
                {/* Step number */}
                <div>
                  <span
                    style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '3.5rem', color: i % 2 === 0 ? '#c93a2a' : '#1e1a14', lineHeight: 1, opacity: 0.9 }}
                  >{num}</span>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#c93a2a] flex items-center justify-center text-[#f7f0e3] shrink-0 group-hover:rotate-6 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-xl sm:text-2xl font-bold text-[#1e1a14] uppercase tracking-wide">
                      {title}
                    </h3>
                  </div>
                  <p className="font-body text-sm text-[#1e1a14]/75 leading-relaxed max-w-xl">
                    {body}
                  </p>
                </div>

                {/* Tip */}
                <div className="sm:text-right">
                  <span className="inline-block font-mono text-[9px] font-bold uppercase tracking-widest text-[#d4963a] bg-[#d4963a]/10 border border-[#d4963a]/30 px-3 py-1.5 rounded-full">
                    ★ {tip}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/events" className="pill pill-filled">Browse Events ↗</Link>
            <Link href="/login" className="pill">Create Account ↗</Link>
          </div>
        </div>
      </section>

      {/* ── Experience Types ─────────────────── */}
      <section className="bg-[#c93a2a] border-b-2 border-[#1e1a14] relative grain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#f7f0e3]/60">● What We Do</span>
          <h2
            style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(40px, 8vw, 72px)', color: '#f7f0e3', lineHeight: 0.9 }}
            className="mt-0.5 mb-10"
          >
            TYPES OF<br />EXPERIENCES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPERIENCE_TYPES.map(({ Icon, label, desc }) => (
              <div key={label} className="bg-[#f7f0e3] rounded-2xl border-2 border-[#1e1a14] p-6 group hover:shadow-[4px_5px_0px_#1e1a14] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#c93a2a] flex items-center justify-center text-[#f7f0e3] mb-4 group-hover:rotate-6 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-lg font-bold text-[#1e1a14] uppercase tracking-wide">
                  {label}
                </h3>
                <p className="font-body text-xs text-[#1e1a14]/70 leading-relaxed mt-1.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Rules ─────────────────── */}
      <section className="bg-[#f7f0e3] border-b-2 border-[#1e1a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#c93a2a]">● Community Standards</span>
          <h2
            style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(40px, 8vw, 72px)', color: '#1e1a14', lineHeight: 0.9 }}
            className="mt-0.5 mb-10"
          >
            THE UNWRITTEN<br /><span style={{ color: '#c93a2a' }}>RULES</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RULES.map(({ title, body }) => (
              <div key={title} className="border-l-4 border-[#c93a2a] pl-5 py-1">
                <h3 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-base font-bold text-[#1e1a14] uppercase tracking-wide">
                  {title}
                </h3>
                <p className="font-body text-xs text-[#1e1a14]/70 leading-relaxed mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Hosts CTA ────────────────────── */}
      <section className="bg-[#1e1a14] border-b-2 border-[#1e1a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#d4963a]">● For Creators & Communities</span>
            <h2
              style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(44px, 9vw, 88px)', color: '#f7f0e3', lineHeight: 0.88 }}
              className="mt-1"
            >
              WANT TO<br />HOST AN<br /><span style={{ color: '#c93a2a' }}>EVENT?</span>
            </h2>
          </div>
          <div className="space-y-4">
            <p className="font-body text-sm text-[#f7f0e3]/80 leading-relaxed">
              If you run a community, organise fitness groups, do music, or just have a great idea for a gathering — apply to become a host. We handle registrations, ticketing, and QR check-in so you can focus on the experience.
            </p>
            <ul className="space-y-2">
              {[
                'Your own host dashboard',
                'Event registration & pass management',
                'Verified QR attendee check-in',
                'Promoted to our community',
              ].map(f => (
                <li key={f} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#f7f0e3]/70">
                  <span className="text-[#d4963a]">★</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/become-a-host"
              className="inline-flex items-center gap-2 mt-2 px-6 py-3 rounded-full bg-[#c93a2a] text-[#f7f0e3] font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-[#a82f20] transition-colors border-2 border-[#c93a2a]"
            >
              Apply to Host <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────── */}
      <section className="bg-[#ede4d0] border-b-2 border-[#1e1a14]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#c93a2a]">● Common Questions</span>
          <h2
            style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: 'clamp(40px, 8vw, 72px)', color: '#1e1a14', lineHeight: 0.9 }}
            className="mt-0.5 mb-10"
          >
            FAQ
          </h2>
          <div className="space-y-0 divide-y-2 divide-[#1e1a14]/10">
            {[
              { q: 'Do I need to create an account?', a: 'Yes. You need a free account to register for events and access your QR passes. Sign up takes under 30 seconds — just your email or phone, no password.' },
              { q: 'Can I come alone?', a: 'Absolutely — most of our attendees come solo. Our events are specifically designed to be welcoming to solo attendees. You\'ll leave with people you want to see again.' },
              { q: 'What is the refund policy?', a: 'Refund policies are set individually by each host and displayed clearly on the event page before checkout. Some events are non-refundable due to limited capacity.' },
              { q: 'How do I access my ticket?', a: 'Your QR pass is emailed immediately after payment and also available in your account under "My Passes". No printing needed — just show it on your phone.' },
              { q: 'What cities are you in?', a: 'Currently active in Bengaluru. Expanding to Delhi NCR and Goa soon. Follow us on Instagram to be the first to know.' },
              { q: 'How do I become a host?', a: 'Fill out our host application form. We review all applications and get back within a few days. Approved hosts get a dedicated dashboard, ticketing tools, and promotion to our community.' },
            ].map(({ q, a }) => (
              <div key={q} className="py-6">
                <h3 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-base sm:text-lg font-bold text-[#1e1a14] uppercase tracking-wide">
                  {q}
                </h3>
                <p className="font-body text-sm text-[#1e1a14]/70 leading-relaxed mt-2">{a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 border-t-2 border-[#1e1a14]/10 pt-8 flex flex-wrap gap-3">
            <Link href="/events" className="pill pill-filled">Explore Events ↗</Link>
            <Link href="/become-a-host" className="pill pill-rust">Become a Host ↗</Link>
            <Link href="/" className="pill">← Back to Home</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
