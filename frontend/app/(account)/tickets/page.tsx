'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ticket as TicketIcon, QrCode, Calendar, MapPin, CheckCircle2, Download, Image as ImageIcon, Share2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TicketService } from '@backend/services/ticket.service';
import { EventService } from '@backend/services/event.service';

export default function UserTicketsPage() {
  const tickets = TicketService.getMockTickets();
  const events = EventService.getMockEvents();
  const activeEvent = events[0];

  const [activeTab, setActiveTab] = useState<'QR' | 'IMAGE'>('QR');

  return (
    <div className="min-h-screen bg-[#121118] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-widest font-bold text-[#ffaa00]">Digital Passes</span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-1">Confirmed Event Ticket</h1>
          <p className="text-xs text-gray-400 mt-1">
            Show your ticket stub & barcode to entry staff at venue check-in desk.
          </p>
        </div>

        {/* Physical Ticket Stub Card (Directly modeled after Reference Image 2 & 3: Justice Tour & Oliver Tree) */}
        <div className="max-w-md mx-auto bg-white text-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative">
          {/* Top Event Cover Header */}
          <div className="relative h-64 w-full overflow-hidden bg-gray-900">
            <img
              src={activeEvent.cover_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'}
              alt={activeEvent.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-[#ff573d] text-white shadow-md">
                CONFIRMED PASS
              </span>
              <button className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white">
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-4 left-5 right-5 z-10">
              <h2 className="text-2xl font-black text-white leading-tight">
                {activeEvent.title}
              </h2>
              <span className="text-xs text-gray-300 font-mono block mt-0.5">
                Pass ID: {tickets[0]?.ticket_code || 'TSS-2026-9B4A7C2E'}
              </span>
            </div>
          </div>

          {/* Ticket Perforated Tear Line with Side Notch Cutouts (Reference Image 2 & 3) */}
          <div className="relative bg-white py-2 px-6">
            <div className="w-full border-t-2 border-dashed border-gray-300 relative my-2" />
            <div className="w-6 h-6 rounded-full bg-[#121118] absolute -left-3 top-1/2 -translate-y-1/2" />
            <div className="w-6 h-6 rounded-full bg-[#121118] absolute -right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Ticket Metadata Details Grid */}
          <div className="p-6 bg-white space-y-6">
            <div className="grid grid-cols-2 gap-4 text-left border-b border-gray-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Date</span>
                <span className="text-sm font-black text-gray-900 block mt-0.5">AUG 24, 2026</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Time</span>
                <span className="text-sm font-black text-gray-900 block mt-0.5">05:30 PM</span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Venue</span>
                <span className="text-sm font-extrabold text-gray-900 block mt-0.5 truncate">
                  {activeEvent.venue?.name || 'Indiranagar Social'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Seat / Tier</span>
                <span className="text-sm font-extrabold text-gray-900 block mt-0.5">General Pass</span>
              </div>
            </div>

            {/* Barcode Visual (Reference Image 2 & 3 Ticket Stub) */}
            {activeTab === 'QR' ? (
              <div className="text-center space-y-3">
                <div className="w-44 h-44 mx-auto bg-gray-950 p-3 rounded-2xl flex items-center justify-center shadow-lg border border-gray-200">
                  <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-white rounded-xl">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${i % 2 === 0 ? 'bg-black' : 'bg-[#ff573d]'}`}
                      />
                    ))}
                  </div>
                </div>
                {/* Simulated Barcode */}
                <div className="h-10 w-full bg-contain bg-repeat-x flex items-center justify-center gap-1 opacity-90 px-4">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 5 === 0 ? 'w-1.5 bg-black' : 'w-0.5 bg-gray-700'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-mono font-bold text-gray-700 block">
                  {tickets[0]?.ticket_code || 'TSS-2026-9B4A7C2E'}
                </span>
              </div>
            ) : (
              <div className="h-44 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={activeEvent.cover_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'}
                  alt="Pass artwork"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Bottom Toggle Pill Buttons (Reference Image 2 & 3: "Image" | "QR Code") */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('IMAGE')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'IMAGE'
                    ? 'bg-[#121118] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Image Pass
              </button>

              <button
                onClick={() => setActiveTab('QR')}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'QR'
                    ? 'gradient-coral text-white shadow-lg shadow-[#ff573d]/25'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QR Code
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
