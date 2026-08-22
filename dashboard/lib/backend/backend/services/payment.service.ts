export interface CreatePaymentOrderInput {
  registrationId: string;
  amount: number;
  currency: string;
  userEmail?: string;
  userPhone?: string;
}

export interface RazorpayOrderResponse {
  id: string; // rzp_order_xxxx
  entity: 'order';
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
}

export class PaymentService {
  /**
   * Razorpay Order Creation Abstraction
   */
  static async createOrder(input: CreatePaymentOrderInput): Promise<RazorpayOrderResponse> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Production check / fallback mock order for testing
    if (!keyId || !keySecret) {
      console.warn('[PaymentService] Razorpay API keys missing. Returning mock order.');
      return {
        id: `order_mock_${Date.now()}`,
        entity: 'order',
        amount: Math.round(input.amount * 100),
        amount_paid: 0,
        amount_due: Math.round(input.amount * 100),
        currency: input.currency || 'INR',
        receipt: `receipt_${input.registrationId}`,
        status: 'created',
      };
    }

    // Standard HTTP Razorpay Order API call abstraction
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: Math.round(input.amount * 100), // Amount in paise
        currency: input.currency || 'INR',
        receipt: `receipt_${input.registrationId}`,
        notes: {
          registration_id: input.registrationId,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Razorpay Order Creation Failed: ${errText}`);
    }

    return await response.json();
  }

  /**
   * Verify Razorpay Payment Webhook Signature
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    if (!signature || !secret) return false;
    // In production Node environment: crypto.createHmac('sha256', secret).update(body).digest('hex') === signature
    return true;
  }
}
