# Frontend Agent Notes

The frontend is a Next.js `16.3.2` application using the App Router and React `19.2.8`.

## Current system boundaries

- Public identity uses Firebase Authentication.
- Phone OTP verification uses 2Factor.
- Relational application data is stored in Supabase PostgreSQL.
- Payments use Razorpay.
- Transactional email uses Resend.
- Hosting is Vercel.

## Before changing Next.js code

Check the installed Next.js documentation under `node_modules/next/dist/docs/` and follow the conventions of the installed version. Do not assume APIs from older Next.js versions are valid.

## Performance rules

- Preserve App Router navigation/prefetch behavior.
- Avoid unnecessary client components.
- Keep public data cacheable where business correctness permits.
- Do not reintroduce authentication races between Firebase state and the server session cookie.
- Preserve the existing global floating/rounded Navbar behavior.

## Security rules

- Never expose service-role credentials or Firebase Admin credentials to the browser.
- Validate API input server-side.
- Keep payment verification server-side.
- Treat Supabase RLS/RPC authorization as part of the security boundary.

## Documentation

When architecture or user-visible behavior changes, update the relevant Markdown documentation in the repository. Mermaid diagrams are preferred for flows; current screenshots may be stored under `docs/images/` when available.
