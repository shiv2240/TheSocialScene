import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowLeft, Globe, Users, ExternalLink } from 'lucide-react';
import { EventService } from '@backend/services/event.service';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface VenuePageProps {
  params: Promise<{ slug: string }>;
}

export default async function VenueDetailPage({ params }: VenuePageProps) {
  const { slug } = await params;
  const events = EventService.getMockEvents();
  const sampleVenue = events[0].venue;

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#c85a3c] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        {/* Venue Banner */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 mb-10 space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e59838]/20 text-[#e59838] inline-block uppercase">
            Partner Venue
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            {sampleVenue?.name || 'The Social House Studio'}
          </h1>
          <p className="text-sm text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#c85a3c]" />
            {sampleVenue?.address}, {sampleVenue?.city}
          </p>

          <div className="pt-2 flex items-center gap-4">
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl gradient-terracotta text-xs font-bold text-white flex items-center gap-2"
            >
              Open in Google Maps
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Venue Events Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Upcoming Events at This Venue</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
