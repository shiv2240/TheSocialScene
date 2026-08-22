export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface SmsPayload {
  toPhone: string;
  message: string;
}

export class NotificationService {
  /**
   * Resend Notification Abstraction
   */
  static async sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string }> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log(`[NotificationService: MOCK EMAIL TO ${payload.to}]: ${payload.subject}`);
      return { success: true, id: `email_mock_${Date.now()}` };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'The Social Scene <tickets@thesocialscene.club>',
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      return { success: true, id: data.id };
    } catch (err) {
      console.error('[NotificationService] Email dispatch error:', err);
      return { success: false };
    }
  }

  /**
   * SMS Provider Abstraction (Supabase Auth SMS / Twilio / Msg91)
   */
  static async sendSms(payload: SmsPayload): Promise<{ success: boolean }> {
    console.log(`[NotificationService: SMS TO ${payload.toPhone}]: ${payload.message}`);
    return { success: true };
  }
}
