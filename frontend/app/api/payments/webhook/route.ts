import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 503 });

  const rawBody = await request.text();
  const received = request.headers.get('x-razorpay-signature') || '';
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const left = Buffer.from(expected, 'hex');
  const right = Buffer.from(received, 'hex');
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const event = payload?.event;
    const payment = payload?.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;

    if (!orderId) return NextResponse.json({ ok: true });

    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, registration_id, amount, status')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    if (error) throw error;
    if (!order) return NextResponse.json({ ok: true });

    if (event === 'payment.captured' || event === 'order.paid') {
      const { data: confirmation, error: confirmationError } = await supabase.rpc('confirm_paid_registration', {
        p_registration_id: order.registration_id,
        p_razorpay_payment_id: paymentId,
        p_razorpay_order_id: orderId,
      });
      if (confirmationError && !confirmationError.message.includes('already')) throw confirmationError;

      await supabase.from('orders').update({ status: 'COMPLETED', updated_at: new Date().toISOString() }).eq('id', order.id);
      if (paymentId) {
        await supabase.from('payments').upsert({
          order_id: order.id,
          provider: 'RAZORPAY',
          provider_payment_id: paymentId,
          razorpay_order_id: orderId,
          amount: order.amount,
          status: 'CAPTURED',
          raw_response: payload,
        }, { onConflict: 'provider_payment_id' });
      }
    } else if (event === 'payment.failed') {
      await supabase.from('orders').update({ status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', order.id).neq('status', 'COMPLETED');
      if (paymentId) {
        await supabase.from('payments').upsert({
          order_id: order.id,
          provider: 'RAZORPAY',
          provider_payment_id: paymentId,
          razorpay_order_id: orderId,
          amount: order.amount,
          status: 'FAILED',
          raw_response: payload,
        }, { onConflict: 'provider_payment_id' });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
