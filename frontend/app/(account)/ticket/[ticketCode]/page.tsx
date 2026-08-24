import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Download, MapPin, QrCode, ShieldCheck } from 'lucide-react';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface Props { params: Promise<{ ticketCode: string }> }

export default async function TicketQrPage({ params }: Props) {
  const user = await getCurrentFirebaseUser();
  if (!user) redirect('/login');
  const { ticketCode } = await params;
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase.from('profiles').select('id').eq('firebase_uid', user.uid).maybeSingle();
  if (!profile) notFound();

  const { data: ticket } = await supabase.from('tickets').select(`id,ticket_code,qr_payload,status,events:event_id(id,title,cover_image,start_at,venue:venue_id(name,address,city))`).eq('ticket_code', ticketCode.toUpperCase()).eq('user_id', profile.id).maybeSingle();
  if (!ticket) notFound();
  const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;
  const venue = event?.venue ? (Array.isArray(event.venue) ? event.venue[0] : event.venue) : null;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&margin=16&data=${encodeURIComponent(ticket.qr_payload)}`;

  return <div className="min-h-screen bg-[#121118] text-gray-100 flex flex-col"><main className="flex-1 max-w-xl mx-auto w-full px-4 py-10"><Link href="/tickets" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> My tickets</Link><div className="bg-white text-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl"><div className="relative h-56 bg-gray-900">{event?.cover_image && <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-5 left-6 right-6"><span className="text-[10px] font-black uppercase tracking-widest text-[#ff573d]">Digital entry pass</span><h1 className="text-2xl font-black text-white mt-1">{event?.title}</h1></div></div><div className="p-7 space-y-6"><div className="flex justify-between items-center"><span className="px-3 py-1 rounded-full bg-[#ff573d] text-white text-[10px] font-black">{ticket.status}</span><span className="font-mono text-xs font-black">{ticket.ticket_code}</span></div><div className="flex items-center gap-3 text-sm"><ShieldCheck className="w-5 h-5 text-emerald-500" /><span>Verified ticket QR</span></div><div className="w-full aspect-square max-w-[360px] mx-auto rounded-3xl border border-gray-200 p-4 bg-white"><img src={qrUrl} alt={`QR code for ${ticket.ticket_code}`} className="w-full h-full object-contain" /></div><div className="text-center"><p className="font-mono text-sm font-black tracking-wide">{ticket.qr_payload}</p><p className="text-xs text-gray-500 mt-2">Present this QR code at the event entrance.</p></div><div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5 text-xs"><div><span className="text-gray-400 uppercase font-bold">Date</span><p className="font-black mt-1">{event?.start_at ? new Intl.DateTimeFormat('en-IN',{dateStyle:'medium'}).format(new Date(event.start_at)) : 'TBA'}</p></div><div><span className="text-gray-400 uppercase font-bold">Time</span><p className="font-black mt-1">{event?.start_at ? new Intl.DateTimeFormat('en-IN',{timeStyle:'short'}).format(new Date(event.start_at)) : 'TBA'}</p></div><div className="col-span-2 flex gap-2"><MapPin className="w-4 h-4 text-[#ff573d]" /><div><span className="text-gray-400 uppercase font-bold">Venue</span><p className="font-black mt-1">{venue?.name || 'Venue TBA'}</p><p className="text-gray-500">{venue?.address}{venue?.city ? `, ${venue.city}` : ''}</p></div></div></div><a href={qrUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-2xl bg-[#121118] text-white font-black text-xs flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Open / save QR image</a></div></div></main></div>;
}
