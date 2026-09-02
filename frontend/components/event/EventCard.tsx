'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import { EventItem } from '@backend/types/database.types';
import { formatDate, formatTime, formatMonthUpper, formatCurrency } from '@/lib/utils';

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const spotsRemaining = Math.max(0, event.capacity - event.registered_count);
  const isSoldOut = spotsRemaining === 0 || !event.registration_open;
  const eventDate = new Date(event.start_at);
  const dayNum = isNaN(eventDate.getTime()) ? '' : eventDate.getDate();
  const monthStr = formatMonthUpper(eventDate);

  return (
    <article className="group bg-[#f7f0e3] rounded-2xl overflow-hidden border-2 border-[#1e1a14] hover:shadow-[5px_6px_0px_#1e1a14] transition-all duration-300 flex flex-col h-full">
      <div className="relative h-52 sm:h-60 overflow-hidden bg-[#e0d5bc] border-b-2 border-[#1e1a14]">
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-[#1e1a14]/40">[ no image ]</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1a14]/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {event.category ? (
            <span className="font-mono text-[9px] font-bold uppercase tracking-widest bg-[#f7f0e3] text-[#1e1a14] px-3 py-1 rounded-full border border-[#1e1a14]">● {event.category.name}</span>
          ) : <div />}
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest bg-[#c93a2a] text-[#f7f0e3] px-3 py-1 rounded-full border border-[#1e1a14] flex items-center gap-1" suppressHydrationWarning>
            <Calendar className="w-2.5 h-2.5" />{dayNum} {monthStr}
          </span>
        </div>

        <div className="absolute bottom-3 right-3 font-mono text-[11px] font-bold bg-[#d4963a] text-[#1e1a14] px-3 py-1 rounded-full border border-[#1e1a14]" suppressHydrationWarning>
          {formatCurrency(event.price, event.currency)}
        </div>

        {isSoldOut ? (
          <span className="absolute bottom-3 left-3 font-mono text-[9px] font-bold bg-[#1e1a14] text-[#f7f0e3] px-3 py-1 rounded-full uppercase tracking-widest">Sold Out</span>
        ) : spotsRemaining < 25 ? (
          <span className="absolute bottom-3 left-3 font-mono text-[9px] font-bold bg-[#c93a2a] text-[#f7f0e3] px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> {spotsRemaining} left
          </span>
        ) : null}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#c93a2a] flex items-center gap-1.5" suppressHydrationWarning>
            {formatDate(event.start_at)} · {formatTime(event.start_at)}
          </div>
          <Link href={`/events/${event.slug}`}>
            <h3 style={{ fontFamily: 'Oswald, sans-serif' }} className="text-2xl sm:text-[28px] font-bold text-[#1e1a14] group-hover:text-[#c93a2a] transition-colors leading-tight tracking-wide">{event.title}</h3>
          </Link>
          {event.venue && (
            <p className="font-mono text-[10px] text-[#1e1a14]/60 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#c93a2a] shrink-0" />{event.venue.name}, {event.venue.city}
            </p>
          )}
          {event.short_description && (
            <p className="font-body text-xs text-[#1e1a14]/70 line-clamp-2 leading-relaxed pt-0.5">{event.short_description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#1e1a14]/12">
          <span className="font-mono text-[10px] text-[#1e1a14]/60 flex items-center gap-1"><Users className="w-3 h-3 text-[#d4963a]" />{event.registered_count} going</span>
          <Link href={`/events/${event.slug}`} className="pill pill-rust">{isSoldOut ? '[ View ]' : '[ Get Pass ↗ ]'}</Link>
        </div>
      </div>
    </article>
  );
}
