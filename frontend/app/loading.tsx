import React from 'react';

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#ede4d0] text-[#1e1a14] animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="h-16 border-b-2 border-[#1e1a14]/10 bg-[#f7f0e3]" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="h-3 w-36 rounded bg-[#c93a2a]/15" />
        <div className="mt-3 h-20 sm:h-28 w-3/4 rounded bg-[#1e1a14]/10" />
        <div className="mt-4 h-4 w-full max-w-xl rounded bg-[#1e1a14]/10" />
        <div className="mt-2 h-4 w-2/3 max-w-lg rounded bg-[#1e1a14]/10" />
      </section>
      <section className="bg-[#c93a2a] px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="rounded-2xl overflow-hidden border-2 border-[#1e1a14]/15 bg-[#f7f0e3]">
              <div className="h-52 sm:h-60 bg-[#e0d5bc]" />
              <div className="p-5 space-y-4">
                <div className="h-2.5 w-32 rounded bg-[#1e1a14]/10" />
                <div className="h-7 w-4/5 rounded bg-[#1e1a14]/10" />
                <div className="h-2.5 w-2/3 rounded bg-[#1e1a14]/10" />
                <div className="h-9 w-full rounded bg-[#1e1a14]/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
