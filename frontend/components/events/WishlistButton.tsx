'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';

export function WishlistButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`/api/wishlist?event_id=${encodeURIComponent(eventId)}`, { cache: 'no-store' })
      .then(async response => {
        const body = await response.json().catch(() => ({}));
        if (active && response.ok) setSaved(Boolean(body.wishlisted));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [eventId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/wishlist', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!response.ok) throw new Error(body.error || 'Unable to update wishlist.');
      setSaved(Boolean(body.wishlisted));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update wishlist.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="relative">
    <button type="button" onClick={() => void toggle()} disabled={busy} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved} className={`p-3 rounded-full bg-black/50 backdrop-blur-md text-white transition-colors border border-white/20 ${saved ? 'text-[#ff573d]' : 'hover:text-[#ff573d] hover:bg-black/70'}`}>
      {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />}
    </button>
    {error && <span role="status" className="absolute right-0 top-14 w-56 rounded-xl bg-gray-950 border border-gray-800 p-2 text-[11px] text-gray-200 shadow-xl">{error}</span>}
  </div>;
}
