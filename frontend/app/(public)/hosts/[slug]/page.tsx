import React from 'react';
import Link from 'next/link';
import { User, CheckCircle2, ArrowLeft, Calendar, ShieldCheck, MapPin } from 'lucide-react';
import { EventService } from '@backend/services/event.service';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface HostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function HostProfilePage({ params }: HostPageProps) {
  const { slug } = await params;
  const events = EventService.getMockEvents();
  const sampleHost = events[0].host;

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#c85a3c] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>

        {/* Host Header Card */}
        <div className="glass-card p-8 rounded-3xl border border-white/10 mb-10 flex flex-col sm:flex-row items-center gap-6">
          <img
            src={sampleHost?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
            alt="Host Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-[#c85a3c] shadow-xl"
          />
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#c85a3c]/20 text-[#c85a3c] inline-block uppercase">
              Verified Host
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
              {sampleHost?.full_name || 'Bengaluru Social Club'}
              <CheckCircle2 className="w-6 h-6 text-[#c85a3c]" />
            </h1>
            <p className="text-xs text-gray-300 max-w-md">
              Organizing authentic outdoor mountain treks, sunset runs, and community social gatherings.
            </p>
          </div>
        </div>

        {/* Hosted Events List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Events Hosted by {sampleHost?.full_name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
