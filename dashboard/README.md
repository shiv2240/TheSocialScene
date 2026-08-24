# The Social Scene — Admin Dashboard

Next.js dashboard for event operations, registrations, payments, guest lists, QR scanning, check-ins, analytics and RBAC.

## Local setup

From the repository root:

```bash
cd dashboard
npm install
```

Create the local environment file:

```bash
copy .env.example .env.local
```

On macOS/Linux:

```bash
cp .env.example .env.local
```

Fill the Supabase URL and publishable key, then start:

```bash
npm run dev -- -p 3001
```

Open `http://localhost:3001`.

## Environment

The dashboard currently requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

See [`./.env.example`](./.env.example).

The dashboard uses the same Supabase project as the public frontend. Keep the dashboard environment separate from `frontend/.env.local`.

## Operations

The dashboard supports:

- Event creation and management.
- Guest/registration lists.
- Payment visibility.
- QR ticket scanning.
- Event-aware check-in validation.
- Duplicate check-in prevention.
- Host/admin RBAC.
- Audit and analytics views.

## Production

The dashboard is deployed separately from the public frontend. Configure its environment variables in the dashboard's deployment project before deploying.

For the complete monorepo setup and the frontend authentication/payment environment, see the repository root `README.md`.
