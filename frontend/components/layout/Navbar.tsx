'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, User, Ticket, CreditCard, Menu, X, Compass, LogOut, Sparkles, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CurrentProfile { full_name?: string | null; email?: string | null; }

export function Navbar() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
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

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const displayName = profile?.full_name?.trim() || '';
  const greeting = displayName ? `Hi, ${displayName.split(/\s+/)[0]}` : 'My Account';

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSignedIn(false); setProfile(null); setAccountMenuOpen(false);
      window.dispatchEvent(new Event('tss:profile-updated'));
      router.replace('/'); router.refresh();
    } finally { setSigningOut(false); }
  };

  const closeMenus = () => { setAccountMenuOpen(false); setMobileMenuOpen(false); };

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
            {signedIn ? (
              <div ref={menuRef} className="relative">
                <button onClick={() => setAccountMenuOpen(!accountMenuOpen)} aria-expanded={accountMenuOpen} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#231f2b] hover:bg-[#2e2938] text-xs font-bold text-gray-200 border border-white/10 hover:border-[#c85a3c]/50 transition-all">
                  <span className="w-7 h-7 rounded-full bg-[#c85a3c]/20 border border-[#c85a3c]/40 flex items-center justify-center"><User className="w-4 h-4 text-[#c85a3c]" /></span>
                  <span>{greeting}</span><ChevronDown className={`w-4 h-4 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#18151f] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10"><p className="text-sm font-bold text-white truncate">{displayName || 'My Account'}</p>{profile?.email && <p className="text-xs text-gray-400 truncate mt-0.5">{profile.email}</p>}</div>
                    <div className="p-2">
                      <Link href="/tickets" onClick={closeMenus} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-white/5 hover:text-white"><Ticket className="w-4 h-4 text-[#c85a3c]" />My Bookings</Link>
                      <Link href="/payments" onClick={closeMenus} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-white/5 hover:text-white"><CreditCard className="w-4 h-4 text-[#c85a3c]" />My Payments</Link>
                      <Link href="/profile" onClick={closeMenus} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-white/5 hover:text-white"><User className="w-4 h-4 text-[#c85a3c]" />My Account</Link>
                    </div>
                    <div className="border-t border-white/10 p-2"><button onClick={signOut} disabled={signingOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"><LogOut className="w-4 h-4" />{signingOut ? 'Signing out...' : 'Sign Out'}</button></div>
                  </div>
                )}
              </div>
            ) : <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-extrabold text-white shadow-lg shadow-[#c85a3c]/30"><User className="w-4 h-4" />Sign In</Link>}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {signedIn ? <button onClick={() => setAccountMenuOpen(!accountMenuOpen)} className="px-3 py-1.5 rounded-xl gradient-terracotta text-xs font-extrabold text-white flex items-center gap-1.5">{greeting}<ChevronDown className={`w-3.5 h-3.5 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} /></button> : <Link href="/login" className="px-3 py-1.5 rounded-xl gradient-terracotta text-xs font-extrabold text-white">Sign In</Link>}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl bg-[#231f2b] text-gray-300 hover:text-white">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>

        {accountMenuOpen && signedIn && <div className="md:hidden absolute right-4 top-16 w-64 rounded-2xl bg-[#18151f] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden z-50"><div className="px-4 py-3 border-b border-white/10"><p className="text-sm font-bold text-white truncate">{displayName || 'My Account'}</p>{profile?.email && <p className="text-xs text-gray-400 truncate mt-0.5">{profile.email}</p>}</div><div className="p-2"><Link href="/tickets" onClick={closeMenus} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-white/5"> <Ticket className="w-4 h-4 text-[#c85a3c]" />My Bookings</Link><Link href="/payments" onClick={closeMenus} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-white/5"><CreditCard className="w-4 h-4 text-[#c85a3c]" />My Payments</Link><Link href="/profile" onClick={closeMenus} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-200 hover:bg-white/5"><User className="w-4 h-4 text-[#c85a3c]" />My Account</Link></div><div className="border-t border-white/10 p-2"><button onClick={signOut} disabled={signingOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-300"><LogOut className="w-4 h-4" />{signingOut ? 'Signing out...' : 'Sign Out'}</button></div></div>}

        {mobileMenuOpen && <div className="md:hidden py-4 border-t border-white/10 space-y-3"><Link href="/events" onClick={closeMenus} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">Discover Events & Treks</Link><Link href="/categories" onClick={closeMenus} className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 hover:bg-[#231f2b]">Categories</Link><Link href="/become-a-host" onClick={closeMenus} className="block px-4 py-2.5 rounded-xl text-sm font-extrabold text-[#e59838] hover:bg-[#231f2b]">Become a Host</Link></div>}
      </div>
    </header>
  );
}
