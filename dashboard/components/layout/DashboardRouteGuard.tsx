'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { DashboardRole } from '@/lib/auth';

const ROUTE_ACCESS: Record<DashboardRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['*'],
  HOST: ['/', '/events', '/events/create', '/registrations', '/analytics', '/scanner'],
  EVENT_MANAGER: ['/', '/events', '/events/create', '/registrations', '/analytics', '/scanner'],
  CHECKIN_STAFF: ['/', '/scanner'],
  EDITOR: ['/', '/events', '/events/create', '/categories', '/venues'],
  FINANCE: ['/', '/payments', '/analytics'],
  SUPPORT: ['/', '/registrations'],
};

function matches(pathname: string, route: string) {
  if (route === '*') return true;
  if (route === '/') return pathname === '/';
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function DashboardRouteGuard({ role, children }: { role: DashboardRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const allowed = ROUTE_ACCESS[role].some((route) => matches(pathname, route));

  React.useEffect(() => {
    if (!allowed) router.replace('/unauthorized');
  }, [allowed, router]);

  if (!allowed) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-500">Redirecting to an allowed dashboard area…</div>;
  }

  return <>{children}</>;
}
