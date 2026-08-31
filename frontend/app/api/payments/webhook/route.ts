import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendTicketConfirmationEmail } from '@/lib/email/ticket';

export const runtime = 'nodejs';

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function refundRazorpayPayment(paymentId: string, amount: number) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured on the server.');
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.description || 'Unable to refund late payment.');
  return body;
}

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 503 });
  const rawBody = await request.text();
  const received = request.headers.get('x-razorpay-signature') || '';
  const eventId = request.headers.get('x-razorpay-event-id') || '';
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (!safeEqualHex(expected, received)) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  if (!eventId) return NextResponse.json({ error: 'Missing Razorpay event id.' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  try {
    const payload = JSON.parse(rawBody);
    const eventType = String(payload?.event || 'UNKNOWN');
    const payment = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;
    const orderId = payment?.order_id || orderEntity?.id;
    const paymentId = payment?.id || null;

    const { data: existingEvent, error: existingEventError } = await supabase.from('payment_webhook_events').select('id,status,updated_at').eq('razorpay_event_id', eventId).maybeSingle();
    if (existingEventError) throw existingEventError;
    if (existingEvent?.status === 'PROCESSED') return NextResponse.json({ ok: true, duplicate: true });
    if (existingEvent?.status === 'PROCESSING') {
      const ageMs = existingEvent.updated_at ? Date.now() - new Date(existingEvent.updated_at).getTime() : 0;
      if (ageMs < 10 * 60 * 1000) return NextResponse.json({ ok: true, duplicate: true });
      const { error: reclaimError } = await supabase.from('payment_webhook_events').update({ status: 'PROCESSING', updated_at: new Date().toISOString() }).eq('id', existingEvent.id).eq('status', 'PROCESSING');
      if (reclaimError) throw reclaimError;
    }

    const auditPayload = { event: eventType, order_id: orderId || null, payment_id: paymentId, amount: payment?.amount ?? null, currency: payment?.currency ?? null, payment_status: payment?.status ?? null, created_at: payment?.created_at ?? payload?.created_at ?? null };
    if (existingEvent?.status === 'FAILED') {
      const { error } = await supabase.from('payment_webhook_events').update({ status: 'PROCESSING', payload: auditPayload, updated_at: new Date().toISOString() }).eq('id', existingEvent.id);
      if (error) throw error;
    } else if (!existingEvent) {
      const { error } = await supabase.from('payment_webhook_events').insert({ razorpay_event_id: eventId, event_type: eventType, status: 'PROCESSING', payload: auditPayload });
      if (error) {
        const { data: concurrent } = await supabase.from('payment_webhook_events').select('status').eq('razorpay_event_id', eventId).maybeSingle();
        if (concurrent?.status === 'PROCESSED' || concurrent?.status === 'PROCESSING') return NextResponse.json({ ok: true, duplicate: true });
        throw error;
      }
    }

    if (!orderId) {
      await supabase.from('payment_webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('razorpay_event_id', eventId);
      return NextResponse.json({ ok: true });
    }

    const { data: order, error: orderError } = await supabase.from('orders').select('id,registration_id,amount,currency,status,expires_at').eq('razorpay_order_id', orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order) {
      await supabase.from('payment_webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('razorpay_event_id', eventId);
      return NextResponse.json({ ok: true });
    }

    const isPaidEvent = eventType === 'payment.captured' || eventType === 'order.paid';
    if (isPaidEvent) {
      if (!paymentId || payment?.status !== 'captured') throw new Error('Razorpay paid webhook does not contain a captured payment.');
      if (Number(payment.amount) !== Math.round(Number(order.amount) * 100)) throw new Error('Webhook payment amount does not match the local order amount.');
      if (String(payment.currency || '').toUpperCase() !== String(order.currency || 'INR').toUpperCase()) throw new Error('Webhook payment currency does not match the local order currency.');

      const expired = order.status !== 'PENDING' || (order.expires_at ? new Date(order.expires_at) <= new Date() : false);
      if (expired) {
        await refundRazorpayPayment(paymentId, Math.round(Number(order.amount) * 100));
        await supabase.from('orders').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', order.id).neq('status', 'COMPLETED');
        await supabase.from('registrations').update({ status: 'CANCELLED', updated_at: new Date().toISOString() }).eq('id', order.registration_id).eq('status', 'PENDING');
        await supabase.from('payments').upsert({ order_id: order.id, provider: 'RAZORPAY', provider_payment_id: paymentId, razorpay_order_id: orderId, amount: order.amount, status: 'REFUNDED', raw_response: { id: payment.id, order_id: payment.order_id, amount: payment.amount, currency: payment.currency, status: payment.status, method: payment.method, late_auth: true } }, { onConflict: 'provider_payment_id' });
        console.warn('[RAZORPAY WEBHOOK] late payment refunded', { eventId, orderId, paymentId });
      } else {
        const { data: confirmation, error: confirmationError } = await supabase.rpc('confirm_paid_registration', { p_registration_id: order.registration_id, p_razorpay_payment_id: paymentId, p_razorpay_order_id: orderId });
        if (confirmationError) throw confirmationError;
        const { error: orderUpdateError } = await supabase.from('orders').update({ status: 'COMPLETED', updated_at: new Date().toISOString() }).eq('id', order.id).neq('status', 'COMPLETED');
        if (orderUpdateError) throw orderUpdateError;
        const safePaymentMetadata = { id: payment.id, order_id: payment.order_id, amount: payment.amount, currency: payment.currency, status: payment.status, method: payment.method, created_at: payment.created_at };
        const { error: paymentError } = await supabase.from('payments').upsert({ order_id: order.id, provider: 'RAZORPAY', provider_payment_id: paymentId, razorpay_order_id: orderId, amount: order.amount, status: 'CAPTURED', raw_response: safePaymentMetadata }, { onConflict: 'provider_payment_id' });
        if (paymentError) throw paymentError;
        const ticketCode = confirmation?.ticket_code as string | undefined;
        if (ticketCode) await sendTicketConfirmationEmail({ registrationId: order.registration_id, ticketCode }).catch((error: unknown) => console.error('[TICKET EMAIL] Webhook email failed:', error));
        console.info('[RAZORPAY WEBHOOK] payment confirmed', { eventId, eventType, orderId, paymentId, ticketCode });
      }
    } else if (eventType === 'payment.failed') {
      await supabase.from('orders').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', order.id).neq('status', 'COMPLETED');
      if (paymentId) await supabase.from('payments').upsert({ order_id: order.id, provider: 'RAZORPAY', provider_payment_id: paymentId, razorpay_order_id: orderId, amount: order.amount, status: 'FAILED', raw_response: { id: payment.id, order_id: payment.order_id, amount: payment.amount, currency: payment.currency, status: payment.status, error_code: payment.error_code, error_description: payment.error_description } }, { onConflict: 'provider_payment_id' });
    }

    await supabase.from('payment_webhook_events').update({ status: 'PROCESSED', processed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('razorpay_event_id', eventId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    await supabase.from('payment_webhook_events').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('razorpay_event_id', eventId);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
