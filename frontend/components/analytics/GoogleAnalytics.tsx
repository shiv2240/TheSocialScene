'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    window.gtag('event', 'page_view', {
      page_location: window.location.href,
      page_path: pathname,
      page_title: document.title,
      send_to: GA_ID,
    });
  }, [pathname]);

  return null;
}
