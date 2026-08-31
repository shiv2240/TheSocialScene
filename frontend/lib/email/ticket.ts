import { getSupabaseAdmin } from '@/lib/supabase/admin';

type TicketEmailData = {
  registrationId: string;
  ticketCode: string;
};

type EventRow = {
  title: string | null;
  start_at: string | null;
  venue: { name: string | null; address: string | null; city: string | null } | { name: string | null; address: string | null; city: string | null }[] | null;
};

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  };
  return value.replace(/[&<>\'"]/g, (character) => entities[character] ?? character);
}

function getVenue(venue: EventRow['venue']) {
  if (!venue) return null;
  return Array.isArray(venue) ? venue[0] ?? null : venue;
}

export async function sendTicketConfirmationEmail({ registrationId, ticketCode }: TicketEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'The Social Scene <no-reply@thesocialscene.club>';
  if (!apiKey) {
    console.warn('[TICKET EMAIL] RESEND_API_KEY is not configured; skipping email delivery.');
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: registration, error } = await supabase
    .from('registrations')
    .select('id, user_id, events:event_id(title, start_at, venue:venue_id(name, address, city)), profiles:user_id(email, full_name)')
    .eq('id', registrationId)
    .maybeSingle();

  if (error) throw error;
  if (!registration) throw new Error('Registration not found for ticket email.');

  const profile = Array.isArray(registration.profiles) ? registration.profiles[0] : registration.profiles;
  const event = Array.isArray(registration.events) ? registration.events[0] : registration.events;
  const recipient = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : '';
  if (!recipient) {
    console.warn('[TICKET EMAIL] No email address is available for registration', registrationId);
    return;
  }

  const typedEvent = event as EventRow | null;
  const venue = getVenue(typedEvent?.venue ?? null);
  const eventTitle = typedEvent?.title || 'Your The Social Scene Event';
  const eventDate = typedEvent?.start_at
    ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(typedEvent.start_at))
    : 'Date and time will be announced';
  const venueText = [venue?.name, venue?.address, venue?.city].filter(Boolean).join(', ') || 'Venue details will be announced';
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.thesocialscene.club').replace(/\/$/, '');
  const ticketUrl = `${appUrl}/tickets`;
  const safeName = escapeHtml(profile?.full_name || 'The Social Scene Member');
  const safeEventTitle = escapeHtml(eventTitle);
  const safeEventDate = escapeHtml(eventDate);
  const safeVenue = escapeHtml(venueText);
  const safeTicketCode = escapeHtml(ticketCode);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `ticket-confirmation-${registrationId}`,
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: `Your ticket is confirmed — ${eventTitle}`,
      tags: [
        { name: 'category', value: 'ticket-confirmation' },
        { name: 'registration_id', value: registrationId },
      ],
      html: `<!doctype html><html><body style="margin:0;background:#090a0f;font-family:Arial,sans-serif;color:#f5f5f5;padding:32px"><div style="max-width:620px;margin:auto;background:#15151d;border:1px solid #2a2a36;border-radius:20px;overflow:hidden"><div style="padding:28px 30px;background:#1c1827"><div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#ff8b3d">THE SOCIAL SCENE</div><h1 style="margin:10px 0 0;font-size:28px">Your ticket is confirmed</h1></div><div style="padding:30px"><p style="font-size:15px">Hi ${safeName},</p><p style="color:#b8b8c5;line-height:1.6">Your registration has been confirmed. Your ticket is also available in your account.</p><div style="margin:24px 0;padding:22px;border-radius:16px;background:#0d0e15;border:1px solid #30303d"><div style="font-size:12px;color:#8f8f9f;text-transform:uppercase;letter-spacing:1px">Event</div><div style="font-size:22px;font-weight:800;margin-top:6px">${safeEventTitle}</div><div style="margin-top:16px;color:#c8c8d0">${safeEventDate}</div><div style="margin-top:8px;color:#c8c8d0">${safeVenue}</div><div style="margin-top:18px;font-family:monospace;font-size:14px;color:#ffad66">Ticket: ${safeTicketCode}</div></div><a href="${ticketUrl}" style="display:inline-block;padding:13px 20px;background:#ff6a3d;color:#fff;text-decoration:none;border-radius:12px;font-weight:700">View My Ticket</a><p style="margin-top:24px;color:#8f8f9f;font-size:12px;line-height:1.6">Show the digital ticket from your account at check-in. Keep this email for your records.</p></div></div></body></html>`,
    }),
    cache: 'no-store',
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || body?.error || 'Unable to send ticket confirmation email.');
}
