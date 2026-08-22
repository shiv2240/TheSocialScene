'use client';

import React, { useEffect, useState } from 'react';
import { Search, Bell, Globe, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DashboardHeader() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data } = await supabase.rpc('get_my_dashboard_role');
      if (data) setRole(data);
    };
    void loadUser();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-[#0b0f19]/90 backdrop-blur-md border-b border-gray-800/80 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Search events, registrations, tickets..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-purple-300">
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>admin.thesocialscene.club</span>
        </div>

        <button className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-pink-500 absolute top-1.5 right-1.5 animate-pulse" />
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
          <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/40 flex items-center justify-center text-xs font-black text-purple-200">
            {(email[0] || 'A').toUpperCase()}
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-bold text-white block">{role || 'Dashboard User'}</span>
            <span className="text-[10px] text-gray-400 block">{email || 'Authenticated'}</span>
          </div>
          <button onClick={handleLogout} disabled={loggingOut} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900 disabled:opacity-50" aria-label="Sign out" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
