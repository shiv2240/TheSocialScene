import { NextResponse } from 'next/server';
import { createSign } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

type TokenResponse = { access_token?: string };
type DimensionValue = { value?: string };
type MetricValue = { value?: string };
type ReportRow = { dimensionValues?: DimensionValue[]; metricValues?: MetricValue[] };
type ReportResponse = { rows?: ReportRow[] };

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

async function getAccessToken(email: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(privateKey).toString('base64url');
  const assertion = `${header}.${payload}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = await response.json() as TokenResponse;
  if (!response.ok || !body.access_token) {
    throw new Error('Unable to authenticate with Google Analytics.');
  }
  return body.access_token;
}

async function runReport(accessToken: string, propertyId: string, body: Record<string, unknown>): Promise<ReportResponse> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const result = await response.json() as ReportResponse & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || 'Unable to load Google Analytics traffic.');
  return result;
}

export async function GET(request: Request) {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const params = new URL(request.url).searchParams;
    const provider = params.get('provider') === 'firebase' ? 'firebase' : 'google';
    const propertyId = provider === 'firebase' ? process.env.FIREBASE_GA4_PROPERTY_ID : process.env.GA4_PROPERTY_ID;
    const serviceEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!propertyId || !serviceEmail || !privateKey) {
      return NextResponse.json({
        configured: false,
        provider,
        error: `${provider === 'firebase' ? 'Firebase/GA4' : 'Google Analytics'} traffic analytics is not configured.`,
      });
    }

    const accessToken = await getAccessToken(serviceEmail, privateKey);
    const [dailyReport, pagesReport] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date', orderType: 'NUMERIC' } }],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'unifiedPagePathScreen' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'sessions' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews', orderType: 'NUMERIC' } }],
        limit: 20,
      }),
    ]);

    const daily = (dailyReport.rows ?? []).map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? '',
      activeUsers: Number(row.metricValues?.[0]?.value ?? 0),
      sessions: Number(row.metricValues?.[1]?.value ?? 0),
      pageViews: Number(row.metricValues?.[2]?.value ?? 0),
    }));

    const pages = (pagesReport.rows ?? []).map((row) => ({
      page: row.dimensionValues?.[0]?.value || '(not set)',
      activeUsers: Number(row.metricValues?.[0]?.value ?? 0),
      pageViews: Number(row.metricValues?.[1]?.value ?? 0),
      sessions: Number(row.metricValues?.[2]?.value ?? 0),
    }));

    const totals = daily.reduce(
      (acc, row) => ({
        activeUsers: acc.activeUsers + row.activeUsers,
        sessions: acc.sessions + row.sessions,
        pageViews: acc.pageViews + row.pageViews,
      }),
      { activeUsers: 0, sessions: 0, pageViews: 0 },
    );

    return NextResponse.json({
      configured: true,
      provider,
      range: '30daysAgo-today',
      totals,
      daily,
      pages,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ANALYTICS TRAFFIC][GET]', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to load traffic analytics.',
    }, { status: 500 });
  }
}
