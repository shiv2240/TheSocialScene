'use client';

import React from 'react';
import { Search, Bell, Globe, Shield, LogOut } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="h-16 bg-[#0b0f19]/90 backdrop-blur-md border-b border-gray-800/80 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events, registrations, tickets..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Host Domain Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-purple-300">
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>admin.thesocialscene.club</span>
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-pink-500 absolute top-1.5 right-1.5 animate-pulse" />
        </button>

        {/* User Dropdown */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
            alt="Admin Avatar"
            className="w-8 h-8 rounded-lg object-cover border border-purple-500/40"
          />
          <div className="hidden md:block">
            <span className="text-xs font-bold text-white block">Super Admin</span>
            <span className="text-[10px] text-gray-400 block">admin@thesocialscene.club</span>
          </div>
        </div>
      </div>
    </header>
  );
}
