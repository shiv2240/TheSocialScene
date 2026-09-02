'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PRIMARY_ROUTES = ['/', '/events', '/categories', '/become-a-host', '/account'];

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function NavigationPrefetch() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const idleWindow = window as IdleWindow;

    const prefetch = () => {
      if (cancelled) return;
      PRIMARY_ROUTES.forEach((route) => router.prefetch(route));
    };

    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(prefetch, { timeout: 1500 });
    } else {
      timeoutHandle = window.setTimeout(prefetch, 500);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [router]);

  return null;
}
