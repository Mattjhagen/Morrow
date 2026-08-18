import { NextResponse } from "next/server";
import { createLemonSqueezyCheckout } from "@/app/lib/lemonsqueezy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      amountCents,
      currency,
      customerEmail,
      customerName,
      storeId,
      orderNumber,
      itemsSummary,
      metadata,
    } = body;

    if (!amountCents || !customerEmail || !storeId) {
      return NextResponse.json(
        { error: "Missing required fields: amountCents, customerEmail, storeId" },
        { status: 400 }
      );
    }

    const result = await createLemonSqueezyCheckout({
      amountCents,
      currency: currency || "USD",
      customerEmail,
      customerName,
      storeId,
      orderNumber,
      itemsSummary,
      metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Lemon Squeezy route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Lemon Squeezy checkout" },
      { status: 500 }
    );
  }
}
