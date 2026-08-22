'use client';

import React from 'react';
import { Settings, Save, Globe, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#c85a3c]" /> Platform Settings
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure domain routing, default currencies, and system parameters.
        </p>
      </div>

      <div className="dashboard-card p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase block">Public Domain</label>
          <input
            type="text"
            defaultValue="https://thesocialscene.club"
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-white/10 text-xs font-mono text-white outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase block">Admin Dashboard Domain</label>
          <input
            type="text"
            defaultValue="https://admin.thesocialscene.club"
            className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-white/10 text-xs font-mono text-white outline-none"
          />
        </div>

        <button className="px-6 py-3 rounded-2xl gradient-terracotta text-xs font-extrabold text-white shadow-lg flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Platform Configuration
        </button>
      </div>
    </div>
  );
}
