import React from 'react';
import Link from 'next/link';
import { Search, Compass, Calendar, MapPin, TrendingUp, Users, ArrowRight, Mountain, Music, Dumbbell, Utensils, Laptop, Sparkles, Heart, Quote } from 'lucide-react';
import { EventService } from '@backend/services/event.service';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default async function PublicHomePage() {
  const events = EventService.getMockEvents();
  const featuredEvents = events.filter((e) => e.featured);

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col selection:bg-[#c85a3c] selection:text-white">
      <Navbar />

      {/* GoFlow-Style Live Marquee Ticker */}
      <div className="bg-[#1d1a24] border-y border-white/10 py-2.5 overflow-hidden text-xs font-black text-[#e59838] uppercase tracking-widest">
        <div className="animate-marquee whitespace-nowrap flex gap-8">
          <span>🌲 MOUNTAIN TREKS & EXPEDITIONS</span>
          <span>•</span>
          <span>🏃 SUNSET RUN CLUBS</span>
          <span>•</span>
          <span>🎸 ACOUSTIC ROOFTOP GIGS</span>
          <span>•</span>
          <span>🍷 CULINARY POP-UPS & DINING</span>
          <span>•</span>
          <span>✨ COME SOLO. LEAVE WITH STORIES.</span>
          <span>•</span>
          <span>🌲 MOUNTAIN TREKS & EXPEDITIONS</span>
          <span>•</span>
          <span>🏃 SUNSET RUN CLUBS</span>
          <span>•</span>
          <span>🎸 ACOUSTIC ROOFTOP GIGS</span>
          <span>•</span>
          <span>🍷 CULINARY POP-UPS & DINING</span>
        </div>
      </div>

      <main className="flex-1">
        {/* HERO SECTION WITH RETRO EMBLEM & TAGLINE */}
        <section className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden">
          <div className="ambient-brand-glow top-0 left-1/2 -translate-x-1/2" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Display Official Logo Badge Emblem */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full mx-auto overflow-hidden border-4 border-[#c85a3c]/70 shadow-2xl shadow-[#c85a3c]/30 mb-6 p-1 bg-[#f5eedf] retro-badge-ring">
              <img
                src="/logo.jpg"
                alt="The Social Scene Official Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            {/* Official Motto Ribbon Banner */}
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-card border border-[#e59838]/40 text-xs font-black text-[#e59838] uppercase tracking-widest mb-6 shadow-xl">
              <Sparkles className="w-4 h-4 text-[#c85a3c]" />
              <span>Come Solo. Leave With Stories.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
              Community • Events • <span className="gradient-text">Treks</span>
            </h1>

            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
              Join outdoor mountain treks, sunset run clubs, intimate acoustic rooftop gigs, and authentic social gatherings across Bengaluru & NCR.
            </p>

            {/* GoFlow-Style Search Bar */}
            <div className="max-w-3xl mx-auto glass-card p-3 rounded-2xl md:rounded-full border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 w-full md:w-auto flex-1">
                <Search className="w-5 h-5 text-[#c85a3c] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search mountain treks, acoustic gigs, run clubs..."
                  className="bg-transparent border-none outline-none text-white placeholder-gray-400 text-sm w-full"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto px-4 py-2 border-t md:border-t-0 md:border-l border-white/10">
                <MapPin className="w-4 h-4 text-[#e59838] flex-shrink-0" />
                <select className="bg-transparent text-sm text-gray-200 outline-none cursor-pointer font-bold">
                  <option value="bengaluru" className="bg-[#141217] text-white">Bengaluru</option>
                  <option value="gurugram" className="bg-[#141217] text-white">Gurugram</option>
                  <option value="mumbai" className="bg-[#141217] text-white">Mumbai</option>
                </select>
              </div>

              <Link
                href="/events"
                className="w-full md:w-auto px-8 py-3.5 rounded-xl md:rounded-full gradient-terracotta text-sm font-extrabold text-white hover:opacity-95 shadow-xl shadow-[#c85a3c]/30 transition-all text-center flex items-center justify-center gap-2"
              >
                Find Experiences
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CATEGORY EXPLORER */}
        <section className="py-10 border-y border-white/10 bg-[#191720]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#c85a3c]" />
                Explore By Vibe
              </h2>
              <Link href="/events" className="text-xs font-bold text-[#e59838] hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { name: 'Outdoor Treks', icon: Mountain, slug: 'treks', color: 'from-[#c85a3c]/20 to-[#e59838]/20 text-[#c85a3c]' },
                { name: 'Sunset Runs', icon: Dumbbell, slug: 'fitness-wellness', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400' },
                { name: 'Music & Gigs', icon: Music, slug: 'music-concerts', color: 'from-purple-500/20 to-pink-500/20 text-purple-400' },
                { name: 'Tech Mixers', icon: Laptop, slug: 'tech-networking', color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400' },
                { name: 'Culinary Pop-ups', icon: Utensils, slug: 'food-culinary', color: 'from-amber-500/20 to-orange-500/20 text-amber-400' },
                { name: 'Creative Labs', icon: TrendingUp, slug: 'art-workshops', color: 'from-violet-500/20 to-indigo-500/20 text-violet-400' },
              ].map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/events?category=${cat.slug}`}
                    className="p-4 rounded-2xl glass-card border border-white/10 hover:border-[#c85a3c]/50 hover:scale-[1.03] transition-all group flex flex-col items-center text-center gap-3"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold text-gray-200 group-hover:text-[#c85a3c]">
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURED EXPERIENCES */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest font-extrabold text-[#c85a3c]">Hand-picked</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                  Featured <span className="gradient-text">Gatherings</span>
                </h2>
              </div>
              <p className="text-sm text-gray-400 max-w-md">
                Limited capacity experiences curated for authentic human connection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredEvents.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        </section>

        {/* GOFLOW-STYLE EXPLORER REVIEWS & STORIES */}
        <section className="py-16 bg-[#191720]/40 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-extrabold text-[#e59838] uppercase tracking-widest">
                Community Proof
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Why Explorers Love <span className="gradient-text">The Social Scene</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Came solo for the Sunday Sunset Run and met 5 amazing friends! The vibe is incredibly welcoming.",
                  author: "Rohan V.",
                  role: "Run Club Member",
                  tag: "Sunset Run",
                },
                {
                  quote: "The candle-lit rooftop acoustic gig was pure magic. Intimate crowd, incredible music, and great conversations.",
                  author: "Ananya S.",
                  role: "Music Explorer",
                  tag: "Acoustic Gig",
                },
                {
                  quote: "Seamless digital QR ticket entry. No long queues at the venue gate, just scan and enter!",
                  author: "Vikram K.",
                  role: "Trek Enthusiast",
                  tag: "Weekend Trek",
                },
              ].map((testimonial, idx) => (
                <div key={idx} className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 relative">
                  <Quote className="w-8 h-8 text-[#c85a3c]/30" />
                  <p className="text-xs text-gray-300 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-white block">{testimonial.author}</span>
                      <span className="text-[10px] text-gray-400 block">{testimonial.role}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#c85a3c]/20 text-[#c85a3c]">
                      {testimonial.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RETRO OUTDOOR COMMUNITY MOTTO BANNER */}
        <section className="py-20 border-t border-white/10 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
            <div className="w-24 h-24 rounded-full mx-auto p-1 bg-[#f5eedf] border-2 border-[#c85a3c] shadow-2xl retro-badge-ring">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Come Solo. <span className="gradient-text">Leave With Stories.</span>
            </h2>

            <p className="text-gray-300 max-w-lg mx-auto text-sm sm:text-base leading-relaxed font-medium">
              Host your own trek, run club, or acoustic session. Manage registrations, ticket sales, and QR check-ins seamlessly.
            </p>

            <a
              href="https://admin.thesocialscene.club"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-terracotta text-sm font-extrabold text-white shadow-xl shadow-[#c85a3c]/30 hover:opacity-90 transition-opacity"
            >
              Become an Event Host
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
