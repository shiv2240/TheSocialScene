'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { Compass, User, Ticket, CreditCard, LogOut, ChevronDown, Home, Search, Zap, X, Loader2, Shield, FileText } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase/client';

interface CurrentProfile { full_name?: string | null; email?: string | null; }

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [searchLoad, setSearchLoad] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<number>(0);
  const authInitializedRef = useRef(false);

  const loadSession = useCallback(async (force = false) => {
    if (!force && Date.now() - lastFetchRef.current < 30_000) return;
    lastFetchRef.current = Date.now();
    try {
      const res = await fetch('/api/profile', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) { setSignedIn(false); setProfile(null); return; }
      const body = await res.json();
      setSignedIn(true);
      setProfile(body.profile ?? null);
    } catch { setSignedIn(false); setProfile(null); }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const wasInitialized = authInitializedRef.current;
      authInitializedRef.current = true;
      if (!user) {
        setSignedIn(false);
        setProfile(null);
        return;
      }
      // On initial page load, the restored Firebase session can be checked.
      // During a new login, wait for /api/auth/session to set the HttpOnly
      // cookie and for the login page to emit the session-established event.
      if (!wasInitialized) void loadSession(true);
    });

    const onSessionEstablished = () => void loadSession(true);
    const onProfileUpdate = () => void loadSession(true);
    const onFocus = () => { if (authInitializedRef.current) void loadSession(); };

    window.addEventListener('tss:auth-session-established', onSessionEstablished);
    window.addEventListener('tss:profile-updated', onProfileUpdate);
    window.addEventListener('focus', onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener('tss:auth-session-established', onSessionEstablished);
      window.removeEventListener('tss:profile-updated', onProfileUpdate);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadSession]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openSearch = () => { setSearchOpen(true); setMenuOpen(false); setTimeout(() => searchInput.current?.focus(), 80); };
  const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); setSearchRes([]); };

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchRes([]); return; }
    setSearchLoad(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}&limit=6`);
        const body = await res.json();
        setSearchRes(body.results ?? []);
      } catch { setSearchRes([]); }
      finally { setSearchLoad(false); }
    }, 350);
  };

  const goToSearch = (q: string) => { closeSearch(); router.push(`/events?q=${encodeURIComponent(q)}`); };
  const displayName = profile?.full_name?.trim() || '';
  const firstName = displayName ? displayName.split(/\s+/)[0] : '';

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSignedIn(false); setProfile(null); setMenuOpen(false);
      window.dispatchEvent(new Event('tss:profile-updated'));
      router.replace('/'); router.refresh();
    } finally { setSigningOut(false); }
  };

  const isActive = (p: string) => p === '/' ? pathname === '/' : pathname?.startsWith(p);

  return (
    <>
      <header className="sticky top-0 z-50 retro-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
            <Link href="/" className="group flex items-center gap-2.5 shrink-0" onClick={() => setMenuOpen(false)}>
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[#1e1a14] group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 bg-[#c93a2a] p-0.5 shadow-sm"><img src="/logo.jpg" alt="The Social Scene" className="w-full h-full object-cover rounded-lg" /></div>
              <div><div className="font-display text-lg sm:text-xl text-[#1e1a14] leading-none tracking-wide">THE SOCIAL SCENE</div><div className="font-mono text-[9px] text-[#c93a2a] uppercase tracking-widest leading-none mt-0.5">● curated social experiences</div></div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 font-sub font-semibold text-[11px] uppercase tracking-widest">
              {[{ href: '/events', label: 'Explore' }, { href: '/categories', label: 'Stages' }, { href: '/become-a-host', label: 'Host ↗' }].map(({ href, label }) => <Link key={href} href={href} className={`px-4 py-2 rounded-full transition-all ${isActive(href) ? 'bg-[#c93a2a] text-[#f7f0e3]' : 'text-[#1e1a14] hover:bg-[#1e1a14]/8'}`}>{label}</Link>)}
            </nav>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={openSearch} className="p-2 rounded-full text-[#1e1a14] hover:bg-[#1e1a14]/8 transition-colors" title="Search events"><Search className="w-4 h-4" /></button>
              {signedIn ? <div ref={menuRef} className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#1e1a14] text-[#f7f0e3] text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-[#c93a2a] transition-colors"><span className="w-5 h-5 rounded-full bg-[#c93a2a] flex items-center justify-center text-white text-[9px] font-bold">{firstName ? firstName[0].toUpperCase() : '★'}</span><span>{firstName || 'Account'}</span><ChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} /></button>
                {menuOpen && <div className="absolute right-0 top-full mt-2 w-56 bg-[#f7f0e3] border-2 border-[#1e1a14] rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-[#1e1a14]/15 bg-[#e0d5bc]"><p className="font-sub font-bold text-sm text-[#1e1a14] truncate uppercase tracking-wide">{displayName || 'Account'}</p>{profile?.email && <p className="font-mono text-[10px] text-[#1e1a14]/60 truncate mt-0.5">{profile.email}</p>}</div>
                  <div className="p-2 space-y-0.5 font-sub text-[11px] font-semibold uppercase tracking-wider">{[{ href: '/tickets', label: 'My Passes', Icon: Ticket }, { href: '/payments', label: 'Payments', Icon: CreditCard }, { href: '/profile', label: 'Profile', Icon: User }].map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#1e1a14] hover:bg-[#c93a2a] hover:text-[#f7f0e3] transition-colors"><Icon className="w-3.5 h-3.5 shrink-0" />{label}</Link>)}</div>
                  <div className="border-t border-[#1e1a14]/12 p-2 space-y-0.5">{[{ href: '/privacy', label: 'Privacy Policy', Icon: Shield }, { href: '/terms', label: 'Terms of Service', Icon: FileText }].map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl font-mono text-[9px] font-bold uppercase tracking-widest text-[#1e1a14]/50 hover:bg-[#1e1a14]/8 hover:text-[#1e1a14] transition-colors"><Icon className="w-3 h-3 shrink-0" />{label}</Link>)}</div>
                  <div className="border-t border-[#1e1a14]/12 p-2"><button onClick={signOut} disabled={signingOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"><LogOut className="w-3.5 h-3.5" />{signingOut ? 'Signing out...' : 'Sign Out'}</button></div>
                </div>}
              </div> : <Link href="/login" className="px-5 py-2 rounded-full bg-[#c93a2a] text-[#f7f0e3] font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-[#a82f20] transition-colors shadow-sm">Sign In ↗</Link>}
            </div>
            <div className="flex md:hidden items-center gap-2">
              <button onClick={openSearch} className="w-8 h-8 rounded-xl border-2 border-[#1e1a14] flex items-center justify-center text-[#1e1a14] hover:bg-[#1e1a14] hover:text-[#f7f0e3] transition-colors"><Search className="w-4 h-4" /></button>
              {signedIn ? <Link href="/profile" className="w-8 h-8 rounded-xl bg-[#c93a2a] border-2 border-[#1e1a14] flex items-center justify-center text-[#f7f0e3] shadow-sm"><User className="w-4 h-4" /></Link> : <Link href="/login" className="px-3.5 py-1.5 rounded-full bg-[#c93a2a] text-[#f7f0e3] font-mono text-[10px] font-bold uppercase tracking-widest">Login</Link>}
            </div>
          </div>
        </div>
      </header>
      {searchOpen && <div className="fixed inset-0 z-[60] bg-[#1e1a14]/40 backdrop-blur-sm" onClick={closeSearch}><div ref={searchRef} onClick={e => e.stopPropagation()} className="absolute top-14 sm:top-16 left-0 right-0 bg-[#f7f0e3] border-b-2 border-[#1e1a14] shadow-2xl"><div className="max-w-2xl mx-auto px-4 py-3">
        <div className="relative flex items-center gap-3">{searchLoad ? <Loader2 className="w-4 h-4 text-[#c93a2a] animate-spin shrink-0" /> : <Search className="w-4 h-4 text-[#c93a2a] shrink-0" />}<input ref={searchInput} type="text" value={searchQuery} onChange={e => handleSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) goToSearch(searchQuery.trim()); if (e.key === 'Escape') closeSearch(); }} placeholder="Search events, venues, vibes..." className="flex-1 bg-transparent font-mono text-sm font-bold text-[#1e1a14] placeholder-[#1e1a14]/40 outline-none py-2.5" />{searchQuery && <button onClick={closeSearch} className="text-[#1e1a14]/40 hover:text-[#c93a2a] transition-colors"><X className="w-4 h-4" /></button>}</div>
        {searchRes.length > 0 && <div className="border-t border-[#1e1a14]/12 pt-2 pb-1 space-y-0.5 max-h-72 overflow-y-auto">{searchRes.map((evt: any) => <button key={evt.id} onClick={() => { closeSearch(); router.push(`/events/${evt.slug}`); }} className="w-full text-left flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#c93a2a]/10 transition-colors group">{evt.cover_image && <img src={evt.cover_image} alt="" className="w-9 h-9 rounded-lg object-cover border border-[#1e1a14]/15 shrink-0" />}<div className="flex-1 min-w-0"><p className="font-sub font-bold text-sm text-[#1e1a14] group-hover:text-[#c93a2a] transition-colors truncate uppercase tracking-wide">{evt.title}</p><p className="font-mono text-[9px] text-[#1e1a14]/50 truncate">{evt.category?.name && `${evt.category.name} · `}{evt.venue?.name ?? ''}</p></div><span className="font-mono text-[9px] text-[#c93a2a] shrink-0">→</span></button>)}<button onClick={() => goToSearch(searchQuery)} className="w-full text-center font-mono text-[10px] text-[#1e1a14]/50 hover:text-[#c93a2a] py-2 transition-colors uppercase tracking-widest border-t border-[#1e1a14]/10 mt-1">See all results for "{searchQuery}" →</button></div>}
        {searchQuery && !searchLoad && searchRes.length === 0 && <div className="border-t border-[#1e1a14]/12 pt-3 pb-2"><p className="font-mono text-[10px] text-[#1e1a14]/50 uppercase tracking-widest">No results for "{searchQuery}"</p></div>}
        {!searchQuery && <div className="border-t border-[#1e1a14]/12 pt-2 pb-1 flex gap-2 flex-wrap">{['Sunset Run', 'Mountain Trek', 'Acoustic Gig', 'Bengaluru'].map(hint => <button key={hint} onClick={() => handleSearchInput(hint)} className="font-mono text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#1e1a14]/20 text-[#1e1a14]/60 hover:border-[#c93a2a] hover:text-[#c93a2a] transition-colors">{hint}</button>)}</div>}
      </div></div></div>}
      <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden retro-dock pb-safe shadow-2xl"><div className="flex justify-around items-center px-2 pt-2 pb-1">{[{ href: '/', label: 'Home', Icon: Home }, { href: '/events', label: 'Explore', Icon: Compass }, { href: '/become-a-host', label: 'Host', Icon: Zap }, { href: signedIn ? '/tickets' : '/login', label: 'Passes', Icon: Ticket }, { href: signedIn ? '/profile' : '/login', label: signedIn ? 'Me' : 'Login', Icon: User }].map(({ href, label, Icon }) => <Link key={label} href={href} className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors ${isActive(href) ? 'text-[#c93a2a]' : 'text-[#1e1a14]/60'}`}><Icon className="w-4 h-4" /><span className="font-mono text-[8px] font-bold uppercase tracking-widest">{label}</span></Link>)}</div></nav>
    </>
  );
}
