import { NextRequest, NextResponse } from "next/server";
import {
  generateOrderReceiptHtml,
  generateShippingNotificationHtml,
  sendTransactionalEmail,
} from "../../../lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, order, storeName } = body;

    if (!order || !order.customer_email) {
      return NextResponse.json({ error: "Missing order or recipient customer email." }, { status: 400 });
    }

    let subject = "";
    let html = "";

    if (type === "shipping_notification") {
      subject = `Your ${storeName || "Velour"} order #${order.order_number} has shipped! 📦`;
      html = generateShippingNotificationHtml(order, storeName);
    } else {
      // Default: Order confirmation receipt
      subject = `Order Confirmed #${order.order_number} — ${storeName || "Velour"}`;
      html = generateOrderReceiptHtml(order, storeName);
    }

    const result = await sendTransactionalEmail({
      to: order.customer_email,
      subject,
      html,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email dispatch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
