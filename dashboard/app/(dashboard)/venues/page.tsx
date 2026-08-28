'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Loader2, MapPin, PlusCircle, RefreshCw, Search } from 'lucide-react';

type Venue = {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  created_at: string;
  updated_at: string;
};

type VenuesResponse = {
  venues?: Venue[];
  error?: string;
};

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadVenues = async (showRefreshState = false) => {
    if (showRefreshState) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/venues', { cache: 'no-store' });
      const body = (await response.json().catch(() => ({}))) as VenuesResponse;
      if (!response.ok) throw new Error(body.error || 'Unable to load venues.');
      setVenues(Array.isArray(body.venues) ? body.venues : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load venues.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadVenues();
  }, []);

  const filteredVenues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return venues;
    return venues.filter((venue) =>
      [venue.name, venue.city, venue.address].some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchTerm, venues]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white">
            <MapPin className="h-6 w-6 text-[#e59838]" /> Partner Venues & Locations
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            Configure partner venue profiles, capacity limits, and Google Maps links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadVenues(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-gray-900 px-4 py-2.5 text-xs font-bold text-gray-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh venues"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-lg gradient-terracotta"
          >
            <PlusCircle className="h-4 w-4" /> Add Partner Venue
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search venues, cities or addresses..."
            className="w-full rounded-xl border border-white/10 bg-gray-900/70 py-2.5 pl-9 pr-3 text-xs text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#c85a3c]/50"
          />
        </div>
        {!loading && !error && (
          <p className="text-xs text-gray-500">
            {filteredVenues.length} {filteredVenues.length === 1 ? 'venue' : 'venues'}
            {searchTerm.trim() ? ' found' : ' configured'}
          </p>
        )}
      </div>

      <div className="dashboard-card overflow-hidden rounded-2xl border border-white/10">
        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Loading venues...
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-bold text-red-300">Unable to load venues</p>
            <p className="mt-1 text-xs text-gray-500">{error}</p>
            <button
              type="button"
              onClick={() => void loadVenues(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-gray-900 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MapPin className="mx-auto mb-3 h-6 w-6 text-gray-600" />
            <p className="text-sm font-bold text-gray-300">
              {searchTerm.trim() ? 'No venues match your search.' : 'No venues configured yet.'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {searchTerm.trim() ? 'Try a different venue, city, or address.' : 'Add a venue to make it available for event creation.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-gray-900/90 text-[11px] uppercase text-gray-400">
                  <th className="p-4">Venue Name</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Max Capacity</th>
                  <th className="p-4">Maps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredVenues.map((venue) => (
                  <tr key={venue.id} className="transition-colors hover:bg-white/5">
                    <td className="p-4 font-bold text-white">{venue.name}</td>
                    <td className="p-4 font-semibold text-[#e59838]">{venue.city}</td>
                    <td className="p-4 text-gray-300">{venue.address}</td>
                    <td className="p-4 font-bold text-white">{venue.capacity.toLocaleString('en-IN')} Seats</td>
                    <td className="p-4">
                      {venue.google_maps_url ? (
                        <a
                          href={venue.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-gray-400 transition-colors hover:text-[#e59838]"
                          aria-label={`Open ${venue.name} in Google Maps`}
                        >
                          <Globe className="h-4 w-4" /> Open
                        </a>
                      ) : (
                        <span className="text-gray-600">Not linked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
