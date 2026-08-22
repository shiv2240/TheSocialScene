'use client';

import React from 'react';
import { Tag, PlusCircle, Sparkles } from 'lucide-react';

export default function CategoriesPage() {
  const categories = [
    { id: 'c-1', name: 'Outdoor Treks', slug: 'treks', count: 18 },
    { id: 'c-2', name: 'Music & Concerts', slug: 'music-concerts', count: 24 },
    { id: 'c-3', name: 'Fitness & Wellness', slug: 'fitness-wellness', count: 15 },
    { id: 'c-4', name: 'Tech & Networking', slug: 'tech-networking', count: 32 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-[#c85a3c]" /> Event Categories
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Organize experience categories, icons, and slug routing.
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10">
              <th className="p-4">Category Name</th>
              <th className="p-4">URL Slug</th>
              <th className="p-4">Active Events</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{c.name}</td>
                <td className="p-4 font-mono text-[#c85a3c]">/{c.slug}</td>
                <td className="p-4 font-bold text-white">{c.count} Events</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
