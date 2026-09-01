import Link from 'next/link';
import { Calendar, MapPin, ArrowLeft, CheckCircle2, Ticket, Users, Sparkles, Flame, ShieldCheck, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WishlistButton } from '@/components/events/WishlistButton';
import { createClient } from '@/lib/supabase/server';

interface EventDetailsProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: EventDetailsProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from('events')
    .select('*, category:event_categories(id, name, slug), venue:venues(id, name, address, city, google_maps_url)')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (!event) notFound();

  const spotsRemaining = Math.max(0, event.capacity - event.registered_count);
  const isSoldOut = spotsRemaining === 0 || !event.registration_open;

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 lg:pb-0">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Back Link & Wishlist */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/events"
            className="px-5 py-2.5 rounded-full bg-[#16151c] border border-white/20 text-[#f4ebd9] hover:bg-[#cb4b31] hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-sans-clean shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#cb4b31] group-hover:text-white" />
            <span>[ Discover Gatherings ]</span>
          </Link>
          <WishlistButton eventId={event.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Details (Left Column) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Hero Cover Image */}
            <div className="relative w-full h-[360px] sm:h-[460px] rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-[#16151c]">
              {event.cover_image ? (
                <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#16151c] flex items-center justify-center text-xs font-bold text-white/40 font-sans-clean">
                  [ NO COVER IMAGE ]
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d12]/90 via-[#0e0d12]/30 to-transparent" />

              {/* Category & Title Overlaid on Cover */}
              <div className="absolute bottom-6 left-6 right-6 z-10 space-y-3 text-white">
                <div className="flex flex-wrap gap-2">
                  {event.category && (
                    <span className="px-3.5 py-1.5 rounded-full bg-[#16151c]/90 backdrop-blur-md text-white font-sans-clean font-extrabold text-[10px] tracking-wider uppercase shadow-md border border-white/20">
                      ● {event.category.name}
                    </span>
                  )}
                  <span className="px-3.5 py-1.5 rounded-full bg-[#cb4b31] text-white font-sans-clean font-extrabold text-[10px] tracking-wider uppercase shadow-md border border-white/20">
                    ★ Verified Host
                  </span>
                </div>

                <h1 className="font-puffy text-3xl sm:text-5xl text-white leading-tight drop-shadow-md">
                  {event.title}
                </h1>
              </div>
            </div>

            {/* Event Specs Card */}
            <div className="bg-[#16151c] rounded-3xl p-6 sm:p-8 border border-white/15 shadow-xl space-y-6">
              <p className="font-sans-clean text-sm sm:text-base text-[#f4ebd9]/90 leading-relaxed font-semibold">
                {event.short_description || event.description}
              </p>

              {/* Schedule & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="flex items-start gap-3 min-w-0 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-[#cb4b31] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 block uppercase tracking-wider font-sans-clean">
                      Date & Schedule
                    </span>
                    <span className="font-sans-clean text-xs sm:text-sm font-extrabold text-white block mt-0.5" suppressHydrationWarning>
                      {formatDate(event.start_at)}
                    </span>
                    <span className="font-sans-clean text-xs text-[#f4ebd9]/70 block font-semibold" suppressHydrationWarning>
                      {formatTime(event.start_at)} - {formatTime(event.end_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 min-w-0 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-[#e5a83b] text-[#0e0d12] flex items-center justify-center shrink-0 shadow-xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 block uppercase tracking-wider font-sans-clean">
                      Venue Location
                    </span>
                    <span className="font-sans-clean text-xs sm:text-sm font-extrabold text-white block mt-0.5 break-words">
                      {event.venue?.name || 'Venue TBA'}
                    </span>
                    {event.venue?.address || event.venue?.city ? (
                      <span className="font-sans-clean text-xs text-[#f4ebd9]/70 block break-words whitespace-normal font-medium mt-0.5">
                        {event.venue?.address || ''}{event.venue?.address && event.venue?.city ? ', ' : ''}{event.venue?.city || ''}
                      </span>
                    ) : null}
                    {event.venue?.google_maps_url ? (
                      <a
                        href={event.venue.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-[#cb4b31]/15 border border-[#cb4b31]/40 text-[#ff7658] hover:bg-[#cb4b31] hover:text-white transition-colors text-[10px] font-extrabold uppercase tracking-wider font-sans-clean"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span>Open in Google Maps</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Flow */}
            <div className="bg-[#16151c] rounded-3xl p-6 sm:p-8 border border-white/15 shadow-xl space-y-6">
              <div>
                <span className="font-sans-clean text-[10px] text-[#cb4b31] uppercase font-extrabold tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">
                  ● THE FLOW
                </span>
                <h2 className="font-puffy text-2xl sm:text-3xl text-white uppercase mt-2">
                  EVENT SCHEDULE
                </h2>
              </div>
              <div className="relative pl-6 border-l-2 border-[#cb4b31] space-y-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#cb4b31] border-2 border-white shadow-xs" />
                  <h3 className="font-puffy text-xl text-white">Arrival & Welcome</h3>
                  <p className="text-[11px] font-extrabold text-[#e5a83b] uppercase font-sans-clean mt-0.5" suppressHydrationWarning>
                    {formatTime(event.start_at)} • Check-in & Icebreaker
                  </p>
                  <p className="font-sans-clean text-xs text-[#f4ebd9]/80 mt-1 font-semibold">
                    Show QR pass, meet fellow explorers, and grab refreshments.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#e5a83b] border-2 border-white shadow-xs" />
                  <h3 className="font-puffy text-xl text-white">Main Gathering</h3>
                  <p className="text-[11px] font-extrabold text-[#e5a83b] uppercase font-sans-clean mt-0.5">
                    Core Experience
                  </p>
                  <p className="font-sans-clean text-xs text-[#f4ebd9]/80 mt-1 font-semibold">
                    Guided group activity, trek trail, music performance, or supper session.
                  </p>
                </div>
              </div>
            </div>

            {/* Vibe Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#16151c] rounded-3xl p-6 border border-white/15 shadow-sm space-y-2">
                <Users className="w-6 h-6 text-[#cb4b31]" />
                <h4 className="font-puffy text-lg text-white uppercase">
                  WHO IS THIS FOR?
                </h4>
                <p className="font-sans-clean text-xs text-[#f4ebd9]/80 leading-relaxed font-semibold">
                  Curious individuals seeking authentic human connection, great vibes, and memorable stories.
                </p>
              </div>

              <div className="bg-[#16151c] rounded-3xl p-6 border border-white/15 shadow-sm space-y-2">
                <Sparkles className="w-6 h-6 text-[#e5a83b]" />
                <h4 className="font-puffy text-lg text-white uppercase">
                  COME SOLO
                </h4>
                <p className="font-sans-clean text-xs text-[#f4ebd9]/80 leading-relaxed font-semibold">
                  Highly encouraged! Over 70% of attendees arrive solo and leave with new connections.
                </p>
              </div>
            </div>

            {/* Full Description */}
            <div className="bg-[#16151c] rounded-3xl p-6 sm:p-8 border border-white/15 shadow-xl space-y-4">
              <h3 className="font-puffy text-2xl text-white uppercase">
                ABOUT THIS GATHERING
              </h3>
              <div className="font-sans-clean text-xs sm:text-sm text-[#f4ebd9]/90 leading-relaxed whitespace-pre-line font-semibold">
                {event.description}
              </div>
            </div>
          </div>

          {/* Sticky Booking Card */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="sticky top-24 bg-[#16151c] rounded-3xl p-8 border border-white/20 shadow-2xl space-y-6">
              <div className="flex justify-between items-start pb-6 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 uppercase tracking-wider font-sans-clean block">
                    Pass Price
                  </span>
                  <span className="font-puffy text-4xl text-white block mt-1" suppressHydrationWarning>
                    {formatCurrency(event.price, event.currency)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-[#f4ebd9]/60 uppercase tracking-wider font-sans-clean block">
                    Live Status
                  </span>
                  <span className={`text-xs font-extrabold uppercase tracking-wider block mt-1 font-sans-clean ${isSoldOut ? 'text-red-400' : 'text-[#cb4b31]'}`}>
                    {isSoldOut ? '[ SOLD OUT ]' : `[ ${spotsRemaining} SPOTS LEFT ]`}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs font-sans-clean text-[#f4ebd9] font-semibold">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#cb4b31]" />
                    <span>Registered Attendees</span>
                  </span>
                  <span className="font-extrabold text-white">{event.registered_count} Going</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verified Community</span>
                  </span>
                  <span className="font-extrabold text-white">Protected Pass</span>
                </div>
              </div>

              {isSoldOut ? (
                <button
                  disabled
                  className="w-full py-4 rounded-full bg-white/10 text-white/40 font-sans-clean text-xs font-bold tracking-wider uppercase cursor-not-allowed border border-white/10"
                >
                  Registration Closed
                </button>
              ) : (
                <Link
                  href={`/checkout?event=${encodeURIComponent(event.slug)}`}
                  className="w-full py-4 rounded-full bg-[#cb4b31] hover:bg-[#e05338] text-white font-sans-clean text-xs font-extrabold tracking-wider uppercase shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/20"
                >
                  <Ticket className="w-4 h-4" />
                  <span suppressHydrationWarning>Reserve Pass • {formatCurrency(event.price, event.currency)}</span>
                </Link>
              )}

              <p className="text-center text-[11px] text-[#f4ebd9]/60 font-sans-clean font-semibold">
                Instant digital QR pass delivered after checkout
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Mobile Booking Bar */}
      <div className="fixed bottom-0 left-0 w-full lg:hidden glass-retro-bottom border-t border-white/20 p-4 pb-safe z-40 shadow-2xl">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <p className="font-puffy text-2xl text-white leading-none" suppressHydrationWarning>
              {formatCurrency(event.price, event.currency)}
            </p>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider mt-1 font-sans-clean ${isSoldOut ? 'text-red-400' : 'text-[#cb4b31]'}`}>
              {isSoldOut ? 'SOLD OUT' : `${spotsRemaining} SPOTS LEFT`}
            </p>
          </div>

          {isSoldOut ? (
            <button
              disabled
              className="px-6 py-3 rounded-full bg-white/10 text-white/40 text-xs font-bold tracking-wider uppercase cursor-not-allowed font-sans-clean"
            >
              Closed
            </button>
          ) : (
            <Link
              href={`/checkout?event=${encodeURIComponent(event.slug)}`}
              className="px-8 py-3.5 rounded-full bg-[#cb4b31] text-white font-sans-clean text-xs font-extrabold tracking-wider uppercase shadow-md active:scale-95 transition-transform border border-white/20"
            >
              [ Reserve ]
            </Link>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
