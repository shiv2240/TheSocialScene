'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';

const CATEGORIES = [
  { name: 'All Gatherings', slug: 'all' },
  { name: 'Mountain Treks', slug: 'treks' },
  { name: 'Sunset Run Clubs', slug: 'fitness-wellness' },
  { name: 'Acoustic Gigs', slug: 'music-concerts' },
  { name: 'Tech Mixers', slug: 'tech-networking' },
  { name: 'Supper Clubs', slug: 'food-culinary' },
];

interface EventsSearchProps { initialEvents: any[]; }

export function EventsSearch({ initialEvents }: EventsSearchProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<any[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (cat !== 'all') params.set('category', cat);
      const res = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('search failed');
      const body = await res.json();
      setResults(body.results ?? []);
    } catch {
      // Keep the current results on transient network errors.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchResults(query, category), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, category, fetchResults]);

  const clearSearch = () => {
    setQuery('');
    setCategory('all');
    setResults(initialEvents);
  };

  const isFiltered = query !== '' || category !== 'all';

  return (
    <>
      <section className="bg-[#ede4d0] border-b-2 border-[#1e1a14] sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="events-search-icon w-4 h-4 text-[#c93a2a] absolute top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title, tag, vibe, or venue..."
              className="retro-input events-search-field py-2.5 text-xs"
              aria-label="Search events by title, tag, vibe, or venue"
            />
            {query && (
              <button onClick={clearSearch} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1e1a14]/40 hover:text-[#c93a2a] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0 w-full sm:w-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setCategory(cat.slug)}
                className={`whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full border-2 transition-all ${category === cat.slug ? 'bg-[#c93a2a] text-[#f7f0e3] border-[#c93a2a]' : 'bg-transparent text-[#1e1a14] border-[#1e1a14] hover:bg-[#1e1a14] hover:text-[#f7f0e3]'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#c93a2a] px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative grain">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline justify-between mb-6 sm:mb-8 gap-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#f7f0e3]/60 flex items-center gap-2">
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              {loading ? 'Searching...' : `${results.length} experience${results.length !== 1 ? 's' : ''} ${isFiltered ? 'found' : 'available'}`}
            </p>
            <div className="flex items-center gap-3">
              {isFiltered && !loading && <button onClick={clearSearch} className="font-mono text-[9px] uppercase tracking-widest text-[#f7f0e3]/70 hover:text-[#f7f0e3] flex items-center gap-1 transition-colors"><X className="w-3 h-3" /> Clear</button>}
              <span className="font-mono text-[9px] text-[#f7f0e3]/80 uppercase tracking-widest font-bold">● updated daily</span>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {results.map(evt => <EventCard key={evt.id} event={evt} />)}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#f7f0e3]/30 rounded-2xl p-14 text-center">
              <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '2rem', color: '#f7f0e3', lineHeight: 1 }}>{isFiltered ? 'No matches found' : 'No experiences yet'}</div>
              <p className="font-body text-sm text-[#f7f0e3]/70 mt-3 max-w-sm mx-auto">{isFiltered ? `Nothing matched "${query || CATEGORIES.find(c => c.slug === category)?.name}". Try a different search.` : 'Check back soon or host your own event.'}</p>
              {isFiltered && <button onClick={clearSearch} className="mt-5 px-6 py-2.5 rounded-full bg-[#f7f0e3] text-[#c93a2a] font-mono text-[11px] font-bold uppercase tracking-widest hover:bg-[#d4963a] hover:text-[#1e1a14] transition-colors border-2 border-[#f7f0e3]">Clear Search</button>}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
