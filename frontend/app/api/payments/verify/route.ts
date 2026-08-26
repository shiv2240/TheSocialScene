import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function fetchRazorpayPayment(paymentId: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured on the server.');

  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    cache: 'no-store',
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.description || 'Unable to verify payment status with Razorpay.');
  return body as { id: string; order_id?: string; amount?: number; currency?: string; status?: string; captured?: boolean };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentFirebaseUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const { registrationId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = await request.json();
    if (!registrationId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json({ error: 'Incomplete payment verification payload.' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('Razorpay secret is not configured on the server.');

    const supabase = getSupabaseAdmin();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id,registration_id,user_id,razorpay_order_id,amount,currency,status')
      .eq('registration_id', registrationId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ error: 'Payment order not found.' }, { status: 404 });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('firebase_uid', user.uid)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.id !== order.user_id) {
      return NextResponse.json({ error: 'You cannot verify this payment.' }, { status: 403 });
    }

    if (order.razorpay_order_id !== razorpayOrderId) {
      return NextResponse.json({ error: 'Payment order mismatch.' }, { status: 400 });
    }

    const expected = crypto.createHmac('sha256', secret).update(`${order.razorpay_order_id}|${razorpayPaymentId}`).digest('hex');
    if (!safeEqualHex(expected, razorpaySignature)) {
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
    }

    if (order.status === 'COMPLETED') {
      const { data: ticket } = await supabase.from('tickets').select('ticket_code').eq('registration_id', registrationId).maybeSingle();
      return NextResponse.json({ success: true, ticketCode: ticket?.ticket_code, alreadyProcessed: true });
    }

    // A valid checkout signature is necessary but not sufficient for fulfillment.
    // Confirm Razorpay reports the exact order, amount, currency and captured status.
    const payment = await fetchRazorpayPayment(razorpayPaymentId);
    const expectedAmountPaise = Math.round(Number(order.amount) * 100);

    if (payment.id !== razorpayPaymentId || payment.order_id !== order.razorpay_order_id) {
      return NextResponse.json({ error: 'Razorpay payment/order mismatch.' }, { status: 400 });
    }
    if (Number(payment.amount) !== expectedAmountPaise) {
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
    }
    if (String(payment.currency || '').toUpperCase() !== String(order.currency || 'INR').toUpperCase()) {
      return NextResponse.json({ error: 'Payment currency mismatch.' }, { status: 400 });
    }
    if (payment.status !== 'captured' && payment.captured !== true) {
      return NextResponse.json({ error: 'Payment has not been captured yet. Please wait for confirmation.' }, { status: 409 });
    }

    const { data: confirmation, error: confirmationError } = await supabase.rpc('confirm_paid_registration', {
      p_registration_id: registrationId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_order_id: razorpayOrderId,
      p_razorpay_signature: razorpaySignature,
    });
    if (confirmationError) {
      const message = confirmationError.message || 'Unable to confirm registration.';
      return NextResponse.json({ error: message }, { status: message.includes('SOLD_OUT') ? 409 : 500 });
    }

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ status: 'COMPLETED', razorpay_signature: razorpaySignature, updated_at: new Date().toISOString() })
      .eq('id', order.id)
      .neq('status', 'COMPLETED');
    if (orderUpdateError) throw orderUpdateError;

    const { error: paymentError } = await supabase.from('payments').upsert({
      order_id: order.id,
      provider: 'RAZORPAY',
      provider_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
      amount: order.amount,
      status: 'CAPTURED',
      raw_response: payment,
    }, { onConflict: 'provider_payment_id' });
    if (paymentError) throw paymentError;

    return NextResponse.json({ success: true, ticketCode: confirmation.ticket_code, registrationId });
  } catch (error) {
    console.error('Razorpay verify error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Payment verification failed.' }, { status: 500 });
  }
}
