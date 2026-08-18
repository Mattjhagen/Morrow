import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Singleton Stripe client when secret key is provided
export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia" as any,
    })
  : null;

export type CreatePaymentIntentParams = {
  amountCents: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  storeId: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResult = {
  success: boolean;
  clientSecret?: string | null;
  paymentIntentId: string;
  isSimulated: boolean;
  amountCents: number;
  currency: string;
  status: string;
};

/**
 * Creates a real or simulated Stripe PaymentIntent.
 * Gracefully falls back to simulated test mode if STRIPE_SECRET_KEY is not configured yet.
 */
export async function createStripePaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  const { amountCents, currency = "usd", customerEmail, customerName, storeId, metadata = {} } = params;

  if (stripe && STRIPE_SECRET_KEY) {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: currency.toLowerCase(),
        receipt_email: customerEmail,
        description: `Order from ${customerName || customerEmail} for store ${storeId}`,
        metadata: {
          store_id: storeId,
          customer_email: customerEmail,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        isSimulated: false,
        amountCents,
        currency,
        status: intent.status,
      };
    } catch (error) {
      console.error("Stripe live payment intent error:", error);
      throw error;
    }
  }

  // Simulated Test Mode response for local development / testing
  const mockIntentId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return {
    success: true,
    clientSecret: `${mockIntentId}_secret_${Math.random().toString(36).substring(2, 10)}`,
    paymentIntentId: mockIntentId,
    isSimulated: true,
    amountCents,
    currency,
    status: "requires_capture",
  };
}

/**
 * Verifies a Stripe webhook event
 */
export function constructStripeWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return null;
  }
  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    throw err;
  }
}
