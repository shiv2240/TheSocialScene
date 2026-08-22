'use client';

import React from 'react';
import { MapPin, PlusCircle, Search, Globe } from 'lucide-react';

export default function VenuesPage() {
  const venues = [
    { id: 'v-1', name: 'The Social House Indiranagar', city: 'Bengaluru', capacity: 250, address: '100ft Road, Indiranagar' },
    { id: 'v-2', name: 'Koramangala Social Studio', city: 'Bengaluru', capacity: 180, address: '80ft Road, Koramangala' },
    { id: 'v-3', name: 'Cyber Hub Amphitheatre', city: 'Gurugram', capacity: 400, address: 'DLF Cyber City' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#e59838]" /> Partner Venues & Locations
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure partner venue profiles, capacity limits, and Google Maps links.
          </p>
        </div>

        <button className="px-5 py-2.5 rounded-2xl gradient-terracotta text-xs font-bold text-white shadow-lg flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add Partner Venue
        </button>
      </div>

      <div className="dashboard-card rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/90 text-gray-400 text-[11px] uppercase border-b border-white/10">
              <th className="p-4">Venue Name</th>
              <th className="p-4">City</th>
              <th className="p-4">Address</th>
              <th className="p-4">Max Capacity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {venues.map((v) => (
              <tr key={v.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{v.name}</td>
                <td className="p-4 text-[#e59838] font-semibold">{v.city}</td>
                <td className="p-4 text-gray-300">{v.address}</td>
                <td className="p-4 font-bold text-white">{v.capacity} Seats</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
