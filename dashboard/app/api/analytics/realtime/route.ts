import { NextResponse } from 'next/server';
import { createSign } from 'node:crypto';
import { requireAnalyticsAccess } from '@/lib/analytics-auth';

type TokenResponse = { access_token?: string };
type MetricValue = { value?: string };
type DimensionValue = { value?: string };
type RealtimeRow = { dimensionValues?: DimensionValue[]; metricValues?: MetricValue[] };
type RealtimeResponse = { rows?: RealtimeRow[]; totals?: Array<{ metricValues?: MetricValue[] }> };

function base64Url(value: string): string { return Buffer.from(value).toString('base64url'); }

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({ iss: email, scope: 'https://www.googleapis.com/auth/analytics.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(privateKey).toString('base64url');
  const assertion = `${header}.${payload}.${signature}`;
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  const body = await response.json() as TokenResponse;
  if (!response.ok || !body.access_token) throw new Error('Unable to authenticate with Google Analytics.');
  return body.access_token;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAnalyticsAccess(['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER']);
    if (!auth.ok) return auth.response;

    const provider = new URL(request.url).searchParams.get('provider') === 'firebase' ? 'firebase' : 'google';
    const propertyId = provider === 'firebase' ? process.env.FIREBASE_GA4_PROPERTY_ID : process.env.GA4_PROPERTY_ID;
    const serviceEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!propertyId || !serviceEmail || !privateKey) return NextResponse.json({ configured: false, provider, error: `${provider === 'firebase' ? 'Firebase/GA4' : 'Google Analytics'} realtime analytics is not configured.` });

    const accessToken = await getAccessToken(serviceEmail, privateKey);
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runRealtimeReport`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ dimensions: [{ name: 'unifiedScreenName' }], metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }], limit: 10 }) });
    const body = await response.json() as RealtimeResponse & { error?: { message?: string } };
    if (!response.ok) throw new Error(body.error?.message || 'Unable to load realtime analytics.');
    const activeUsers = Number(body.totals?.[0]?.metricValues?.[0]?.value ?? 0);
    const pageViews = Number(body.totals?.[0]?.metricValues?.[1]?.value ?? 0);
    const pages = (body.rows ?? []).map((row) => ({ page: row.dimensionValues?.[0]?.value || 'Unknown', activeUsers: Number(row.metricValues?.[0]?.value ?? 0), pageViews: Number(row.metricValues?.[1]?.value ?? 0) })).sort((a, b) => b.activeUsers - a.activeUsers);
    return NextResponse.json({ configured: true, provider, activeUsers, pageViews, pages, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[REALTIME ANALYTICS][GET]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load realtime analytics.' }, { status: 500 });
  }
}
