'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, ArrowRight, Heart } from 'lucide-react';
import { EventItem } from '@backend/types/database.types';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const spotsRemaining = Math.max(0, event.capacity - event.registered_count);
  const isSoldOut = spotsRemaining === 0 || !event.registration_open;

  // Extract day and month for floating circular date badge (as seen in Moon Crush & Justice Tour reference images)
  const eventDate = new Date(event.start_at);
  const dayNum = eventDate.getDate();
  const monthStr = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();

  return (
    <div className="group rounded-3xl glass-card border border-white/10 overflow-hidden hover:border-[#ff573d]/50 hover:shadow-2xl hover:shadow-[#ff573d]/15 transition-all duration-300 flex flex-col h-full relative">
      {/* Cover Image Container */}
      <div className="relative h-60 w-full overflow-hidden bg-[#181622]">
        <img
          src={event.cover_image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Floating Circular Date Badge (Top Right - Reference Image 3 & 4) */}
        <div className="absolute top-3 right-3 w-12 h-12 rounded-full gradient-coral flex flex-col items-center justify-center text-white font-extrabold text-xs shadow-lg border border-white/20 z-10">
          <span className="text-[13px] leading-none">{dayNum}</span>
          <span className="text-[9px] tracking-wider uppercase font-semibold leading-none mt-0.5">{monthStr}</span>
        </div>

        {/* Category Pill Badge (Top Left - Reference Image 1) */}
        {event.category && (
          <span className="absolute top-3 left-3 px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#121118]/85 backdrop-blur-md text-[#ffaa00] border border-[#ffaa00]/30 shadow-md">
            {event.category.name}
          </span>
        )}

        {/* Price Pill Tag (Bottom Right Overlay - Reference Image 2 & 3) */}
        <div className="absolute bottom-3 right-3 px-4 py-1.5 rounded-full text-xs font-black bg-white text-[#121118] shadow-xl font-mono">
          {formatCurrency(event.price, event.currency)}
        </div>

        {/* Sold Out / Capacity Indicator */}
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

      {/* Content Body Section */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Overlapping Attendee Avatar Stack (As seen in Reference Image 1 & 2) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                alt="Attendee"
                className="w-6 h-6 rounded-full border-2 border-[#1a1824] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                alt="Attendee"
                className="w-6 h-6 rounded-full border-2 border-[#1a1824] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80"
                alt="Attendee"
                className="w-6 h-6 rounded-full border-2 border-[#1a1824] object-cover"
              />
              <div className="w-6 h-6 rounded-full bg-[#2a2638] text-[10px] font-bold text-gray-300 border-2 border-[#1a1824] flex items-center justify-center">
                +{event.registered_count}
              </div>
            </div>

            <span className="text-[11px] font-semibold text-gray-400">
              {event.registered_count} Attending
            </span>
          </div>

          {/* Event Title */}
          <Link href={`/events/${event.slug}`}>
            <h3 className="text-lg font-extrabold text-white group-hover:text-[#ff573d] transition-colors line-clamp-1">
              {event.title}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {event.short_description}
          </p>
        </div>

        {/* Date & Location Footer Details */}
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

        {/* Coral Action Button */}
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
