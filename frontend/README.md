# The Social Scene — Public Frontend

Next.js 16 + TypeScript application for event discovery, phone-first authentication, profiles, checkout, tickets and QR attendance.

## Local setup

From the repository root:

```bash
cd frontend
npm install
```

Create the local environment file:

```bash
copy .env.example .env.local
```

On macOS/Linux, use:

```bash
cp .env.example .env.local
```

Fill **all required values** in `.env.local`. Never commit this file.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Required local integrations

The local authentication flow requires:

- Supabase project URL + publishable key.
- Supabase service-role key for server API routes.
- Firebase Web configuration.
- Firebase Admin service-account credentials.
- 2Factor API key and the approved OTP template name.

The local payment flow uses Razorpay **Test Mode**:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

See [`./.env.example`](./.env.example) for the complete variable list.

## Authentication flow

```text
Phone number
  → 2Factor SMS OTP
  → 2Factor OTP session ID verification
  → Firebase user/session
  → Supabase profile
```

Email is optional. A user can add or change the email from Profile. Firebase sends the verification email; after verification, the verified email is synchronized to Supabase.

If the browser Firebase session is missing but the server session cookie is valid, the email-verification flow can restore the browser session through `/api/auth/client-token` before calling Firebase email verification APIs.

## Payment → ticket → QR flow

```text
Event
  → registration
  → Razorpay test checkout
  → server-side signature verification
  → confirmed registration
  → ticket + QR
  → dashboard scanner
```

## Useful commands

```bash
npm run dev
npm run build
npm run start
```

For the complete monorepo setup, see the repository root `README.md`.
