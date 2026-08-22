'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, Phone, Mail, ShieldCheck, Ticket, Calendar, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function UserProfilePage() {
  const [profile, setProfile] = useState({
    full_name: 'Ananya Sharma',
    phone: '+91 9876543210',
    email: 'ananya.sharma@example.com',
    status: 'ACTIVE',
    joined_date: 'August 2026',
  });

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest font-bold text-[#e59838]">Account Settings</span>
          <h1 className="text-3xl font-black text-white mt-1">Explorer Profile</h1>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-white/10">
            <div className="w-20 h-20 rounded-full gradient-terracotta flex items-center justify-center text-white font-black text-2xl shadow-xl">
              AS
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">{profile.full_name}</h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 inline-block">
                VERIFIED EXPLORER
              </span>
              <p className="text-xs text-gray-400">Member since {profile.joined_date}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#1d1a24] border border-white/10 space-y-1">
              <span className="text-xs text-gray-400 font-semibold uppercase block flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#c85a3c]" /> Phone Number
              </span>
              <span className="text-sm font-bold text-white block">{profile.phone}</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1d1a24] border border-white/10 space-y-1">
              <span className="text-xs text-gray-400 font-semibold uppercase block flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#e59838]" /> Email Address
              </span>
              <span className="text-sm font-bold text-white block">{profile.email}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/tickets"
              className="px-6 py-3 rounded-2xl gradient-terracotta text-xs font-extrabold text-white shadow-lg flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" /> View My Digital Passes
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
