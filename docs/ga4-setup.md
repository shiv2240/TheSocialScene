# GA4 Setup

GA4 Property ID: `551255324`

## What Shiv needs to provide

The Property ID is enough to identify the GA4 property for the server-side Analytics Data API integration. It is **not** the same as the web Measurement ID.

### 1. Web Measurement ID

In Google Analytics:

**Admin → Data collection and modification → Data streams → Web stream**

Copy the Measurement ID, which looks like:

`G-XXXXXXXXXX`

This will be used by the public website for GA4 collection.

### 2. Google Analytics Data API access

For the dashboard to read GA4 reports, create/use a Google Cloud service account and enable the **Google Analytics Data API** in the corresponding Google Cloud project.

Grant the service-account email access to the GA4 property with the minimum role needed to read reports (Viewer is normally sufficient).

Do not commit the service-account JSON file to GitHub.

### 3. Production environment variables

Public frontend:

`NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

Server/dashboard:

`GA4_PROPERTY_ID=551255324`
`GA4_CLIENT_EMAIL=...`
`GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`

The private key must remain server-side and must never use a `NEXT_PUBLIC_` prefix.

## Verification checklist

1. Add the Measurement ID to the public frontend production environment.
2. Deploy.
3. Open the public website and trigger a page view.
4. Verify the request/events in GA4 Realtime/DebugView.
5. Add the service account to the GA4 property.
6. Add the three server-side variables to the dashboard/server production environment.
7. Test the dashboard analytics endpoint.
8. Confirm a Google API outage returns a controlled error and does not break the dashboard.

## Privacy

Never send email, phone number, Firebase UID, ticket code, or payment identifiers to GA4. Use anonymous event metadata such as event slug, category, currency, value, and quantity where appropriate.
