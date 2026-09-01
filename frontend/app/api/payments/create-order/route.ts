import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendTicketConfirmationEmail } from '@/lib/email/ticket';

export const runtime = 'nodejs';

const CHECKOUT_TIMEOUT_SECONDS = 10 * 60;
const requestSchema = z.object({ slug: z.string().trim().min(1) });

function getRazorpayAuth() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured on the server.');
  return { keyId, auth: Buffer.from(`${keyId}:${keySecret}`).toString('base64') };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentFirebaseUser();
    if (!user) return NextResponse.json({ error: 'Please log in before registering.' }, { status: 401 });
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'A valid event slug is required.' }, { status: 400 });
    const { slug } = parsed.data;

    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase.from('profiles').select('id, full_name, email, phone').eq('firebase_uid', user.uid).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: 'Your profile is not ready yet. Please sign in again.' }, { status: 400 });
    if (!profile.email) return NextResponse.json({ error: 'Please complete email authentication before booking.' }, { status: 409 });

    const { data: event, error: eventError } = await supabase.from('events').select('id,title,price,currency,capacity,registered_count,status,registration_open').eq('slug', slug).eq('status', 'PUBLISHED').maybeSingle();
    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    if (!event.registration_open || event.registered_count >= event.capacity) return NextResponse.json({ error: 'Registration is closed or the event is sold out.' }, { status: 409 });

    const { data: confirmedRegistration, error: confirmedError } = await supabase.from('registrations').select('id').eq('event_id', event.id).eq('user_id', profile.id).eq('status', 'CONFIRMED').maybeSingle();
    if (confirmedError) throw confirmedError;
    if (confirmedRegistration) {
      const { data: ticket } = await supabase.from('tickets').select('ticket_code').eq('registration_id', confirmedRegistration.id).maybeSingle();
      return NextResponse.json({ alreadyRegistered: true, ticketCode: ticket?.ticket_code });
    }

    const { data: registrationData, error: registrationError } = await supabase.rpc('create_pending_registration', { p_event_id: event.id, p_user_id: profile.id, p_price: event.price, p_currency: event.currency });
    if (registrationError) throw registrationError;
    const registrationId = registrationData.registration_id as string;

    if (Number(event.price) === 0) {
      const { data: confirmation, error: confirmError } = await supabase.rpc('confirm_paid_registration', { p_registration_id: registrationId });
      if (confirmError) throw confirmError;
      const ticketCode = confirmation.ticket_code as string;
      await sendTicketConfirmationEmail({ registrationId, ticketCode }).catch((error: unknown) => console.error('[TICKET EMAIL] Free registration email failed:', error));
      return NextResponse.json({ free: true, registrationId, ticketCode });
    }

    const existing = await supabase.from('orders').select('id,registration_id,razorpay_order_id,amount,currency,status,expires_at').eq('registration_id', registrationId).eq('status', 'PENDING').maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data?.razorpay_order_id) {
      const existingExpiry = existing.data.expires_at ? new Date(existing.data.expires_at) : null;
      if (!existingExpiry || existingExpiry > new Date()) {
        const { keyId } = getRazorpayAuth();
        return NextResponse.json({ keyId, orderId: existing.data.razorpay_order_id, amount: Math.round(Number(existing.data.amount) * 100), currency: existing.data.currency, registrationId, eventTitle: event.title, expiresAt: existing.data.expires_at, timeoutSeconds: CHECKOUT_TIMEOUT_SECONDS, prefill: { name: profile.full_name, email: profile.email, contact: profile.phone || undefined } });
      }
      await supabase.from('orders').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', existing.data.id).eq('status', 'PENDING');
    }

    const { keyId, auth } = getRazorpayAuth();
    const receipt = `tss_${registrationId.slice(0, 12)}`;
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(Number(event.price) * 100), currency: event.currency || 'INR', receipt, notes: { registration_id: registrationId, event_id: event.id, firebase_uid: user.uid } }),
      cache: 'no-store',
    });
    const razorpayOrder = await razorpayResponse.json();
    if (!razorpayResponse.ok) return NextResponse.json({ error: razorpayOrder?.error?.description || 'Unable to create Razorpay order.' }, { status: 502 });

    const localExpiry = new Date(Date.now() + CHECKOUT_TIMEOUT_SECONDS * 1000).toISOString();
    const { error: orderError } = await supabase.from('orders').insert({ registration_id: registrationId, user_id: profile.id, amount: event.price, currency: event.currency || 'INR', status: 'PENDING', razorpay_order_id: razorpayOrder.id, receipt, expires_at: localExpiry });
    if (orderError) throw orderError;

    return NextResponse.json({ keyId, orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, registrationId, eventTitle: event.title, expiresAt: localExpiry, timeoutSeconds: CHECKOUT_TIMEOUT_SECONDS, prefill: { name: profile.full_name, email: profile.email, contact: profile.phone || undefined } });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start payment.' }, { status: 500 });
  }
}
