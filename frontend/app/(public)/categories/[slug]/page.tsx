import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryEventsPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('event_categories')
    .select('id, name, slug, display_order')
    .eq('slug', slug)
    .maybeSingle();

  if (!category) {
    return null;
  }

  const { data: events } = await supabase
    .from('events')
    .select('*, category:event_categories(id, name, slug, display_order), venue:venues(id, name, slug, address, city, capacity)')
    .eq('status', 'PUBLISHED')
    .eq('category_id', category.id)
    .order('start_at', { ascending: true });

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#c85a3c] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Categories
        </Link>

        <div className="glass-card p-8 rounded-3xl border border-white/10 mb-10 relative overflow-hidden">
          <div className="ambient-brand-glow top-0 right-0" />
          <div className="relative z-10 space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#c85a3c]/20 text-[#c85a3c] inline-block uppercase tracking-wider">
              Category
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {category.name}
            </h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Published experiences and community gatherings tagged under {category.name}.
            </p>
          </div>
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <h2 className="text-xl font-bold text-white">No published events in this category</h2>
            <p className="text-sm text-gray-400 mt-2">Events created and published by hosts will appear here.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
