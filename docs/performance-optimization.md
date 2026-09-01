# The Social Scene — Performance Engineering Playbook

This document records the production performance strategy used for The Social Scene. It is also an interview-ready reference for explaining how a full-stack application is made faster without sacrificing correctness or security.

## 1. Performance model

The target is to optimize the complete request path:

`Browser → CDN/Edge → Next.js → API → Database / External APIs → Response → Browser`

Do not optimize by guesswork. First identify whether latency is coming from TTFB, server execution, database queries, external services, payload size, image transfer, JavaScript execution, or rendering.

## 2. Implemented in this optimization pass

### Next.js production configuration

- Enabled response compression with `compress: true`.
- Disabled the `X-Powered-By` header with `poweredByHeader: false`.
- Enabled AVIF/WebP image formats for Next.js Image Optimization.
- Configured the approved remote image origin (`images.unsplash.com`).
- Enabled `optimizePackageImports` for `lucide-react` and `framer-motion` to reduce unnecessary client bundle imports.

### Database query performance

Added migration `00018_performance_indexes.sql` with indexes for the main access patterns:

- Published/featured event discovery ordered by start time.
- Event filtering by category, host and venue.
- Event gallery and host mappings.
- Event schedules ordered by start time.
- Registration lookup by event/status and user/date.
- Ticket lookup by user/status, event/status and registration.
- Check-in history by event/user and time.
- Orders by user/status.
- Payments by order/status and creation time.
- Refunds by payment.
- Waitlists by event/status/position.
- Coupon redemption lookup by user.

The principle is to index columns used frequently by `WHERE`, `JOIN`, filtering and ordering operations while avoiding indiscriminate indexing that increases write cost.

### Persistent navigation and route transitions

The public application's top Navbar is now mounted at the root layout so it survives client-side route transitions instead of being destroyed and recreated for every page.

The existing page-level Navbar instances are kept temporarily for compatibility but are visually disabled; the root instance owns the persistent navigation chrome.

The mobile bottom navigation is already mounted from the root layout and therefore remains persistent across route transitions.

### Dynamic data vs page shell

Navigation should not be treated as a full browser reload. The intended architecture is:

```text
Persistent application shell
├── Navbar / bottom navigation
├── Static page structure
└── Route-specific data
    ├── cached public data
    └── dynamic user/transactional data
```

Public categories and category event previews now use server-side `unstable_cache` with short revalidation. This prevents every navigation to `/categories` from executing the same database queries.

### Request coalescing for profile state

The Navbar previously requested `/api/profile` with `cache: 'no-store'` every time a page-level Navbar mounted. A lightweight native browser `fetch` request-coalescing layer now caches that non-transactional profile response for 60 seconds and deduplicates simultaneous requests.

The cache is invalidated by the existing `tss:profile-updated` event. This keeps account state reasonably fresh without turning every route transition into another profile API round trip.

This is intentionally implemented with native browser APIs rather than adding a heavy client-state dependency solely for one small request.

### Route-wide loader removal

The account route-group `loading.tsx` was removed because it replaced the entire page with a loading screen during navigation. The preferred behavior is to preserve the existing UI during a client transition and use localized skeletons only where a genuinely dynamic section needs one.

## 3. Frontend optimization roadmap

### Server Components first

Use React Server Components for non-interactive pages and sections. Keep Client Components only where browser state, event handlers, effects or browser APIs are required.

Benefits:

- Less JavaScript shipped to the browser.
- Less hydration work.
- Fewer client-side API waterfalls.
- Better initial rendering and SEO.

### Eliminate request waterfalls

Avoid:

```text
Page → API A → API B → API C
```

Prefer independent requests in parallel:

```text
Page → ┬→ API A
       ├→ API B
       └→ API C
```

Where possible, fetch data on the server and render the result directly instead of making the browser fetch data that the server already needs.

### Streaming and localized loading UI

Use `loading.tsx` or skeleton components only at the appropriate route/section boundary. Do not use a global full-page spinner for every navigation when only one data region is dynamic.

### Image optimization

Use `next/image` for application-managed images and apply:

- Responsive `sizes`.
- Explicit dimensions/aspect ratios.
- AVIF/WebP.
- Appropriate quality settings.
- Priority loading only for the true LCP image.
- Lazy loading for below-the-fold imagery.
- Properly sized thumbnails instead of downloading original assets.

### JavaScript bundle control

Audit client bundles and remove unnecessary dependencies. Use dynamic imports only for genuinely heavy, non-critical UI. Avoid loading dashboard-only libraries into the public application.

### Native/core JavaScript

Prefer browser-native APIs when they solve a small performance problem cleanly: `fetch`, `AbortController`, `IntersectionObserver`, `requestIdleCallback` and passive event listeners can reduce dependency overhead.

Do **not** replace a framework capability with hand-written JavaScript merely for perceived speed. Core JavaScript is appropriate when the problem is small and well-defined; application architecture, caching and rendering strategy usually have much larger performance impact.

### Font optimization

Prefer `next/font` with self-hosted fonts over runtime Google Fonts requests. This reduces external round trips and improves font rendering stability.

### Route prefetching

Use Next.js link prefetching for predictable navigation, but avoid aggressive prefetching of large data sets on constrained mobile connections.

## 4. Backend/API optimization

### Query efficiency

For every slow endpoint:

1. Measure total request duration.
2. Measure database duration.
3. Inspect the generated query.
4. Run `EXPLAIN ANALYZE` where appropriate.
5. Add or refine indexes only when justified.
6. Select only required columns.
7. Eliminate N+1 queries.
8. Paginate large collections.

Avoid `SELECT *` for APIs where the UI only needs a small subset of fields.

### Pagination

Never return unbounded collections from production endpoints. Use limit/offset or cursor pagination depending on the access pattern.

### Response-size reduction

Return compact DTOs/API responses. Do not send large nested database records when a summary is enough for the current UI.

### Parallel backend work

Independent database and external-service operations should run concurrently. Non-critical work should not block the initial response.

### External API latency

Measure third-party dependencies independently. Payment, OTP, analytics, maps, email and other integrations should have explicit timeouts and should not unnecessarily block public page rendering.

## 5. Caching strategy

Caching should be based on data volatility.

| Data | Recommended strategy |
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

For public data, Next.js server-side caching/revalidation can prevent every visitor from executing the same database query.

## 6. Database connection management

For serverless workloads, avoid opening a new database connection unnecessarily on every request. Reuse clients where safe and configure connection pooling appropriately for the database/provider.

## 7. CDN and static delivery

Static assets should be served through the CDN with long-lived caching for immutable files. User-facing assets should be compressed and versioned. Large media should not unnecessarily pass through application server functions.

## 8. Core Web Vitals targets

Use these as production performance guardrails:

| Metric | Target |
|---|---:|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTFB | Preferably < 800ms |

Measure separately on mobile and desktop.

## 9. Observability

Every important API should expose enough telemetry to identify the slow layer:

```text
request
├── total duration
├── database duration
├── external API duration
├── response size
└── HTTP status
```

The objective is to turn a statement such as “the website is slow” into a measurable diagnosis such as:

```text
/events       1,850 ms
  ├─ DB       1,430 ms
  ├─ external     0 ms
  └─ serialize   80 ms
```

## 10. Performance debugging workflow

1. Reproduce the slow page.
2. Open the browser Network panel.
3. Identify the slowest document/API request.
4. Measure TTFB and response size.
5. Trace the request into the backend.
6. Measure database and external-service time.
7. Inspect query plans.
8. Optimize the highest-impact bottleneck.
9. Rebuild and deploy.
10. Compare before/after metrics.

## 11. Interview-ready explanation

**Question: How would you optimize a slow Next.js + PostgreSQL application?**

A strong answer:

> “I would first establish a performance baseline instead of optimizing blindly. I would inspect the browser waterfall and measure TTFB, LCP, payload sizes and API latency. On the backend I would profile database queries, use `EXPLAIN ANALYZE`, add targeted indexes, eliminate N+1 queries and paginate large datasets. I would parallelize independent requests and cache read-heavy public data with appropriate revalidation. On the frontend I would prefer Server Components, reduce client JavaScript, optimize images and fonts, lazy-load below-the-fold content, and use streaming/loading states. I would also keep persistent application chrome outside route-specific rendering so navigation does not recreate it. Finally I would validate the changes using Core Web Vitals and production telemetry.”

## 12. Important engineering principle

**Measure → Identify bottleneck → Optimize → Verify.**

A performance change is not considered successful because the code looks faster. It is successful when measurable latency, payload size, rendering performance or user-perceived responsiveness improves without introducing correctness or security regressions.
