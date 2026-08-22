import React from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function EventDiscoveryPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('*, category:event_categories(id, name, slug, display_order), venue:venues(id, name, slug, address, city, capacity)')
    .eq('status', 'PUBLISHED')
    .order('start_at', { ascending: true });

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-10 text-center md:text-left"><span className="text-xs uppercase tracking-widest font-bold text-purple-400">Curated Gatherings</span><h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">Discover <span className="gradient-text">Events</span></h1><p className="text-sm text-gray-400 mt-2 max-w-xl">Find experiences published by The Social Scene hosts.</p></div>
        <div className="glass-card p-4 rounded-2xl border border-gray-800 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1"><Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Search events..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" /></div>
          <div className="flex flex-wrap items-center gap-3"><select className="px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-xs font-medium text-gray-300 outline-none"><option>All Categories</option><option>Music & Concerts</option><option>Fitness & Wellness</option><option>Tech & Networking</option><option>Food & Culinary</option></select><select className="px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-xs font-medium text-gray-300 outline-none"><option>All Cities</option><option>Bengaluru</option><option>Gurugram</option><option>Mumbai</option></select></div>
        </div>
        {events && events.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">{events.map((evt) => <EventCard key={evt.id} event={evt} />)}</div> : <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center"><h2 className="text-xl font-bold text-white">No published events yet</h2><p className="text-sm text-gray-400 mt-2">Check back soon for the next Social Scene experience.</p><Link href="/" className="inline-flex mt-6 items-center gap-2 px-5 py-3 rounded-2xl gradient-terracotta text-xs font-extrabold text-white">Back Home<ArrowRight className="w-4 h-4" /></Link></div>}
      </main>
      <Footer />
    </div>
  );
}
