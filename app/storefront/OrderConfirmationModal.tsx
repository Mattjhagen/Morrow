"use client";

import { Order, money } from "../lib/store-api";

export default function OrderConfirmationModal({
  order,
  onClose,
  onOpenDashboard,
}: {
  order: Order;
  onClose: () => void;
  onOpenDashboard: () => void;
}) {
  return (
    <div className="sf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sf-order-confirmed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sf-success-icon">✓</div>

        <small style={{ font: "10px var(--sf-font-mono)", letterSpacing: "0.14em", color: "var(--sf-terracotta)", textTransform: "uppercase" }}>
          ORDER CONFIRMED
        </small>
        <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "32px", margin: "6px 0 8px", color: "var(--sf-ink)" }}>
          Thank you for your order, {order.customer_name?.split(" ")[0]}!
        </h2>
        <p style={{ color: "var(--sf-muted)", fontSize: "14px", margin: "0 0 24px" }}>
          We’ve emailed your confirmation receipt to <strong>{order.customer_email}</strong> with tracking updates.
        </p>

        {/* Live Shipment Tracking Pipeline */}
        <div className="sf-tracking-timeline">
          <div className="sf-track-step done">
            <div className="sf-track-step-dot">✓</div>
            <small>1. Confirmed</small>
          </div>
          <div className="sf-track-step active">
            <div className="sf-track-step-dot">2</div>
            <small>2. Handcrafting</small>
          </div>
          <div className="sf-track-step">
            <div className="sf-track-step-dot">3</div>
            <small>3. Dispatched</small>
          </div>
          <div className="sf-track-step">
            <div className="sf-track-step-dot">4</div>
            <small>4. Out for Delivery</small>
          </div>
          <div className="sf-track-step">
            <div className="sf-track-step-dot">5</div>
            <small>5. Delivered</small>
          </div>
        </div>

        {/* Order Details Receipt Box */}
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--sf-line)",
            borderRadius: "10px",
            padding: "20px",
            textAlign: "left",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid var(--sf-line)", paddingBottom: "10px" }}>
            <div>
              <b style={{ color: "var(--sf-ink)" }}>Order #{order.order_number}</b>
              <small style={{ display: "block", color: "var(--sf-muted)" }}>
                {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </small>
            </div>
            <span style={{ background: "#e5f4dd", color: "#3b6d2a", padding: "3px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: "bold" }}>
              PAID · {order.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
            {order.order_items?.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.quantity} × {item.name}</span>
                <strong>{money(item.unit_price_cents * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed var(--sf-line)", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
            <b>Total Paid:</b>
            <b style={{ color: "var(--sf-ink)" }}>{money(order.total_cents)}</b>
          </div>

          {order.shipping_address && (
            <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--sf-line)", color: "var(--sf-muted)", fontSize: "12px" }}>
              <b>Shipping To:</b> {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button className="sf-btn-primary" onClick={onClose}>
            Continue Shopping
          </button>
          <button className="sf-btn-secondary" onClick={onOpenDashboard}>
            View in Merchant Admin ↗
          </button>
        </div>
      </div>
    </div>
  );
}
