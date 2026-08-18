"use client";

import { useEffect, useState } from "react";
import { Order, Store, listOrders, money } from "../lib/store-api";

export default function CustomerOrdersModal({
  store,
  onClose,
  initialEmail = "",
}: {
  store: Store;
  onClose: () => void;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchOrdersForEmail = async (targetEmail: string) => {
    if (!targetEmail.trim()) return;
    setBusy(true);
    setSearched(true);
    try {
      const allOrders = await listOrders(store.id);
      const filtered = allOrders.filter(
        (o) => (o.customer_email || "").toLowerCase() === targetEmail.trim().toLowerCase()
      );
      setOrders(filtered);
    } catch {
      setOrders([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialEmail) {
      fetchOrdersForEmail(initialEmail);
    }
  }, [initialEmail]);

  return (
    <div className="sf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sf-checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
        <button className="sf-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "20px" }}>📦</span>
            <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "24px", margin: 0, color: "#17372e" }}>
              My Orders &amp; Receipts
            </h2>
          </div>
          <p style={{ color: "#6e7c73", fontSize: "14px", margin: "0 0 24px" }}>
            Look up your order history and live parcel tracking for {store.name}.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchOrdersForEmail(email);
            }}
            style={{ display: "flex", gap: "10px", marginBottom: "28px" }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your customer email (e.g. maya@example.com)"
              required
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1px solid #d8e0d6",
                borderRadius: "8px",
                fontFamily: "var(--sf-font-sans)",
                fontSize: "14px",
              }}
            />
            <button
              type="submit"
              className="button"
              disabled={busy}
              style={{ background: "#17372e", color: "#fff", padding: "10px 20px" }}
            >
              {busy ? "Finding…" : "Find Orders →"}
            </button>
          </form>

          {searched && (
            <div>
              {orders && orders.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto" }}>
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        background: "#fffcf4",
                        border: "1px solid #e1ded4",
                        borderRadius: "10px",
                        padding: "18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong style={{ fontSize: "16px", color: "#17372e" }}>Order #{o.order_number}</strong>
                          <span style={{ fontSize: "12px", color: "#8a978c", marginLeft: "10px" }}>
                            {new Date(o.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            padding: "4px 10px",
                            borderRadius: "99px",
                            background: o.status === "fulfilled" ? "#edf4da" : "#fbf2e2",
                            color: o.status === "fulfilled" ? "#2d5438" : "#8c561b",
                          }}
                        >
                          {o.status}
                        </span>
                      </div>

                      {/* Line items */}
                      <div style={{ borderTop: "1px solid #eae6dc", paddingTop: "10px" }}>
                        {(o.order_items || []).map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "13px",
                              color: "#33463a",
                              marginBottom: "4px",
                            }}
                          >
                            <span>{item.quantity}× {item.name}</span>
                            <b>{money(item.unit_price_cents * item.quantity, o.currency)}</b>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: "1px solid #eae6dc",
                          paddingTop: "10px",
                          fontSize: "13px",
                        }}
                      >
                        <div>
                          {o.tracking_number ? (
                            <span style={{ color: "#2d5438", fontSize: "12px" }}>
                              🚚 {o.carrier || "USPS"}: <code>{o.tracking_number}</code>
                            </span>
                          ) : (
                            <span style={{ color: "#8a978c", fontSize: "12px" }}>Preparing in studio</span>
                          )}
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: "bold", color: "#17372e" }}>
                          Total: {money(o.total_cents, o.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "30px 20px", background: "#f8faf4", borderRadius: "8px" }}>
                  <p style={{ margin: 0, color: "#6e7c73", fontSize: "14px" }}>
                    No orders found under <strong>{email}</strong> for {store.name}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
