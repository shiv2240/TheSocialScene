import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const bodySchema = z.object({
  phone: z.string().min(8).max(20),
});

const OTP_SESSION_COOKIE = 'tss_otp_session';
const OTP_PHONE_COOKIE = 'tss_otp_phone';
const OTP_LAST_SENT_COOKIE = 'tss_otp_last_sent';
const OTP_TTL_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

function normalizeIndianPhone(value: string) {
  const raw = value.trim().replace(/[\s()-]/g, '');
  if (/^\+91\d{10}$/.test(raw)) return raw;
  if (/^91\d{10}$/.test(raw)) return `+${raw}`;
  if /^\d{10}$/.test(raw)) return `+91${raw}`;
  throw new Error('Enter a valid 10-digit Indian mobile number.');
}

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid mobile number.' }, { status: 400 });
    }

    const phone = normalizeIndianPhone(parsed.data.phone);
    const lastSent = Number(request.cookies.get(OTP_LAST_SENT_COOKIE)?.value ?? 0);
    if (lastSent && Date.now() - lastSent < RESEND_COOLDOWN_SECONDS * 1000) {
      return NextResponse.json({ error: 'Please wait before requesting another OTP.' }, { status: 429 });
    }

    const apiKey = process.env.TWOFACTOR_API_KEY;
    const templateName = process.env.TWOFACTOR_OTP_TEMPLATE_NAME || 'The Social Scene OTP';
    if (!apiKey) {
      return NextResponse.json({ error: 'OTP service is not configured.' }, { status: 500 });
    }

    const endpoint = `https://2factor.in/API/V1/${encodeURIComponent(apiKey)}/SMS/${encodeURIComponent(phone)}/AUTOGEN/${encodeURIComponent(templateName)}`;
    const providerResponse = await fetch(endpoint, { cache: 'no-store' });
    const providerBody = await providerResponse.json().catch(() => null);

    const providerStatus = String(providerBody?.Status ?? providerBody?.status ?? '').toLowerCase();
    const sessionId = providerBody?.Details ?? providerBody?.details;

    if (!providerResponse.ok || providerStatus !== 'success' || !sessionId) {
      return NextResponse.json({ error: 'Unable to send OTP. Please try again.' }, { status: 502 });
    }

    const response = NextResponse.json({
      ok: true,
      phone: `${phone.slice(0, 3)}******${phone.slice(-2)}`,
      expiresIn: OTP_TTL_SECONDS,
    });

    response.cookies.set(OTP_SESSION_COOKIE, String(sessionId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: OTP_TTL_SECONDS,
      path: '/',
    });
    response.cookies.set(OTP_PHONE_COOKIE, phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: OTP_TTL_SECONDS,
      path: '/',
    });
    response.cookies.set(OTP_LAST_SENT_COOKIE, String(Date.now()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: RESEND_COOLDOWN_SECONDS,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to send OTP.' },
      { status: 500 },
    );
  }
}
