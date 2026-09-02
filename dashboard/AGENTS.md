# Dashboard Agent Notes

The dashboard is a Next.js `16.3.2` application using React `19.2.8` and Supabase SSR authentication.

## Current system boundaries

- PostgreSQL is managed by Supabase.
- Dashboard authentication uses Supabase SSR.
- Authorization is multi-role RBAC with server-side permission checks.
- Payments originate from Razorpay records/webhooks.
- Ticket validation/check-in is database-backed.
- Analytics are operational metrics; GA4 is a separate telemetry source.

## Working rules

- Read the installed Next.js documentation before making framework-level changes.
- Enforce authorization on the server/API, not only in UI components.
- Treat role assignments as a collection because users can hold multiple roles.
- Keep access status separate from roles.
- Preserve audit logging for sensitive administrative mutations.
- Do not expose service-role credentials client-side.
- Test scanner behavior on mobile browsers when changing scanner code.

## Performance

Avoid blocking dashboard navigation with unnecessary sequential requests. Preserve route loading states and reuse cached data where it is safe to do so.

## Documentation

Update the relevant Markdown files when the implemented dashboard architecture, routes, permissions or operational flows change. Use Mermaid for architecture/sequence visuals and only reference screenshots that represent the current UI.
