'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
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
