import { Order, money } from "./store-api";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export type EmailSendResult = {
  success: boolean;
  messageId: string;
  isSimulated: boolean;
  recipient: string;
  subject: string;
};

/**
 * Generates an editorial, luxury HTML email receipt for Velour orders.
 */
export function generateOrderReceiptHtml(order: Order, storeName = "Velour"): string {
  const itemsHtml = (order.order_items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eae6dc;">
          <strong style="color: #17372e; font-size: 14px; display: block;">${item.name}</strong>
          <span style="color: #6e7c73; font-size: 12px;">Qty: ${item.quantity} × ${money(item.unit_price_cents)}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eae6dc; text-align: right; font-weight: bold; color: #17372e;">
          ${money(item.unit_price_cents * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f7f5ed; color: #17372e; margin: 0; padding: 40px 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #fffcf4; border-radius: 12px; border: 1px solid #e2ded4; padding: 36px 32px; box-shadow: 0 10px 30px rgba(23,55,46,0.06); }
    .brand { font-size: 22px; font-weight: bold; color: #17372e; letter-spacing: -0.04em; margin-bottom: 24px; display: block; }
    .headline { font-size: 26px; font-weight: 500; margin: 0 0 10px; color: #17372e; }
    .lead { color: #6e7c73; font-size: 15px; line-height: 1.5; margin: 0 0 24px; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .total-row { font-size: 18px; font-weight: bold; color: #17372e; padding-top: 14px; text-align: right; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2ded4; font-size: 12px; color: #8a978c; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <span class="brand">✦ ${storeName}</span>
    <h1 class="headline">Thank you for your order!</h1>
    <p class="lead">
      We are preparing your handcrafted objects with care. Here is your official order receipt <strong>#${order.order_number}</strong>.
    </p>

    <table class="receipt-table">
      ${itemsHtml}
    </table>

    <div style="display: flex; justify-content: space-between; font-size: 14px; color: #6e7c73; margin-bottom: 6px;">
      <span>Subtotal</span>
      <span>${money(order.subtotal_cents)}</span>
    </div>
    ${
      order.discount_cents
        ? `
    <div style="display: flex; justify-content: space-between; font-size: 14px; color: #d9825a; margin-bottom: 6px;">
      <span>Discount (${order.discount_code || "PROMO"})</span>
      <span>−${money(order.discount_cents)}</span>
    </div>`
        : ""
    }
    <div style="display: flex; justify-content: space-between; font-size: 14px; color: #6e7c73; margin-bottom: 6px;">
      <span>Shipping</span>
      <span>${order.shipping_cents === 0 ? "FREE" : money(order.shipping_cents || 0)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #17372e; padding-top: 12px; border-top: 1px dashed #e2ded4;">
      <span>Total Paid</span>
      <span>${money(order.total_cents)}</span>
    </div>

    ${
      order.shipping_address
        ? `
    <div style="margin-top: 24px; padding: 16px; background: #f7f5ed; border-radius: 8px; font-size: 13px;">
      <strong>Shipping Address:</strong><br>
      ${order.customer_name || "Customer"}<br>
      ${order.shipping_address.street}<br>
      ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}
    </div>
    `
        : ""
    }

    <div class="footer">
      Delivered in 100% recyclable fibers. © ${new Date().getFullYear()} ${storeName} · Powered by Velour Commerce.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates an editorial HTML shipment notification email with tracking info.
 */
export function generateShippingNotificationHtml(order: Order, storeName = "Velour"): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f7f5ed; color: #17372e; margin: 0; padding: 40px 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #fffcf4; border-radius: 12px; border: 1px solid #e2ded4; padding: 36px 32px; }
    .brand { font-size: 22px; font-weight: bold; color: #17372e; margin-bottom: 24px; display: block; }
    .tracking-box { background: #edf4da; border: 1px solid #c2d99c; border-radius: 8px; padding: 16px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <span class="brand">✦ ${storeName}</span>
    <h1 style="font-size: 24px; margin: 0 0 10px;">Your studio package has been dispatched!</h1>
    <p style="color: #6e7c73; font-size: 15px; line-height: 1.5;">
      Great news—order <strong>#${order.order_number}</strong> is in transit and on its way to your doorstep.
    </p>

    <div class="tracking-box">
      <small style="font-family: monospace; text-transform: uppercase; color: #406038; font-size: 11px;">CARRIER &amp; TRACKING NUMBER</small>
      <div style="font-size: 16px; font-weight: bold; color: #17372e; margin: 4px 0;">
        ${order.carrier || "USPS Priority"}: ${order.tracking_number || "9400111899223192083112"}
      </div>
      <small style="color: #5b6b60;">Track your carbon-neutral parcel via carrier updates.</small>
    </div>

    <div style="font-size: 13px; color: #8a978c; text-align: center; margin-top: 30px;">
      Thank you for supporting independent craft and slow design.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends transactional email via Resend API or simulated fallback.
 */
export async function sendTransactionalEmail(params: SendEmailParams): Promise<EmailSendResult> {
  const { to, subject, html, from = "Velour Studio <orders@velour.live>" } = params;

  if (RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `Resend dispatch failed with status ${res.status}`);
      }

      const data = await res.json();
      return {
        success: true,
        messageId: data.id,
        isSimulated: false,
        recipient: to,
        subject,
      };
    } catch (e) {
      console.error("Resend delivery error:", e);
      throw e;
    }
  }

  // Simulated delivery mode
  const mockId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[Email Dispatch Simulated] Sent "${subject}" to ${to} (Message ID: ${mockId})`);
  return {
    success: true,
    messageId: mockId,
    isSimulated: true,
    recipient: to,
    subject,
  };
}
