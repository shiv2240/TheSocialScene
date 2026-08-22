'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  CreditCard,
  QrCode,
  TrendingUp,
  PlusCircle,
  Sparkles,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AnalyticsService } from '@backend/services/analytics.service';
import { EventService } from '@backend/services/event.service';
import { formatCurrency } from '@/lib/utils';

export default function DashboardOverviewPage() {
  const kpis = AnalyticsService.getMockKpis();
  const chartData = AnalyticsService.getMockChartData();
  const recentEvents = EventService.getMockEvents();

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Operations Overview</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time analytics for events, revenue, attendee registrations, and QR check-ins.
          </p>
        </div>

        <Link
          href="/events/create"
          className="px-5 py-2.5 rounded-xl gradient-bg text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Event
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="dashboard-card p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Total Revenue</span>
            <div className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              {formatCurrency(kpis.totalRevenue)}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +18.4% from last week
            </span>
          </div>
        </div>

        <div className="dashboard-card p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Registrations</span>
            <div className="p-2 rounded-xl bg-pink-950/80 text-pink-400 border border-pink-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              {kpis.totalRegistrations}
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +38 today
            </span>
          </div>
        </div>

        <div className="dashboard-card p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Today's Check-ins</span>
            <div className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              {kpis.todayCheckins}
            </span>
            <span className="text-[11px] text-purple-400 font-semibold block mt-1">
              Live QR Scanner Active
            </span>
          </div>
        </div>

        <div className="dashboard-card p-5 rounded-2xl border border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Active Events</span>
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-500/30">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-white block">
              {kpis.upcomingEvents}
            </span>
            <span className="text-[11px] text-gray-400 font-semibold block mt-1">
              {kpis.totalEvents} total created
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Chart & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Growth Chart */}
        <div className="lg:col-span-2 dashboard-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Weekly Revenue & Registration Volume</h2>
              <p className="text-xs text-gray-400">Aggregated performance across public event listings</p>
            </div>
            <span className="text-xs font-mono text-purple-400 px-3 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30">
              INR (₹)
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Recent Events Panel */}
        <div className="lg:col-span-1 dashboard-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Recent Events</h2>
            <Link href="/events" className="text-xs font-semibold text-purple-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between gap-3"
              >
                <div className="truncate">
                  <h4 className="text-xs font-bold text-white truncate">{evt.title}</h4>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    {evt.registered_count}/{evt.capacity} Attendees
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    evt.status === 'PUBLISHED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
