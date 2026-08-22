import React from 'react';
import Link from 'next/link';
import { Tag, ArrowLeft, Sparkles, Filter } from 'lucide-react';
import { EventService } from '@backend/services/event.service';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryEventsPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const events = EventService.getMockEvents();

  const formattedCategoryName = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#c85a3c] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Events
        </Link>

        {/* Category Header */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 mb-10 relative overflow-hidden">
          <div className="ambient-brand-glow top-0 right-0" />
          <div className="relative z-10 space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#c85a3c]/20 text-[#c85a3c] inline-block uppercase tracking-wider">
              Category
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {formattedCategoryName}
            </h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Curated experiences and community gatherings tagged under {formattedCategoryName}.
            </p>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {events.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
