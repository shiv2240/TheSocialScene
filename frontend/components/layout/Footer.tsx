import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#f7f0e3] text-[#1e1a14] border-t-2 border-[#1e1a14] pt-12 pb-28 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top nav-style pills row */}
        <div className="flex flex-wrap items-center gap-2 pb-8 border-b-2 border-[#1e1a14]/15 mb-8">
          {['shop', 'events', 'treks', 'run-clubs', 'rooftop-gigs', 'features', 'host-portal', 'join'].map(tag => (
            <span key={tag} className="pill text-[8px] py-1 px-3">{tag}</span>
          ))}
        </div>

        {/* Main columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#1e1a14]/12">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-3">
            <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '1.8rem', color: '#1e1a14', lineHeight: 1 }}>
              THE SOCIAL<br /><span style={{ color: '#c93a2a' }}>SCENE</span>
            </div>
            <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '1.1rem', color: '#c93a2a', lineHeight: 1.1 }}>
              your gateway to<br />social delight
            </div>
            <p className="font-body text-xs text-[#1e1a14]/70 leading-relaxed">
              Curated outdoor treks, sunset run clubs, intimate rooftop acoustic gigs, and authentic social gatherings across India.
            </p>
            {/* Social links */}
            <div className="flex gap-2 pt-1">
              {['Instagram ↗'].map(s => (
                <span key={s} className="pill text-[8px] py-0.5 px-2.5 cursor-pointer">{s}</span>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div>
            <h4 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-sm font-semibold uppercase tracking-widest text-[#1e1a14] mb-4">
              EXPERIENCES
            </h4>
            <ul className="space-y-2 font-mono text-[11px] text-[#1e1a14]/70">
              {[
                ['All Upcoming Gatherings', '/events'],
                ['Mountain Treks & Hikes', '/events?category=treks'],
                ['Sunset Run Clubs', '/events?category=fitness-wellness'],
                ['Acoustic Rooftop Gigs', '/events?category=music-concerts'],
              ].map(([l, h]) => (
                <li key={h}><Link href={h} className="retro-link hover:text-[#c93a2a]">[ {l} ]</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-sm font-semibold uppercase tracking-widest text-[#1e1a14] mb-4">
              ACCESS
            </h4>
            <ul className="space-y-2 font-mono text-[11px] text-[#1e1a14]/70">
              {[
                ['Become a Host', '/become-a-host'],
                ['Digital QR Passes', '/tickets'],
                ['Host Portal ↗', 'https://thesocialscene.club/become-a-host'],
              ].map(([l, h]) => (
                <li key={h}><Link href={h} className="retro-link hover:text-[#c93a2a]">[ {l} ]</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-sm font-semibold uppercase tracking-widest text-[#1e1a14] mb-4">
              CONTACT
            </h4>
            <ul className="space-y-2 font-mono text-[11px] text-[#1e1a14]/70">
              <li>support@thesocialscene.club</li>
              <li className="pt-2"><Link href="/privacy" className="retro-link">Privacy Policy</Link></li>
              <li><Link href="/terms" className="retro-link">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 font-mono text-[10px] text-[#1e1a14]/50 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} The Social Scene · India · All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with <Heart className="w-3 h-3 fill-[#c93a2a] text-[#c93a2a] inline" /> for social explorers
          </p>
          <div
            style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '1.2rem', color: '#1e1a14', opacity: 0.3, letterSpacing: '0.05em' }}
          >
            THESOCIALSCENE
          </div>
        </div>
      </div>
    </footer>
  );
}
