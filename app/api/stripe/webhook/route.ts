import { NextRequest, NextResponse } from "next/server";
import { constructStripeWebhookEvent } from "../../../lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
    }

    const event = constructStripeWebhookEvent(rawBody, signature);

    if (!event) {
      // In development or when webhook secret is not configured
      return NextResponse.json({ received: true, simulated: true });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent succeeded for ${paymentIntent.amount} ${paymentIntent.currency}`);
        // Handle database order status update if needed
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.warn(`PaymentIntent failed: ${paymentIntent.last_payment_error?.message}`);
        break;
      }
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
