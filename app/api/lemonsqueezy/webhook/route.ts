import { NextResponse } from "next/server";
import { verifyLemonSqueezyWebhook } from "@/app/lib/lemonsqueezy";
import { sendTransactionalEmail, generateOrderReceiptHtml, type Order } from "@/app/lib/email";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature") || "";

    if (!verifyLemonSqueezyWebhook(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data || {};

    console.log(`[Lemon Squeezy Webhook] Received event: ${eventName}`);

    if (eventName === "order_created") {
      const orderId = customData.order_id;
      const customerEmail = payload.data?.attributes?.user_email;
      const customerName = payload.data?.attributes?.user_name;
      const totalCents = payload.data?.attributes?.total;

      console.log(`[Lemon Squeezy Webhook] Payment confirmed for Order ID: ${orderId} (${customerEmail}, Total: $${(totalCents / 100).toFixed(2)})`);

      if (orderId) {
        console.log(`[Lemon Squeezy Webhook] Order ${orderId} marked as paid`);
      }

      // Send transactional confirmation email
      if (customerEmail) {
        try {
          const mockOrder: Order = {
            id: orderId || "ls_order",
            store_id: customData.store_id || "store",
            order_number: Number(customData.order_number) || Math.floor(1000 + Math.random() * 9000),
            customer_name: customerName || "Valued Collector",
            status: "paid",
            currency: "USD",
            subtotal_cents: totalCents || 0,
            total_cents: totalCents || 0,
            created_at: new Date().toISOString(),
          };

          await sendTransactionalEmail({
            to: customerEmail,
            subject: `Order #${mockOrder.order_number} confirmed · Velour`,
            html: generateOrderReceiptHtml(mockOrder, "Velour"),
          });
        } catch (mailErr) {
          console.warn("Could not dispatch confirmation email:", mailErr);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook handler error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed" },
      { status: 500 }
    );
  }
}
