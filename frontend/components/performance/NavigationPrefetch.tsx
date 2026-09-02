'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PRIMARY_ROUTES = ['/', '/events', '/categories', '/become-a-host', '/account'];

export function NavigationPrefetch() {
  const router = useRouter();

  useEffect(() => {
    // Let the current page finish its first paint before warming the most-used
    // routes. With staleTimes enabled, these full prefetches stay in the client
    // router cache and make subsequent clicks effectively instant.
    const prefetch = () => {
      PRIMARY_ROUTES.forEach(route => router.prefetch(route));
    };

    const idle = 'requestIdleCallback' in window
      ? window.setTimeout(() => (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback?.(prefetch), 150)
      : window.setTimeout(prefetch, 500);

    return () => window.clearTimeout(idle);
  }, [router]);

  return null;
}
