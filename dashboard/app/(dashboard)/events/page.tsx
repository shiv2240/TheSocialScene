'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Calendar, Users, Eye, Edit, CheckCircle, Globe, Filter } from 'lucide-react';
import { EventService } from '@backend/services/event.service';
import { EventItem } from '@backend/types/database.types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AllEventsPage() {
  const [events, setEvents] = useState<EventItem[]>(EventService.getMockEvents());
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((e) => {
    const matchesTab = activeTab === 'ALL' || e.status === activeTab;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.slug.includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const togglePublish = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const nextStatus = e.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
          return { ...e, status: nextStatus };
        }
        return e;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Event Management</h1>
          <p className="text-xs text-gray-400 mt-1">
            Create, edit, publish, and archive social events. Published events appear immediately on the public site.
          </p>
        </div>

        <Link
          href="/events/create"
          className="px-5 py-2.5 rounded-xl gradient-bg text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:opacity-90 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create Event Wizard
        </Link>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-2 border-b border-gray-800">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'COMPLETED', 'ARCHIVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'gradient-bg text-white shadow-md'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {tab === 'ALL' ? 'All Events' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="dashboard-card rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-800">
                <th className="p-4">Event Info</th>
                <th className="p-4">Category & Venue</th>
                <th className="p-4">Schedule</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-gray-900/40 transition-colors">
                  {/* Event Title & Cover */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={evt.cover_image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=100&q=80'}
                        alt={evt.title}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-800"
                      />
                      <div>
                        <span className="font-bold text-white block line-clamp-1">{evt.title}</span>
                        <span className="text-[10px] text-purple-400 font-mono">/{evt.slug}</span>
                      </div>
                    </div>
                  </td>

                  {/* Category & Venue */}
                  <td className="p-4 text-gray-300">
                    <span className="font-medium text-white block">{evt.category?.name || 'Uncategorized'}</span>
                    <span className="text-[10px] text-gray-400 block">{evt.venue?.name}</span>
                  </td>

                  {/* Schedule */}
                  <td className="p-4 text-gray-300">
                    <span className="block font-medium">{formatDate(evt.start_at)}</span>
                  </td>

                  {/* Capacity */}
                  <td className="p-4">
                    <div className="space-y-1">
                      <span className="font-bold text-white block">
                        {evt.registered_count} / {evt.capacity}
                      </span>
                      <div className="w-20 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full gradient-bg"
                          style={{ width: `${(evt.registered_count / evt.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="p-4 font-bold text-white">
                    {formatCurrency(evt.price, evt.currency)}
                  </td>

                  {/* Status Badge */}
                  <td className="p-4">
                    <button
                      onClick={() => togglePublish(evt.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                        evt.status === 'PUBLISHED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900'
                      }`}
                    >
                      {evt.status}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`https://thesocialscene.club/events/${evt.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
                        title="Preview Public Page"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <Link
                        href={`/events/${evt.id}`}
                        className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
                        title="Edit Event"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
