import { redirect, notFound } from 'next/navigation';
import { getCurrentFirebaseUser } from '@/lib/firebase/session';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import CheckoutClient from './CheckoutClient';

interface Props { searchParams: Promise<{ event?: string }> }

export default async function CheckoutPage({ searchParams }: Props) {
  const { event: slug } = await searchParams;
  if (!slug) notFound();

  const user = await getCurrentFirebaseUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout?event=${slug}`)}`);

  const supabase = getSupabaseAdmin();
  const { data: event } = await supabase
    .from('events')
    .select('id, title, slug, price, currency, capacity, registered_count, registration_open, status, cover_image, start_at, venue:venues(name, address, city)')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (!event) notFound();

  const venue = Array.isArray(event.venue) ? event.venue[0] : event.venue;

  return <CheckoutClient event={{ ...event, venue }} />;
}
