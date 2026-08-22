import Link from 'next/link';
import { Ticket as TicketIcon, QrCode, MapPin, Image as ImageIcon } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function UserTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).maybeSingle();
  const { data: tickets } = profile ? await supabase.from('tickets').select(`id, ticket_code, qr_payload, status, created_at, events:event_id(id, title, cover_image, start_at, venue:venue_id(name, address, city))`).eq('user_id', profile.id).order('created_at', { ascending: false }) : { data: [] };
  const activeTicket = tickets?.[0];
  const event = activeTicket?.events ? (Array.isArray(activeTicket.events) ? activeTicket.events[0] : activeTicket.events) : null;
  const venue = event?.venue ? (Array.isArray(event.venue) ? event.venue[0] : event.venue) : null;

  return (
    <div className="min-h-screen bg-[#121118] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-10 text-center"><span className="text-xs uppercase tracking-widest font-bold text-[#ffaa00]">Digital Passes</span><h1 className="text-3xl sm:text-4xl font-black text-white mt-1">My Tickets</h1><p className="text-xs text-gray-400 mt-1">Your confirmed event tickets will appear here.</p></div>
        {!activeTicket ? <div className="max-w-md mx-auto rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center"><TicketIcon className="w-10 h-10 mx-auto text-gray-500 mb-4" /><h2 className="text-lg font-bold text-white">No tickets yet</h2><p className="text-sm text-gray-400 mt-2">Register for an event and your digital pass will appear here.</p><Link href="/events" className="inline-flex mt-6 px-5 py-3 rounded-2xl gradient-terracotta text-xs font-extrabold text-white">Explore Events</Link></div> : <div className="max-w-md mx-auto bg-white text-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="relative h-64 w-full overflow-hidden bg-gray-900">{event?.cover_image ? <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-800"><ImageIcon className="w-10 h-10 text-gray-500" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" /><div className="absolute top-4 left-4 right-4"><span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#ff573d] text-white shadow-md">{activeTicket.status}</span></div><div className="absolute bottom-4 left-5 right-5"><h2 className="text-2xl font-black text-white leading-tight">{event?.title || 'Event Ticket'}</h2><span className="text-xs text-gray-300 font-mono block mt-0.5">Pass ID: {activeTicket.ticket_code}</span></div></div>
          <div className="p-6 bg-white space-y-6"><div className="grid grid-cols-2 gap-4 text-left border-b border-gray-100 pb-4"><div><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Date</span><span className="text-sm font-black text-gray-900 block mt-0.5">{event?.start_at ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(event.start_at)) : 'TBA'}</span></div><div><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Time</span><span className="text-sm font-black text-gray-900 block mt-0.5">{event?.start_at ? new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(new Date(event.start_at)) : 'TBA'}</span></div><div className="col-span-2"><span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" />Venue</span><span className="text-sm font-extrabold text-gray-900 block mt-0.5">{venue?.name || 'Venue TBA'}</span></div></div><div className="text-center space-y-3"><div className="w-44 h-44 mx-auto bg-gray-950 p-3 rounded-2xl flex items-center justify-center shadow-lg"><div className="w-full h-full rounded-xl bg-white flex items-center justify-center p-3"><QrCode className="w-full h-full text-black" strokeWidth={1.5} /></div></div><span className="text-xs font-mono font-bold text-gray-700 block">{activeTicket.qr_payload}</span><p className="text-[11px] text-gray-500">Present this pass at event check-in.</p></div></div>
        </div>}
      </main><Footer />
    </div>
  );
}
