'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="px-6 py-3 rounded-2xl border border-white/10 text-xs font-extrabold text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
