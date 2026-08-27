import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#100f15] border-t border-white/10 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#c85a3c]/60 flex-shrink-0 bg-[#f5eedf]"><img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" /></div>
              <span className="text-lg font-black text-white tracking-tight">The Social <span className="gradient-text">Scene</span></span>
            </Link>
            <p className="text-xs text-[#e59838] font-bold uppercase tracking-wider">Come Solo. Leave With Stories.</p>
            <p className="text-xs text-gray-400 leading-relaxed">Curated outdoor treks, sunset run clubs, acoustic rooftop gigs, and authentic social gatherings.</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Community</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link href="/events" className="hover:text-[#c85a3c] transition-colors">All Upcoming Events</Link></li>
              <li><Link href="/categories/treks" className="hover:text-[#c85a3c] transition-colors">Mountain Treks & Hikes</Link></li>
              <li><Link href="/categories/fitness-wellness" className="hover:text-[#c85a3c] transition-colors">Sunset Run Clubs</Link></li>
              <li><Link href="/categories/music-concerts" className="hover:text-[#c85a3c] transition-colors">Acoustic Rooftop Gigs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Hosts & Operations</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link href="/become-a-host" className="text-[#c85a3c] font-bold hover:underline">Become a Host</Link></li>
              <li><Link href="/tickets" className="hover:text-[#c85a3c] transition-colors">Digital QR Passes</Link></li>
              <li><a href="https://admin.thesocialscene.club" target="_blank" rel="noopener noreferrer" className="hover:text-[#c85a3c] transition-colors">Host Dashboard Portal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li><Link href="#" className="hover:text-[#c85a3c] transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-[#c85a3c] transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-[#c85a3c] transition-colors">Support & FAQs</Link></li>
              <li><span className="text-[11px] text-gray-500 block pt-1 font-mono">Domain: thesocialscene.club</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} The Social Scene. All rights reserved.</p>
          <p className="flex items-center gap-1">Crafted with <Heart className="w-3.5 h-3.5 text-[#c85a3c] fill-[#c85a3c] inline" /> for social explorers.</p>
        </div>
      </div>
    </footer>
  );
}
