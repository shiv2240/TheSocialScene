'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, PlusCircle, Users, QrCode, MapPin, Tag, CreditCard, BarChart3, ShieldCheck, FileText, Settings, UserCheck } from 'lucide-react';
import type { DashboardRole } from '@/lib/auth';

const navigationItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'CHECKIN_STAFF', 'EDITOR', 'FINANCE', 'SUPPORT'] },
  { name: 'All Events', href: '/events', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'EDITOR'] },
  { name: 'Create Event', href: '/events/create', icon: PlusCircle, roles: ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'EDITOR'] },
  { name: 'Check-in Scanner', href: '/scanner', icon: QrCode, roles: ['SUPER_ADMIN', 'ADMIN', 'HOST', 'CHECKIN_STAFF', 'EVENT_MANAGER'] },
  { name: 'Registrations', href: '/registrations', icon: UserCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'HOST', 'EVENT_MANAGER', 'SUPPORT'] },
  { name: 'Hosts', href: '/hosts', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Venues', href: '/venues', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
  { name: 'Categories', href: '/categories', icon: Tag, roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] },
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'HOST', 'FINANCE'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
] as const;

export function DashboardSidebar({ role }: { role: DashboardRole }) {
  const pathname = usePathname();
  const items = navigationItems.filter((item) => item.roles.some((allowedRole) => allowedRole === role));

  return (
    <aside className="w-64 bg-[#100f15] border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#c85a3c]/60 flex-shrink-0 bg-[#f5eedf] shadow-md"><img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" /></div>
        <div><span className="text-base font-black text-white tracking-tight block leading-none">Social Scene <span className="gradient-text">Admin</span></span><span className="text-[10px] uppercase font-extrabold text-[#e59838] tracking-wider block mt-1">{role === 'HOST' ? 'Host Portal' : 'Operations'}</span></div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-800">
        {items.map((item) => { const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)); const Icon = item.icon; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${isActive ? 'gradient-terracotta text-white shadow-lg shadow-[#c85a3c]/25' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} /><span>{item.name}</span></Link>; })}
      </nav>
      <div className="p-4 border-t border-white/10"><div className="dashboard-card p-3.5 rounded-2xl border border-white/10 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-[#c85a3c]/20 border border-[#c85a3c]/40 flex items-center justify-center text-[#c85a3c] font-black text-xs">{role === 'HOST' ? 'H' : role.slice(0, 2)}</div><div className="truncate"><span className="text-xs font-black text-white block truncate">{role.replaceAll('_', ' ')}</span><span className="text-[10px] text-emerald-400 font-semibold block flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> RBAC Active</span></div></div></div>
    </aside>
  );
}
