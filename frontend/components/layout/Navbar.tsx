'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, User, Ticket, CreditCard, Menu, X, Compass, LogOut, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CurrentProfile { full_name?: string | null; email?: string | null; }

export function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      if (!response.ok) { setSignedIn(false); setProfile(null); return; }
      const body = await response.json();
      setSignedIn(true);
      setProfile(body.profile ?? null);
    } catch { setSignedIn(false); setProfile(null); }
  }, []);

  useEffect(() => {
    void loadSession();
    const onProfileUpdated = () => void loadSession();
    window.addEventListener('tss:profile-updated', onProfileUpdated);
    window.addEventListener('focus', onProfileUpdated);
    return () => {
      window.removeEventListener('tss:profile-updated', onProfileUpdated);
      window.removeEventListener('focus', onProfileUpdated);
    };
  }, [loadSession]);

  const displayName = profile?.full_name?.trim() || '';
  const greeting = displayName ? `Hi, ${displayName.split(/\s+/)[0]}` : 'My Account';

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSignedIn(false); setProfile(null);
      window.dispatchEvent(new Event('tss:profile-updated'));
      router.replace('/'); router.refresh();
    } finally { setSigningOut(false); }
  };

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c85a3c]/60 shadow-lg shadow-[#c85a3c]/20 group-hover:scale-105 transition-transform flex-shrink-0 bg-[#f5eedf]"><img src="/logo.jpg" alt="The Social Scene Logo" className="w-full h-full object-cover" /></div>
            <div><span className="text-xl font-black tracking-tight text-white block leading-none">The Social <span className="gradient-text">Scene</span></span><span className="block text-[10px] uppercase tracking-widest text-[#e59838] font-extrabold mt-1">Community • Events • Treks</span></div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/events" className="text-sm font-bold text-gray-200 hover:text-[#c85a3c] transition-colors flex items-center gap-2"><Compass className="w-4 h-4 text-[#c85a3c]" />Discover Events & Treks</Link>
            <Link href="/categories" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Categories</Link>
            <Link href="/hosts/social-club" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Top Hosts</Link>
            <Link href="/become-a-host" className="text-sm font-extrabold text-[#e59838] hover:text-white transition-colors flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Become a Host</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/events" className="p-2.5 rounded-full bg-[#231f2b] hover:bg-[#2e2938] text-gray-300 hover:text-white transition-all border border-white/10" title="Search Events"><Search className="w-4 h-4" /></Link>
            {signedIn && <Link href="/payments" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#231f2b] hover:bg-[#2e2938] text-xs font-bold text-gray-200 border border-white/10 hover:border-[#c85a3c]/50 transition-all"><CreditCard className="w-4 h-4 text-[#c85a3c]" />My Payments</Link>}
            <Link href="/tickets" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#231f2b] hover:bg-[#2e2938] text-xs font-bold text-gray-200 border border-white/10 hover:border-[#c85a3c]/50 transition-all"><Ticket className="w-4 h-4 text-[#c85a3c]" />My Tickets</Link>
            {signedIn ? <><Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#231f2b] text-xs font-bold text-gray-200 border border-white/10"><User className="w-4 h-4 text-[#c85a3c]" />{greeting}</Link><button onClick={signOut} disabled={signingOut} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl gradient-terracotta text-xs font-extrabold text-white disabled:opacity-60"><LogOut className="w-4 h-4" />{signingOut ? 'Signing out...' : 'Sign Out'}</button></> : <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-extrabold text-white shadow-lg shadow-[#c85a3c]/30"><User className="w-4 h-4" />Sign In</Link>}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {signedIn ? <Link href="/profile" className="px-3 py-1.5 rounded-xl gradient-terracotta text-xs font-extrabold text-white">{greeting}</Link> : <Link href="/login" className="px-3 py-1.5 rounded-xl gradient-terracotta text-xs font-extrabold text-white">Sign In</Link>}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl bg-[#231f2b] text-gray-300 hover:text-white">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>

        {mobileMenuOpen && <div className="md:hidden py-4 border-t border-white/10 space-y-3"><Link href="/events" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">Discover Events & Treks</Link><Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">Categories</Link><Link href="/become-a-host" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-extrabold text-[#e59838] hover:bg-[#231f2b]">Become a Host</Link>{signedIn && <Link href="/payments" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">My Payments</Link>}<Link href="/tickets" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">My Tickets</Link>{signedIn && <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">Profile</Link>}{signedIn && <button onClick={signOut} className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">Sign Out</button>}</div>}
      </div>
    </header>
  );
}
