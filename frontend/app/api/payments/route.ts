import { NextResponse } from 'next/server';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  provider_payment_id: string | null;
  amount: number;
  status: 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  created_at: string;
  orders: {
    id: string;
    registration_id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    registrations: {
      registration_number: string;
      event_id: string;
      status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
      events: { title: string; slug: string } | null;
    } | null;
  } | null;
};

type OrderRow = {
  id: string;
  registration_id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  created_at: string;
  registrations: {
    registration_number: string;
    event_id: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
    events: { title: string; slug: string } | null;
  } | null;
};

export async function GET() {
  try {
    const firebaseUser = await getCurrentFirebaseUser();
    if (!firebaseUser) return NextResponse.json({ error: 'Please sign in to view payments.' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('firebase_uid', firebaseUser.uid)
      .maybeSingle();

    if (profileError || !profile) return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });

    const [{ data: payments, error: paymentsError }, { data: orders, error: ordersError }] = await Promise.all([
      supabase
        .from('payments')
        .select('id, order_id, provider, provider_payment_id, amount, status, created_at, orders!inner(id, registration_id, amount, currency, status, registrations!inner(registration_number, event_id, status, events:event_id(title, slug)))')
        .eq('orders.user_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('id, registration_id, amount, currency, status, created_at, registrations!inner(registration_number, event_id, status, events:event_id(title, slug))')
        .eq('user_id', profile.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false }),
    ]);

    if (paymentsError) throw paymentsError;
    if (ordersError) throw ordersError;

    const typedPayments = (payments ?? []) as unknown as PaymentRow[];
    const typedOrders = (orders ?? []) as unknown as OrderRow[];
    const paymentOrderIds = new Set(typedPayments.map((payment) => payment.order_id));

    const records = [
      ...typedPayments.map((payment) => ({
        id: payment.id,
        order_id: payment.order_id,
        registration_id: payment.orders?.registration_id ?? null,
        registration_number: payment.orders?.registrations?.registration_number ?? null,
        event_id: payment.orders?.registrations?.event_id ?? null,
        event_title: payment.orders?.registrations?.events?.title ?? 'Event',
        event_slug: payment.orders?.registrations?.events?.slug ?? null,
        amount: Number(payment.amount),
        currency: payment.orders?.currency ?? 'INR',
        status: payment.status === 'CAPTURED' ? 'SUCCESS' : payment.status === 'AUTHORIZED' ? 'PENDING' : payment.status,
        provider_payment_id: payment.provider_payment_id,
        created_at: payment.created_at,
      })),
      ...typedOrders.filter((order) => !paymentOrderIds.has(order.id)).map((order) => ({
        id: `order-${order.id}`,
        order_id: order.id,
        registration_id: order.registration_id,
        registration_number: order.registrations?.registration_number ?? null,
        event_id: order.registrations?.event_id ?? null,
        event_title: order.registrations?.events?.title ?? 'Event',
        event_slug: order.registrations?.events?.slug ?? null,
        amount: Number(order.amount),
        currency: order.currency,
        status: 'PENDING',
        provider_payment_id: null,
        created_at: order.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ payments: records });
  } catch (error) {
    console.error('[USER PAYMENTS][GET]', error);
    return NextResponse.json({ error: 'Unable to load payments.' }, { status: 500 });
  }
}
