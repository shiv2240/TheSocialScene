import React from 'react';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0e0d12] text-[#f4ebd9] animate-pulse" aria-busy="true" aria-label="Loading account">
      <div className="h-16 border-b border-white/10 bg-[#16151c]" />
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="h-5 w-36 rounded-full bg-white/10" />
        <div className="h-14 sm:h-20 w-2/3 rounded bg-white/10 mt-3" />
        <div className="h-3 w-full max-w-lg rounded bg-white/10 mt-4" />
        <div className="space-y-3 mt-8">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-24 rounded-3xl border border-white/10 bg-[#16151c]" />
          ))}
        </div>
        <div className="h-48 rounded-3xl border border-white/10 bg-[#16151c] mt-8" />
      </section>
    </main>
  );
}
