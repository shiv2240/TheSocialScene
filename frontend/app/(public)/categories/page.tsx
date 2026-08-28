import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EventCard } from '@/components/event/EventCard';
import { createClient } from '@/lib/supabase/server';

type Category = { id: string; name: string; slug: string; display_order: number | null; is_active: boolean };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: events }] = await Promise.all([
    supabase.from('event_categories').select('id, name, slug, display_order, is_active').eq('is_active', true).order('display_order', { ascending: true }),
    supabase.from('events').select('*, category:event_categories(id, name, slug, display_order, is_active), venue:venues(id, name, slug, address, city, capacity)').eq('status', 'PUBLISHED').order('start_at', { ascending: true }),
  ]);
  const categoryList = (categories ?? []) as Category[];
  const publishedEvents = events ?? [];
  const eventsByCategory = new Map<string, typeof publishedEvents>();
  for (const event of publishedEvents) {
    if (!event.category_id || !categoryList.some(category => category.id === event.category_id)) continue;
    const current = eventsByCategory.get(event.category_id) ?? [];
    current.push(event);
    eventsByCategory.set(event.category_id, current);
  }

  return <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
    <Navbar />
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <section className="mb-10"><span className="text-xs uppercase tracking-widest font-bold text-[#c85a3c]">Explore</span><h1 className="text-3xl sm:text-5xl font-black text-white mt-1">Categories</h1><p className="text-sm text-gray-400 mt-2 max-w-2xl">Discover curated social experiences across The Social Scene.</p></section>
      {categoryList.length > 0 ? <section className="mb-16"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{categoryList.map(category => <Link key={category.id} href={`/categories/${category.slug}`} className="group glass-card rounded-3xl border border-white/10 p-6 hover:border-[#c85a3c]/50 hover:-translate-y-0.5 transition-all"><div className="w-11 h-11 rounded-2xl bg-[#c85a3c]/15 text-[#c85a3c] flex items-center justify-center mb-5"><Tag className="w-5 h-5" /></div><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-extrabold text-white group-hover:text-[#c85a3c] transition-colors">{category.name}</h2><ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#c85a3c] group-hover:translate-x-1 transition-all" /></div><p className="text-xs text-gray-500 mt-2">Explore this category</p></Link>)}</div></section> : <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center mb-16"><h2 className="text-xl font-bold text-white">No categories available</h2><p className="text-sm text-gray-400 mt-2">Categories will appear here once configured.</p></div>}
      <section className="space-y-14">{categoryList.map(category => { const categoryEvents = eventsByCategory.get(category.id) ?? []; const previewEvents = categoryEvents.slice(0, 3); return <section key={category.id}><div className="flex items-end justify-between gap-4 mb-5"><div><p className="text-xs uppercase tracking-widest font-bold text-[#c85a3c]">Category</p><h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{category.name}</h2></div>{categoryEvents.length > 0 && <Link href={`/categories/${category.slug}`} className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-[#c85a3c] hover:text-white transition-colors">View more <ArrowRight className="w-4 h-4" /></Link>}</div>{previewEvents.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">{previewEvents.map(event => <EventCard key={event.id} event={event} />)}</div> : <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"><p className="text-sm text-gray-400">No published events in this category yet.</p></div>}</section>; })}</section>
    </main><Footer />
  </div>;
}
