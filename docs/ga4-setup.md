# GA4 Setup

GA4 Property ID: `551255324`

Web Measurement ID: `G-V3MYL05JWV`

## What these IDs mean

- **Property ID** `551255324` identifies the GA4 property for the server-side Analytics Data API.
- **Measurement ID** `G-V3MYL05JWV` identifies the web data stream and is safe to expose through a `NEXT_PUBLIC_` environment variable.

## Production environment variables

Public frontend:

`NEXT_PUBLIC_GA_MEASUREMENT_ID=G-V3MYL05JWV`

Server/dashboard:

`GA4_PROPERTY_ID=551255324`
`GA4_CLIENT_EMAIL=...`
`GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`

The private key must remain server-side and must never use a `NEXT_PUBLIC_` prefix. Never commit the service-account JSON file or private key to GitHub.

## Google Analytics Data API access

For the dashboard to read GA4 reports, create/use a Google Cloud service account and enable the **Google Analytics Data API** in the corresponding Google Cloud project. Grant the service-account email access to GA4 property `551255324` with the minimum role needed to read reports (Viewer is normally sufficient).

## Verification checklist

1. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-V3MYL05JWV` to the public frontend production environment.
2. Deploy the public frontend.
3. Open the public website and trigger a page view.
4. Verify the event in GA4 Realtime/DebugView.
5. Add the service account to GA4 property `551255324`.
6. Add `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, and `GA4_PRIVATE_KEY` to the dashboard/server production environment.
7. Test the dashboard analytics endpoint.
8. Confirm a Google API outage returns a controlled error and does not break the dashboard.

## Privacy

Never send email, phone number, Firebase UID, ticket code, or payment identifiers to GA4. Use anonymous event metadata such as event slug, category, currency, value, and quantity where appropriate.
