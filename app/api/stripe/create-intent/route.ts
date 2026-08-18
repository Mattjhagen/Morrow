import { NextRequest, NextResponse } from "next/server";
import { createStripePaymentIntent } from "../../../lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amountCents, currency = "usd", customerEmail, customerName, storeId, metadata } = body;

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount." },
        { status: 400 }
      );
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required." },
        { status: 400 }
      );
    }

    const result = await createStripePaymentIntent({
      amountCents: Math.round(amountCents),
      currency,
      customerEmail,
      customerName,
      storeId: storeId || "default-store",
      metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment intent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
