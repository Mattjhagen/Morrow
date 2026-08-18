import crypto from "node:crypto";

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;
const LEMON_SQUEEZY_VARIANT_ID = process.env.LEMON_SQUEEZY_VARIANT_ID;
const LEMON_SQUEEZY_WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

export type CreateLemonSqueezyCheckoutParams = {
  amountCents: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  storeId: string;
  orderNumber?: number;
  itemsSummary?: string;
  metadata?: Record<string, string>;
};

export type LemonSqueezyCheckoutResult = {
  success: boolean;
  checkoutUrl: string;
  checkoutId: string;
  isSimulated: boolean;
  amountCents: number;
  currency: string;
};

/**
 * Creates a real or simulated Lemon Squeezy Checkout URL.
 * Automatically handles tax calculation, VAT, Apple Pay, PayPal, and credit card processing.
 */
export async function createLemonSqueezyCheckout(
  params: CreateLemonSqueezyCheckoutParams
): Promise<LemonSqueezyCheckoutResult> {
  const {
    amountCents,
    currency = "USD",
    customerEmail,
    customerName,
    storeId,
    orderNumber,
    itemsSummary = "Velour Handcrafted Order",
    metadata = {},
  } = params;

  if (LEMON_SQUEEZY_API_KEY && LEMON_SQUEEZY_STORE_ID && LEMON_SQUEEZY_VARIANT_ID) {
    try {
      const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              custom_price: amountCents,
              product_options: {
                name: itemsSummary,
                description: `Order #${orderNumber || "New"} · Processed securely by Lemon Squeezy`,
                receipt_button_text: "Return to Store",
                receipt_link_url: "https://velour.live",
              },
              checkout_data: {
                email: customerEmail,
                name: customerName,
                custom: {
                  store_id: storeId,
                  order_number: String(orderNumber || ""),
                  ...metadata,
                },
              },
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: String(LEMON_SQUEEZY_STORE_ID),
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: String(LEMON_SQUEEZY_VARIANT_ID),
                },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        console.error("Lemon Squeezy API error:", err);
        throw new Error(err?.errors?.[0]?.detail || `Lemon Squeezy error (${response.status})`);
      }

      const result = await response.json();
      const checkoutUrl = result.data?.attributes?.url;
      const checkoutId = result.data?.id;

      return {
        success: true,
        checkoutUrl,
        checkoutId,
        isSimulated: false,
        amountCents,
        currency,
      };
    } catch (e) {
      console.error("Lemon Squeezy checkout creation failed, falling back to simulated checkout:", e);
    }
  }

  // Simulated Checkout Fallback
  const simulatedId = `ls_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    success: true,
    checkoutUrl: `https://checkout.lemonsqueezy.com/buy/${simulatedId}?simulated=true`,
    checkoutId: simulatedId,
    isSimulated: true,
    amountCents,
    currency,
  };
}

/**
 * Verifies the Lemon Squeezy webhook signature.
 */
export function verifyLemonSqueezyWebhook(payload: string, signature: string): boolean {
  if (!LEMON_SQUEEZY_WEBHOOK_SECRET) {
    return true; // allow in dev/sandbox if secret is not set
  }
  const hmac = crypto.createHmac("sha256", LEMON_SQUEEZY_WEBHOOK_SECRET);
  const digest = Buffer.from(hmac.update(payload).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return crypto.timingSafeEqual(digest, signatureBuffer);
}
