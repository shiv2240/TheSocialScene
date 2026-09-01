# The Social Scene — Performance Engineering Playbook

This document records the production performance strategy used for The Social Scene. It is also an interview-ready reference for explaining how a full-stack application is made faster without sacrificing correctness or security.

## 1. Performance model

`Browser → CDN/Edge → Next.js → API → Database / External APIs → Response → Browser`

Always **measure → identify bottleneck → optimize → verify**. Do not optimize by guesswork.

## 2. Current production fixes

### Navigation and page shell
- Keep persistent navigation outside route-specific page rendering where possible.
- `/events` explicitly renders the shared Navbar so Explore cannot render without the desktop/mobile header.
- Root `MobileNavigation` remains persistent across route transitions.
- Avoid route-wide loading screens when only dynamic data is changing.
- Use localized skeletons for genuinely asynchronous sections.

### `/events` build stability
- `EventsSearch` uses `useSearchParams()`, so it is wrapped in a React `Suspense` boundary at the route level as required by Next.js 16 production prerendering.
- This keeps the interactive search/filter island client-side while allowing the page shell and initial event data to render on the server.

### CSS stability
- Fixed invalid Tailwind selector escaping in `globals.css` (`.md\\:hidden` → valid `.md\:hidden`).
- Avoid broad selectors that unintentionally alter unrelated page content.
- Floating-navbar content compaction is scoped to the Navbar's immediate page sibling rather than `body > main`, reducing layout side effects.

### Data fetching
- Public event data is server-rendered with short revalidation.
- Categories/category previews use short server-side caching/revalidation.
- Independent requests are executed in parallel.
- Profile requests are coalesced/cached briefly on the client instead of issuing a new `/api/profile` request for every navigation.

## 3. Frontend optimization techniques

1. **Persistent application shell** — Navbar and mobile navigation remain mounted across route transitions.
2. **Server Components first** — keep static/non-interactive UI on the server.
3. **Client Components only where needed** — browser state, effects and event handlers stay client-side.
4. **Suspense boundaries** — isolate client data/search islands from the page shell.
5. **Localized loading UI** — avoid full-page loaders for small dynamic sections.
6. **Parallel fetching** — avoid sequential API waterfalls.
7. **Request deduplication/coalescing** — reuse identical in-flight or recently fetched data.
8. **Server caching/revalidation** — cache read-heavy public data according to volatility.
9. **Route prefetching** — use Next.js prefetching selectively for predictable navigation.
10. **Image optimization** — `next/image`, responsive `sizes`, AVIF/WebP, explicit dimensions, lazy loading below the fold.
11. **Bundle optimization** — remove unused dependencies and avoid shipping dashboard-only code to public routes.
12. **Dynamic imports** — use only for genuinely heavy, non-critical client modules.
13. **Font optimization** — prefer `next/font`/self-hosted fonts over runtime external font requests.
14. **Core/native JavaScript** — use `fetch`, `AbortController`, `IntersectionObserver`, passive listeners and similar browser primitives when they solve a small problem cleanly.
15. **Avoid unnecessary client state** — do not introduce a state library when native/browser/framework primitives are sufficient.

### Core JavaScript rule

Core JS is an optimization tool, not a replacement for good architecture. Native APIs are useful for small, local problems such as request cancellation, event handling, visibility detection and request coalescing. They should not replace Next.js routing, Server Components or caching simply because handwritten JavaScript appears faster.

## 4. Backend/API optimization techniques

1. Profile endpoint duration.
2. Measure database time separately from application time.
3. Use `EXPLAIN ANALYZE` for slow PostgreSQL queries.
4. Add targeted indexes for `WHERE`, `JOIN`, filtering and ordering patterns.
5. Avoid `SELECT *` when a smaller projection is sufficient.
6. Eliminate N+1 queries.
7. Paginate all potentially large collections.
8. Return compact DTOs rather than oversized database records.
9. Run independent DB/external operations concurrently.
10. Add explicit timeouts around third-party services.
11. Keep non-critical work out of the critical response path.
12. Reuse/pool database connections appropriately for serverless workloads.

## 5. Database optimization

The performance index migration targets the application's main read patterns: event discovery, event/category/host/venue relationships, schedules, registrations, tickets, check-ins, orders, payments, refunds, waitlists and coupon redemption.

Indexing principle: optimize actual access patterns without indiscriminately indexing every column because indexes also add write/storage overhead.

## 6. Caching strategy

| Data | Strategy |
|---|---|
| Categories | Long cache / revalidation |
| Public event discovery | Short/medium revalidation |
| Host profiles | Medium revalidation |
| Venue information | Medium revalidation |
| Search results | Short cache |
| User profile | Short client cache / revalidation |
| Orders/tickets | Dynamic |
| Payments | Never serve stale transactional state |
| Authentication/session | Dynamic |

## 7. Performance anti-patterns to avoid

- Full-page loading spinner for every route transition.
- Refetching static/public data on every navigation.
- Sequential requests that could run in parallel.
- Unbounded database queries.
- `SELECT *` for UI endpoints.
- N+1 database access.
- Blocking initial rendering on analytics or other non-critical third-party calls.
- Large original images for small cards.
- Making an entire page a Client Component unnecessarily.
- Adding libraries when a native browser API is sufficient.

## 8. Core Web Vitals targets

| Metric | Target |
|---|---:|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB | Preferably < 800ms |

Measure mobile and desktop separately.

## 9. Observability

For important endpoints capture:

```text
request
├── total duration
├── database duration
├── external API duration
├── response size
└── HTTP status
```

A useful diagnosis converts “the website is slow” into a measurable bottleneck such as:

```text
/events       1,850 ms
  ├─ DB       1,430 ms
  ├─ external     0 ms
  └─ serialize   80 ms
```

## 10. Debugging workflow

1. Reproduce the slow navigation.
2. Inspect the browser Network waterfall.
3. Determine whether the slow request is a document, RSC request, API call, image or third-party resource.
4. Measure TTFB and response size.
5. Trace API/database execution.
6. Inspect query plans.
7. Optimize the highest-impact bottleneck.
8. Build in production mode.
9. Deploy.
10. Compare before/after metrics.

## 11. Interview-ready answer

**How would you fix a Next.js + PostgreSQL application where every navigation shows a loader and feels slow?**

> “First I would determine whether the navigation is actually doing a browser reload or whether the Next.js route transition is re-executing server data fetching. I would inspect the Network waterfall and identify which requests repeat. I would move persistent navigation and static UI into layouts so they survive route transitions, keep only truly dynamic data dynamic, cache public read-heavy data with appropriate revalidation, and deduplicate repeated requests. I would isolate client-side search/filter logic behind Suspense instead of making the entire page client-rendered. On the backend I would profile database queries, add targeted indexes, eliminate N+1 queries, paginate large collections and parallelize independent work. Finally I would validate TTFB, LCP, INP, payload size and API latency before and after the changes.”

## 12. Engineering principle

**Measure → Identify bottleneck → Optimize → Verify.**

A performance change is successful only when measurable latency, payload size, rendering performance or user-perceived responsiveness improves without correctness or security regressions.
