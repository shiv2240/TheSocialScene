import React from 'react';
import { Search, Filter, Calendar, MapPin, SlidersHorizontal, Sparkles } from 'lucide-react';
import { EventService } from '@backend/services/event.service';
import { EventCard } from '@/components/event/EventCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default async function EventDiscoveryPage() {
  const events = EventService.getMockEvents();

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left">
          <span className="text-xs uppercase tracking-widest font-bold text-purple-400">
            Curated Gatherings
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-1">
            Discover <span className="gradient-text">Events</span>
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            Find sunset runs, rooftop music sessions, tech mixers, and creative workshops happening near you.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-card p-4 rounded-2xl border border-gray-800 mb-8 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event title, host, or venue..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <select className="px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-xs font-medium text-gray-300 outline-none cursor-pointer">
              <option value="">All Categories</option>
              <option value="music-concerts">Music & Concerts</option>
              <option value="fitness-wellness">Fitness & Wellness</option>
              <option value="tech-networking">Tech & Networking</option>
              <option value="food-culinary">Food & Culinary</option>
            </select>

            <select className="px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-xs font-medium text-gray-300 outline-none cursor-pointer">
              <option value="">All Cities</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="gurugram">Gurugram</option>
              <option value="mumbai">Mumbai</option>
            </select>

            <select className="px-3.5 py-2.5 rounded-xl bg-gray-900/90 border border-gray-700/80 text-xs font-medium text-gray-300 outline-none cursor-pointer">
              <option value="upcoming">Sort: Upcoming</option>
              <option value="popular">Sort: Most Popular</option>
              <option value="newest">Sort: Newest</option>
              <option value="featured">Sort: Featured</option>
            </select>
          </div>
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {events.map((evt) => (
            <EventCard key={evt.id} event={evt} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
