'use client';

import { useEffect } from 'react';

const PROFILE_TTL_MS = 60_000;

type ProfileCache = {
  expiresAt: number;
  body: unknown;
  status: number;
  headers: HeadersInit;
};

let profileCache: ProfileCache | null = null;
let profileRequest: Promise<Response> | null = null;

function isProfileRequest(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (method !== 'GET') return false;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  return url.startsWith('/api/profile') || url.includes('/api/profile?');
}

function cachedResponse(cache: ProfileCache) {
  return new Response(JSON.stringify(cache.body), {
    status: cache.status,
    headers: { 'Content-Type': 'application/json', ...cache.headers },
  });
}

export function RequestCacheBootstrap() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const patchedFetch: typeof window.fetch = async (input, init) => {
      if (!isProfileRequest(input, init)) return originalFetch(input, init);

      if (profileCache && profileCache.expiresAt > Date.now()) {
        return cachedResponse(profileCache);
      }

      if (profileRequest) return profileRequest.then(response => response.clone());

      profileRequest = originalFetch(input, init).then(async response => {
        try {
          const body = await response.clone().json();
          profileCache = {
            expiresAt: Date.now() + PROFILE_TTL_MS,
            body,
            status: response.status,
            headers: { 'Cache-Control': 'private, max-age=60' },
          };
        } catch {
          profileCache = null;
        }
        return response;
      }).finally(() => {
        profileRequest = null;
      });

      return profileRequest.then(response => response.clone());
    };

    window.fetch = patchedFetch;

    const invalidate = () => {
      profileCache = null;
    };
    window.addEventListener('tss:profile-updated', invalidate);

    return () => {
      window.removeEventListener('tss:profile-updated', invalidate);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
