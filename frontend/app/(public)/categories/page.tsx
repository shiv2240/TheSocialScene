import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('event_categories')
    .select('id, name, slug, display_order')
    .order('display_order', { ascending: true });

  return (
    <div className="min-h-screen bg-[#141217] text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest font-bold text-[#c85a3c]">Explore</span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-1">Categories</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">Browse events by category.</p>
        </div>

        {categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group glass-card rounded-3xl border border-white/10 p-6 hover:border-[#c85a3c]/50 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#c85a3c]/15 text-[#c85a3c] flex items-center justify-center mb-5">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-extrabold text-white group-hover:text-[#c85a3c] transition-colors">
                    {category.name}
                  </h2>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#c85a3c] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-gray-500 mt-2">View published events</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <h2 className="text-xl font-bold text-white">No categories available</h2>
            <p className="text-sm text-gray-400 mt-2">Categories will appear here once configured.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
