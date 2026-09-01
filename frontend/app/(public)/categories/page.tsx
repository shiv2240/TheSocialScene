import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EventCard } from '@/components/event/EventCard';
import { getPublicCategories, getPublicCategoryEvents } from '@/lib/public-data';

type Category = { id: string; name: string; slug: string; display_order: number | null; is_active: boolean };
type PublishedEvent = (Awaited<ReturnType<typeof getPublicCategoryEvents>>)[number];

export const revalidate = 30;

export default async function CategoriesPage() {
  const [categories, events] = await Promise.all([
    getPublicCategories(),
    getPublicCategoryEvents(),
  ]);

  const categoryList = (categories ?? []) as Category[];
  const publishedEvents = (events ?? []) as PublishedEvent[];
  const eventsByCategory = new Map<string, PublishedEvent[]>();

  for (const event of publishedEvents) {
    if (!event.category_id || !categoryList.some(category => category.id === event.category_id)) continue;
    const current = eventsByCategory.get(event.category_id) ?? [];
    current.push(event);
    eventsByCategory.set(event.category_id, current);
  }

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <section className="mb-10">
          <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">● VIBES & STAGES</span>
          <h1 className="font-puffy text-4xl sm:text-7xl text-white uppercase mt-2">ALL CATEGORIES & <span className="text-[#cb4b31]">STAGES</span></h1>
          <p className="font-sans-clean text-sm sm:text-lg text-[#f4ebd9]/80 mt-2 max-w-xl font-semibold">Explore experiences tailored for every mood, from mountain treks to sunset runs and rooftop gigs.</p>
        </section>

        {categoryList.length > 0 ? (
          <section className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categoryList.map(category => (
                <Link key={category.id} href={`/categories/${category.slug}`} className="group bg-[#16151c] rounded-3xl border border-white/15 p-6 hover:bg-[#cb4b31] hover:text-white shadow-xl transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#e5a83b] text-[#0e0d12] flex items-center justify-center mb-4 border border-[#0e0d12] shadow-xs group-hover:rotate-6 transition-transform"><Tag className="w-6 h-6" /></div>
                  <div className="flex items-center justify-between gap-4"><h2 className="font-puffy text-2xl group-hover:text-white transition-colors text-white">{category.name}</h2><ArrowRight className="w-5 h-5 text-[#cb4b31] group-hover:text-white group-hover:translate-x-1 transition-all" /></div>
                  <p className="font-sans-clean text-xs font-bold text-[#f4ebd9]/60 group-hover:text-white/80 mt-2 uppercase tracking-wider">[ Explore Stage → ]</p>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-white/20 bg-[#16151c] p-12 text-center mb-16"><h2 className="font-puffy text-2xl text-white uppercase">No categories available</h2><p className="font-sans-clean text-xs text-[#f4ebd9]/70 mt-2 font-semibold">Categories will appear here once configured.</p></div>
        )}

        <section className="space-y-16">
          {categoryList.map(category => {
            const categoryEvents = eventsByCategory.get(category.id) ?? [];
            const previewEvents = categoryEvents.slice(0, 3);
            return (
              <section key={category.id}>
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div><span className="font-sans-clean text-[10px] text-[#cb4b31] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">● STAGE LINEUP</span><h2 className="font-puffy text-3xl sm:text-4xl text-white uppercase mt-2">{category.name}</h2></div>
                  {categoryEvents.length > 0 && <Link href={`/categories/${category.slug}`} className="shrink-0 inline-flex items-center gap-2 font-sans-clean text-xs font-extrabold text-white hover:text-[#cb4b31] uppercase tracking-wider transition-colors bg-[#16151c] px-4 py-2 rounded-full border border-white/20">[ View All ↗ ]</Link>}
                </div>
                {previewEvents.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">{previewEvents.map((event: PublishedEvent) => <EventCard key={event.id} event={event} />)}</div> : <div className="rounded-3xl border-2 border-dashed border-white/20 bg-[#16151c] p-8 text-center"><p className="font-sans-clean text-xs text-[#f4ebd9]/70 font-semibold">No published events in this stage yet.</p></div>}
              </section>
            );
          })}
        </section>
      </main>
      <Footer />
    </div>
  );
}