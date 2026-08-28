import React from 'react';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { DashboardHeader } from '../../components/layout/DashboardHeader';
import { DashboardRouteGuard } from '../../components/layout/DashboardRouteGuard';
import { requireDashboardAuth } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, roles } = await requireDashboardAuth();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex">
      <DashboardSidebar role={role} roles={roles} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto"><DashboardRouteGuard roles={roles}>{children}</DashboardRouteGuard></main>
      </div>
    </div>
  );
}
