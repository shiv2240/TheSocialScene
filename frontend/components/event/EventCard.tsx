'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { EventItem } from '@backend/types/database.types';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const spotsRemaining = Math.max(0, event.capacity - event.registered_count);
  const isSoldOut = spotsRemaining === 0 || !event.registration_open;

  const eventDate = new Date(event.start_at);
  const dayNum = eventDate.getDate();
  const monthStr = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

  return (
    <div className="group rounded-3xl glass-card border border-white/10 overflow-hidden hover:border-[#ff573d]/50 hover:shadow-2xl hover:shadow-[#ff573d]/15 transition-all duration-300 flex flex-col h-full relative">
      <div className="relative h-60 w-full overflow-hidden bg-[#181622]">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#181622] text-xs font-semibold text-gray-500">
            No cover image
          </div>
        )}

        <div className="absolute top-3 right-3 w-12 h-12 rounded-full gradient-coral flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-lg border border-white/20 z-10">
          <span className="text-[13px] leading-none">{dayNum}</span>
          <span className="text-[9px] tracking-wider uppercase font-semibold leading-none mt-0.5">{monthStr}</span>
        </div>

        {event.category && (
          <span className="absolute top-3 left-3 px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#121118]/85 backdrop-blur-md text-[#ffaa00] border border-[#ffaa00]/30 shadow-md">
            {event.category.name}
          </span>
        )}

        <div className="absolute bottom-3 right-3 px-4 py-1.5 rounded-full text-xs font-black bg-white text-[#121118] shadow-xl font-mono">
          {formatCurrency(event.price, event.currency)}
        </div>

        {isSoldOut ? (
          <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-red-950/90 text-red-300 border border-red-500/40 backdrop-blur-md">
            Sold Out
          </span>
        ) : (
          spotsRemaining < 30 && (
            <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#ff573d]/90 text-white backdrop-blur-md shadow-md flex items-center gap-1">
              <Users className="w-3 h-3" /> Only {spotsRemaining} left
            </span>
          )
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400">
              {event.registered_count} Attending
            </span>
          </div>

          <Link href={`/events/${event.slug}`}>
            <h3 className="text-lg font-extrabold text-white group-hover:text-[#ff573d] transition-colors line-clamp-1">
              {event.title}
            </h3>
          </Link>

          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {event.short_description}
          </p>
        </div>

        <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-gray-300">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-full bg-[#ff573d]/15 text-[#ff573d]">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="truncate font-medium">
              {formatDate(event.start_at)} • {formatTime(event.start_at)}
            </span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-full bg-[#ffaa00]/15 text-[#ffaa00]">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="truncate font-medium text-gray-400">
                {event.venue.name}, {event.venue.city}
              </span>
            </div>
          )}
        </div>

        <Link
          href={`/events/${event.slug}`}
          className="w-full mt-2 py-3 px-4 rounded-2xl gradient-coral text-xs font-extrabold text-white shadow-lg shadow-[#ff573d]/20 group-hover:shadow-[#ff573d]/40 group-hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
        >
          {isSoldOut ? 'View Event Details' : 'Reserve Ticket'}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
