import Link from 'next/link';
import { Calendar, MapPin, ArrowLeft, Heart, CheckCircle2, Ticket } from 'lucide-react';
import { notFound } from 'next/navigation';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

interface EventDetailsProps { params: Promise<{ slug: string }> }

export default async function EventDetailPage({ params }: EventDetailsProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from('events')
    .select('*, category:event_categories(id, name, slug), venue:venues(id, name, address, city)')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (!event) notFound();

  const spotsRemaining = Math.max(0, event.capacity - event.registered_count);
  const isSoldOut = spotsRemaining === 0 || !event.registration_open;

  return (
    <div className="min-h-screen bg-[#121118] text-gray-100 flex flex-col selection:bg-[#ff573d] selection:text-white">
      <Navbar />
      <main className="flex-1 pb-24">
        <div className="relative h-80 sm:h-[420px] w-full overflow-hidden bg-[#181622]">
          {event.cover_image ? <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[#2a1c1a] to-[#121118]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121118] via-black/40 to-black/20" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 absolute top-6 left-0 right-0 flex items-center justify-between z-20">
            <Link href="/events" className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors border border-white/20"><ArrowLeft className="w-5 h-5" /></Link>
            <button type="button" aria-label="Save event" className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:text-[#ff573d] hover:bg-black/70 transition-colors border border-white/20"><Heart className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">
          <div className="light-card-overlay p-8 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6">
              <div className="space-y-2"><span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#ff573d]/15 text-[#ff573d] inline-block uppercase tracking-wider">{event.category?.name || 'Event'}</span><h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">{event.title}</h1></div>
              <div className="px-6 py-2.5 rounded-full gradient-coral text-white font-black text-xl shadow-xl shadow-[#ff573d]/25 text-center self-start">{formatCurrency(event.price, event.currency)}</div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div><span className="text-sm font-extrabold text-gray-900 block">{event.registered_count} Registered</span><span className="text-xs font-semibold text-[#ff573d] block">{spotsRemaining} spots remaining</span></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block"><CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-500" /> Live availability</span>
            </div>

            <div className="space-y-3"><h3 className="text-lg font-extrabold text-gray-900">Description</h3><p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{event.description}</p></div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100"><div className="w-12 h-12 rounded-2xl bg-[#ff573d]/15 text-[#ff573d] flex items-center justify-center flex-shrink-0"><MapPin className="w-6 h-6" /></div><div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Venue Location</span><span className="text-sm font-extrabold text-gray-900 block">{event.venue?.name || 'Venue TBA'}</span><span className="text-xs font-medium text-gray-500 block mt-0.5">{event.venue?.address}{event.venue?.city ? `, ${event.venue.city}` : ''}</span></div></div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100"><div className="w-12 h-12 rounded-2xl bg-[#ffaa00]/15 text-[#ffaa00] flex items-center justify-center flex-shrink-0"><Calendar className="w-6 h-6" /></div><div><span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Date & Schedule</span><span className="text-sm font-extrabold text-gray-900 block">{formatDate(event.start_at)}</span><span className="text-xs font-medium text-gray-500 block mt-0.5">{formatTime(event.start_at)} - {formatTime(event.end_at)}</span></div></div>
            </div>

            <div className="pt-4">{isSoldOut ? <button disabled className="w-full py-4 rounded-full bg-gray-200 text-gray-500 font-extrabold text-base cursor-not-allowed">Registration Closed</button> : <Link href={`/login?next=${encodeURIComponent(`/events/${event.slug}`)}`} className="w-full py-4 rounded-full bg-[#121118] text-white font-extrabold text-base hover:bg-[#ff573d] shadow-2xl transition-all flex items-center justify-center gap-3 group"><Ticket className="w-5 h-5 text-[#ff573d] group-hover:text-white transition-colors" /><span>Register {event.price > 0 ? `• ${formatCurrency(event.price, event.currency)}` : 'Free'}</span></Link>}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
