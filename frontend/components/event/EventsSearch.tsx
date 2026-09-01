'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';
import type { EventItem } from '@backend/types/database.types';

const CATEGORIES = [
  { name: 'All Gatherings', slug: 'all' },
  { name: 'Mountain Treks', slug: 'treks' },
  { name: 'Sunset Run Clubs', slug: 'fitness-wellness' },
  { name: 'Acoustic Gigs', slug: 'music-concerts' },
  { name: 'Tech Mixers', slug: 'tech-networking' },
  { name: 'Supper Clubs', slug: 'food-culinary' },
];

const DESKTOP_PAGE_SIZE = 9;
const MOBILE_PAGE_SIZE = 6;

interface EventsSearchProps {
  initialEvents: EventItem[];
  initialTotal: number;
}

function EventCardSkeleton() {
  return (
    <article className="bg-[#f7f0e3] rounded-2xl overflow-hidden border-2 border-[#1e1a14]/15 flex flex-col h-full animate-pulse">
      <div className="h-52 sm:h-60 bg-[#e0d5bc] border-b-2 border-[#1e1a14]/10" />
      <div className="p-5 space-y-4 flex-1">
        <div className="h-2.5 w-32 rounded bg-[#1e1a14]/10" />
        <div className="h-7 w-4/5 rounded bg-[#1e1a14]/10" />
        <div className="h-2.5 w-2/3 rounded bg-[#1e1a14]/10" />
        <div className="h-8 w-full rounded bg-[#1e1a14]/10 mt-6" />
      </div>
    </article>
  );
}

function EventGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" aria-label="Loading experiences">
      {Array.from({ length: count }, (_, index) => <EventCardSkeleton key={index} />)}
    </div>
  );
}

export function EventsSearch({ initialEvents, initialTotal }: EventsSearchProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<EventItem[]>(initialEvents);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DESKTOP_PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstRenderRef = useRef(true);

  const fetchResults = useCallback(async (q: string, cat: string, nextPage: number, size: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: String(size) });
      if (q.trim()) params.set('q', q.trim());
      if (cat !== 'all') params.set('category', cat);

      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('search failed');
      const body: unknown = await res.json();
      if (!body || typeof body !== 'object') throw new Error('invalid search response');
      const payload = body as { results?: EventItem[]; total?: number };
      setResults(payload.results ?? []);
      setTotal(Number(payload.total ?? 0));
      setPage(nextPage);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError('Unable to load experiences. Please try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const syncPageSize = () => {
      const nextSize = media.matches ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
      setPageSize(prev => {
        if (prev === nextSize) return prev;
        setPage(1);
        if (firstRenderRef.current) {
          setResults(initialEvents.slice(0, nextSize));
          setTotal(initialTotal);
        } else {
          void fetchResults(query, category, 1, nextSize);
        }
        return nextSize;
      });
    };
    syncPageSize();
    media.addEventListener('change', syncPageSize);
    return () => media.removeEventListener('change', syncPageSize);
  }, [category, fetchResults, initialEvents, initialTotal, query]);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      if (query || category !== 'all') void fetchResults(query, category, 1, pageSize);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchResults(query, category, 1, pageSize), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, category]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const clearSearch = () => {
    setQuery('');
    setCategory('all');
    setPage(1);
    setResults(initialEvents.slice(0, pageSize));
    setTotal(initialTotal);
    setError('');
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > Math.ceil(total / pageSize) || loading) return;
    void fetchResults(query, category, nextPage, pageSize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(total / pageSize);
  const isFiltered = query !== '' || category !== 'all';
  const skeletonCount = pageSize === MOBILE_PAGE_SIZE ? 6 : 9;

  return (
    <>
      <section className="bg-[#ede4d0] border-b-2 border-[#1e1a14] sticky top-14 sm:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-sm">
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
              {loading ? 'Loading experiences...' : `${total} experience${total !== 1 ? 's' : ''} ${isFiltered ? 'found' : 'available'}`}
            </p>
            <div className="flex items-center gap-3">
              {isFiltered && !loading && <button onClick={clearSearch} className="font-mono text-[9px] uppercase tracking-widest text-[#f7f0e3]/70 hover:text-[#f7f0e3] flex items-center gap-1 transition-colors"><X className="w-3 h-3" /> Clear</button>}
              <span className="font-mono text-[9px] text-[#f7f0e3]/80 uppercase tracking-widest font-bold">● updated daily</span>
            </div>
          </div>

          {loading ? (
            <EventGridSkeleton count={skeletonCount} />
          ) : error ? (
            <div className="border-2 border-dashed border-[#f7f0e3]/40 rounded-2xl p-10 sm:p-14 text-center">
              <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '2rem', color: '#f7f0e3', lineHeight: 1 }}>COULD NOT LOAD</div>
              <p className="font-body text-sm text-[#f7f0e3]/70 mt-3">{error}</p>
              <button onClick={() => void fetchResults(query, category, page, pageSize)} className="mt-5 px-6 py-2.5 rounded-full bg-[#f7f0e3] text-[#c93a2a] font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-[#f7f0e3]">Try Again</button>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {results.map(evt => <EventCard key={evt.id} event={evt} />)}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Event pagination" className="mt-10 flex items-center justify-center gap-2 sm:gap-3">
                  <button onClick={() => goToPage(page - 1)} disabled={page === 1 || loading} aria-label="Previous page" className="w-10 h-10 rounded-full border-2 border-[#f7f0e3] text-[#f7f0e3] flex items-center justify-center disabled:opacity-30 hover:bg-[#f7f0e3] hover:text-[#c93a2a] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNumber => (
                    <button key={pageNumber} onClick={() => goToPage(pageNumber)} aria-current={pageNumber === page ? 'page' : undefined} className={`w-10 h-10 rounded-full border-2 font-mono text-[10px] font-bold transition-colors ${pageNumber === page ? 'bg-[#f7f0e3] text-[#c93a2a] border-[#f7f0e3]' : 'border-[#f7f0e3]/50 text-[#f7f0e3] hover:border-[#f7f0e3] hover:bg-[#f7f0e3]/10'}`}>{pageNumber}</button>
                  ))}
                  <button onClick={() => goToPage(page + 1)} disabled={page === totalPages || loading} aria-label="Next page" className="w-10 h-10 rounded-full border-2 border-[#f7f0e3] text-[#f7f0e3] flex items-center justify-center disabled:opacity-30 hover:bg-[#f7f0e3] hover:text-[#c93a2a] transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </nav>
              )}
            </>
          ) : (
            <div className="border-2 border-dashed border-[#f7f0e3]/30 rounded-2xl p-14 text-center">
              <div style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', fontSize: '2rem', color: '#f7f0e3', lineHeight: 1 }}>{isFiltered ? 'No matches found' : 'No experiences yet'}</div>
              <p className="font-body text-sm text-[#f7f0e3]/70 mt-3 max-w-sm mx-auto">{isFiltered ? `Nothing matched "${query || CATEGORIES.find(c => c.slug === category)?.name}". Try a different search.` : 'Check back soon or host your own event.'}</p>
              {isFiltered && <button onClick={clearSearch} className="mt-5 px-6 py-2.5 rounded-full bg-[#f7f0e3] text-[#c93a2a] font-mono text-[11px] font-bold uppercase tracking-widest border-2 border-[#f7f0e3]">Clear Search</button>}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
