import Link from 'next/link';
import { Ticket as TicketIcon, MapPin, Image as ImageIcon } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { formatDate, formatTime } from '@/lib/utils';

export default async function UserTicketsPage() {
  const user = await getCurrentFirebaseUser();
  if (!user) redirect('/login');

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase.from('profiles').select('id, onboarding_completed').eq('firebase_uid', user.uid).maybeSingle();
  if (!profile?.onboarding_completed) redirect('/onboarding?next=/tickets');

  const { data: tickets } = await supabase
    .from('tickets')
    .select(`id, ticket_code, qr_payload, status, created_at, events:event_id(id, title, cover_image, start_at, venue:venue_id(name, address, city))`)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const activeTicket = tickets?.[0];
  const event = activeTicket?.events ? (Array.isArray(activeTicket.events) ? activeTicket.events[0] : activeTicket.events) : null;
  const venue = event?.venue ? (Array.isArray(event.venue) ? event.venue[0] : event.venue) : null;
  const ticketId = activeTicket?.ticket_code || '';
  const qrUrl = activeTicket ? `https://api.qrserver.com/v1/create-qr-code/?size=700x700&margin=16&data=${encodeURIComponent(activeTicket.qr_payload || ticketId)}` : '';

  return (
    <div className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] flex flex-col selection:bg-[#cb4b31] selection:text-white pb-24 md:pb-0">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="mb-8 text-center">
          <span className="font-sans-clean text-[10px] text-[#e5a83b] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15 inline-block">● DIGITAL PASSES</span>
          <h1 className="font-puffy text-4xl sm:text-6xl text-white uppercase mt-2">MY ENTRY <span className="text-[#cb4b31]">TICKETS</span></h1>
          <p className="font-sans-clean text-xs sm:text-sm text-[#f4ebd9]/70 mt-1 font-semibold">Your confirmed event QR passes for fast check-in at the entrance.</p>
        </div>

        {!activeTicket ? (
          <div className="max-w-md mx-auto rounded-3xl border border-white/20 bg-[#16151c] p-8 sm:p-12 text-center shadow-2xl">
            <TicketIcon className="w-12 h-12 mx-auto text-[#cb4b31] mb-4" />
            <h2 className="font-puffy text-2xl text-white uppercase">No active tickets yet</h2>
            <p className="font-sans-clean text-xs text-[#f4ebd9]/70 mt-2 font-semibold">Register for an upcoming experience and your digital pass will appear here instantly.</p>
            <Link href="/events" className="inline-flex mt-6 px-7 py-3.5 rounded-full bg-[#cb4b31] font-sans-clean font-extrabold text-xs tracking-wider text-white uppercase shadow-md border border-white/20">[ Explore Gatherings ↗ ]</Link>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-[#16151c] text-[#f4ebd9] rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="relative h-60 w-full overflow-hidden bg-[#1f1d26] border-b border-white/10">
              {event?.cover_image ? <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-[#1f1d26]"><ImageIcon className="w-10 h-10 text-white/40" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-[#16151c] via-transparent to-transparent" />
              <div className="absolute top-4 left-4"><span className="px-3.5 py-1.5 rounded-full font-sans-clean text-[10px] font-extrabold tracking-wider bg-[#cb4b31] text-white uppercase shadow-md border border-white/20">● {activeTicket.status}</span></div>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <h2 className="font-puffy text-2xl leading-tight text-white">{event?.title || 'Event Pass'}</h2>
                <span className="font-sans-clean text-xs text-[#0e0d12] bg-[#e5a83b] px-3 py-0.5 rounded-full font-extrabold inline-block mt-1 border border-[#0e0d12]">TICKET ID: {ticketId}</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-left border-b border-white/10 pb-4 font-sans-clean">
                <div><span className="text-[10px] font-extrabold text-[#f4ebd9]/60 uppercase tracking-wider block">Date</span><span className="text-xs font-extrabold text-white block mt-0.5" suppressHydrationWarning>{event?.start_at ? formatDate(event.start_at) : 'TBA'}</span></div>
                <div><span className="text-[10px] font-extrabold text-[#f4ebd9]/60 uppercase tracking-wider block">Time</span><span className="text-xs font-extrabold text-white block mt-0.5" suppressHydrationWarning>{event?.start_at ? formatTime(event.start_at) : 'TBA'}</span></div>
                <div className="col-span-2"><span className="text-[10px] font-extrabold text-[#f4ebd9]/60 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3 text-[#cb4b31]" /> Venue</span><span className="text-xs font-extrabold text-white block mt-0.5">{venue?.name || 'Venue TBA'}</span></div>
              </div>

              <div className="text-center space-y-3">
                <div className="w-56 h-56 mx-auto bg-white p-4 rounded-3xl flex items-center justify-center border-2 border-white/20 shadow-2xl">
                  <img src={qrUrl} alt={`QR code for ticket ${ticketId}`} className="w-full h-full object-contain" />
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                  <span className="font-sans-clean text-[10px] font-extrabold text-[#f4ebd9]/60 uppercase tracking-wider block">Ticket ID</span>
                  <span className="font-sans-clean text-sm font-extrabold text-[#e5a83b] block mt-1 tracking-wider">{ticketId}</span>
                </div>
                <p className="font-sans-clean text-[11px] text-[#f4ebd9]/70 font-semibold">Show this QR code at the event check-in desk. If scanning is unavailable, provide your Ticket ID for manual verification.</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
