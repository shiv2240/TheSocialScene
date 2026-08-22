'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, CreditCard, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { AnalyticsService } from '@backend/services/analytics.service';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const chartData = AnalyticsService.getMockChartData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#c85a3c]" /> Performance & Growth Analytics
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Deep-dive telemetry into ticket sales, registration conversions, and host metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="dashboard-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white">Revenue Volume (₹)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242132" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1824', borderColor: '#332d3e', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#c85a3c" fill="#c85a3c" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-base font-bold text-white">Attendee Registrations Count</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242132" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1824', borderColor: '#332d3e', borderRadius: '12px' }} />
                <Bar dataKey="registrations" fill="#e59838" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
