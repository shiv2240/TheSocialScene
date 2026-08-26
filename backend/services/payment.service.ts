import crypto from 'node:crypto';

export interface CreatePaymentOrderInput {
  registrationId: string;
  amount: number;
  currency: string;
  userEmail?: string;
  userPhone?: string;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
}

export class PaymentService {
  static async createOrder(input: CreatePaymentOrderInput): Promise<RazorpayOrderResponse> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay API credentials are not configured on the server.');
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: Math.round(input.amount * 100),
        currency: input.currency || 'INR',
        receipt: `receipt_${input.registrationId}`,
        notes: { registration_id: input.registrationId },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Razorpay Order Creation Failed: ${errText}`);
    }

    return await response.json();
  }

  static verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    const left = Buffer.from(expected, 'hex');
    const right = Buffer.from(signature, 'hex');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  }
}
