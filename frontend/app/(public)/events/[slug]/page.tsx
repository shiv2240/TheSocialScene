import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Heart, ArrowLeft, ShieldCheck, Sparkles, CheckCircle2, Ticket, Share2 } from 'lucide-react';
import { EventService } from '@backend/services/event.service';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface EventDetailsProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: EventDetailsProps) {
  const { slug } = await params;
  const events = EventService.getMockEvents();
  const event = events.find((e) => e.slug === slug) || events[0];

  const spotsRemaining = Math.max(0, event.capacity - event.registered_count);
  const isSoldOut = spotsRemaining === 0 || !event.registration_open;

  return (
    <div className="min-h-screen bg-[#121118] text-gray-100 flex flex-col selection:bg-[#ff573d] selection:text-white">
      <Navbar />

      <main className="flex-1 pb-24">
        {/* Full-bleed Cover Hero (Inspired by Image 1 & 2) */}
        <div className="relative h-80 sm:h-[420px] w-full overflow-hidden bg-[#181622]">
          <img
            src={event.cover_image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-black/40 to-black/20" />

          {/* Floating Back & Favorite Controls */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 absolute top-6 left-0 right-0 flex items-center justify-between z-20">
            <Link
              href="/events"
              className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors border border-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <button className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:text-[#ff573d] hover:bg-black/70 transition-colors border border-white/20">
              <Heart className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Floating Card Overlay Container (Directly modeled after Evenfonic & Justice Tour reference designs) */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
          <div className="light-card-overlay p-8 sm:p-10 space-y-8">
            {/* Title & Price Pill Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6">
              <div className="space-y-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#ff573d]/15 text-[#ff573d] inline-block uppercase tracking-wider">
                  {event.category?.name || 'Social Gathering'}
                </span>
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                  {event.title}
                </h1>
              </div>

              {/* Price Pill Tag */}
              <div className="px-6 py-2.5 rounded-full gradient-coral text-white font-black text-xl shadow-xl shadow-[#ff573d]/25 text-center self-start">
                {formatCurrency(event.price, event.currency)}
              </div>
            </div>

            {/* Attendee Avatar Stack (As seen in Reference Image 1) */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-3">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="Attendee"
                    className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt="Attendee"
                    className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80"
                    alt="Attendee"
                    className="w-9 h-9 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-gray-900 block">
                    {event.registered_count} People Joined
                  </span>
                  <span className="text-xs font-semibold text-[#ff573d] block">
                    Only {spotsRemaining} seats left
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">
                Verified RSVPs
              </span>
            </div>

            {/* Description Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold text-gray-900">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Event Location Card with Soft Orange Icon (Image 1 Style) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-[#ff573d]/15 text-[#ff573d] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Venue Location
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 block">
                    {event.venue?.name || 'Social House Studio'}
                  </span>
                  <span className="text-xs font-medium text-gray-500 block mt-0.5">
                    {event.venue?.address}, {event.venue?.city}
                  </span>
                </div>
              </div>

              {/* Date & Time Card with Soft Amber Icon (Image 1 Style) */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-[#ffaa00]/15 text-[#ffaa00] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Date & Schedule
                  </span>
                  <span className="text-sm font-extrabold text-gray-900 block">
                    {formatDate(event.start_at)}
                  </span>
                  <span className="text-xs font-medium text-gray-500 block mt-0.5">
                    {formatTime(event.start_at)} - {formatTime(event.end_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Host Details */}
            {event.host && (
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <img
                  src={event.host.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={event.host.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#ff573d]"
                />
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase block">Host</span>
                  <span className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                    {event.host.full_name}
                    <CheckCircle2 className="w-4 h-4 text-[#ff573d]" />
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Dark Pill CTA Button (Directly modeled after Evenfonic "Buy Ticket $100" button in Image 1) */}
            <div className="pt-4">
              {isSoldOut ? (
                <button
                  disabled
                  className="w-full py-4 rounded-full bg-gray-200 text-gray-500 font-extrabold text-base cursor-not-allowed"
                >
                  Event Sold Out
                </button>
              ) : (
                <Link
                  href={`/login?redirect=/events/${event.slug}`}
                  className="w-full py-4 rounded-full bg-[#121118] text-white font-extrabold text-base hover:bg-[#ff573d] shadow-2xl transition-all flex items-center justify-center gap-3 group"
                >
                  <Ticket className="w-5 h-5 text-[#ff573d] group-hover:text-white transition-colors" />
                  <span>Buy Ticket {formatCurrency(event.price, event.currency)}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
