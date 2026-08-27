# Analytics Architecture

The Social Scene should treat Google Analytics 4 (GA4) as a product/marketing analytics source, while Supabase remains the transactional system of record.

## Recommended implementation

- Install GA4 on the public frontend only.
- Use `NEXT_PUBLIC_GA_MEASUREMENT_ID` for the measurement ID.
- Track page views and key funnel events: event_view, registration_cta_click, checkout_started, phone_verification_started, payment_initiated, purchase, ticket_viewed, and ticket_downloaded.
- Include non-PII event metadata such as event ID/slug, category, currency, value, and ticket quantity where appropriate.
- Never send phone numbers, email addresses, names, Firebase UIDs, payment IDs, or QR/ticket codes to GA4.
- Keep admin operational analytics in Supabase/PostgreSQL. GA4 data is complementary and should not replace booking/payment records.

## Admin dashboard

The dashboard can show GA4 data, but production implementation should use the Google Analytics Data API with a server-side service account/OAuth integration rather than exposing Google credentials in the browser.

Useful dashboard cards:

- Users / active users
- Sessions
- Event detail views
- Registration CTA clicks
- Checkout starts
- Purchases
- Conversion rate
- Top event pages
- Traffic source / medium
- Device category
- Landing pages

## Security and privacy

Do not expose GA4 service-account credentials or access tokens to client-side code. Keep them in deployment secrets. Apply least privilege to the Google Analytics property.

For India-focused deployment, review consent/cookie requirements before enabling advertising or Google signals features. Analytics instrumentation must remain free of direct personal identifiers.

## Implementation sequence

1. Add GA4 tracking to the public frontend.
2. Create a typed analytics helper and event taxonomy.
3. Add funnel events at real user actions.
4. Verify events in GA4 DebugView/realtime reporting.
5. Add a server-side GA4 Data API integration for dashboard reporting.
6. Add caching/error handling so a Google API outage never breaks the dashboard.
7. Add date range and event filters.
