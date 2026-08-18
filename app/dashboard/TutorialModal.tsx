"use client";

import { useState } from "react";

export default function TutorialModal({
  onClose,
  onOpenStorefront,
  onAddProduct,
}: {
  onClose: () => void;
  onOpenStorefront: () => void;
  onAddProduct: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"basics" | "products" | "marketing" | "shipping" | "payments">("basics");

  return (
    <div className="sf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="sf-checkout-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "760px", background: "#fffcf4" }}
      >
        <button className="sf-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "22px" }}>🎓</span>
            <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "24px", margin: 0, color: "#17372e" }}>
              Velour Storefront Masterclass &amp; Tutorial
            </h2>
          </div>
          <p style={{ color: "#6e7c73", fontSize: "14px", margin: "0 0 20px" }}>
            Everything you need to know about setting up, launching, and fulfilling orders on your Velour store.
          </p>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e1ded4", paddingBottom: "12px", marginBottom: "20px", overflowX: "auto" }}>
            <button
              className={`sf-pdp-tab-btn ${activeTab === "basics" ? "active" : ""}`}
              onClick={() => setActiveTab("basics")}
            >
              1. Store Architecture
            </button>
            <button
              className={`sf-pdp-tab-btn ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              2. Products &amp; Variants
            </button>
            <button
              className={`sf-pdp-tab-btn ${activeTab === "marketing" ? "active" : ""}`}
              onClick={() => setActiveTab("marketing")}
            >
              3. Discounts &amp; Conversion
            </button>
            <button
              className={`sf-pdp-tab-btn ${activeTab === "payments" ? "active" : ""}`}
              onClick={() => setActiveTab("payments")}
            >
              4. Stripe &amp; Checkout
            </button>
            <button
              className={`sf-pdp-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
              onClick={() => setActiveTab("shipping")}
            >
              5. Order Fulfillment
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#33463a", minHeight: "260px" }}>
            {activeTab === "basics" && (
              <div>
                <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "18px", color: "#17372e", margin: "0 0 8px" }}>
                  ✦ The Anatomy of Your Velour Storefront
                </h3>
                <p>
                  Velour gives your craft a warm, editorial presence that feels like a luxury independent boutique:
                </p>
                <ul style={{ paddingLeft: "20px", color: "#5b6b60" }}>
                  <li><strong>Announcement Bar:</strong> Top banner for time-sensitive promotions (e.g. Free shipping on orders over $75).</li>
                  <li><strong>Hero Section:</strong> High-impact imagery and tagline capturing the ethos of your studio.</li>
                  <li><strong>Category Catalog:</strong> Instant filtering pills and real-time search with zero page refreshes.</li>
                  <li><strong>Slide-out Bag &amp; Free Shipping Meter:</strong> Dynamic cart drawer encouraging higher Average Order Value (AOV).</li>
                </ul>
                <div style={{ marginTop: "18px" }}>
                  <button className="button small" onClick={onOpenStorefront}>
                    Preview Live Storefront ↗
                  </button>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div>
                <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "18px", color: "#17372e", margin: "0 0 8px" }}>
                  📸 High-Converting Products &amp; Variants
                </h3>
                <p>
                  Create detailed listings that build buyer confidence:
                </p>
                <ul style={{ paddingLeft: "20px", color: "#5b6b60" }}>
                  <li><strong>Compare-at Pricing:</strong> Display original prices (e.g. $42.00) alongside sale prices ($34.00) with automatic <code>Save X%</code> badges.</li>
                  <li><strong>Multi-SKU Variants:</strong> Add size, color, or material options with custom price overrides and individual stock counters.</li>
                  <li><strong>Photo Galleries:</strong> Add multiple high-resolution photos with thumbnail switchers.</li>
                  <li><strong>Inventory Urgency:</strong> Stock levels below 5 units automatically trigger <em>"Only X left in batch"</em> callouts.</li>
                </ul>
                <div style={{ marginTop: "18px" }}>
                  <button className="button small" onClick={onAddProduct}>
                    + Add a Product Now
                  </button>
                </div>
              </div>
            )}

            {activeTab === "marketing" && (
              <div>
                <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "18px", color: "#17372e", margin: "0 0 8px" }}>
                  🏷️ Promotional Codes &amp; Free Shipping Thresholds
                </h3>
                <p>
                  Drive repeat purchases and higher cart sizes:
                </p>
                <ul style={{ paddingLeft: "20px", color: "#5b6b60" }}>
                  <li><strong>Percentage Codes (e.g., WELCOME10):</strong> Deduct a percentage off the cart subtotal.</li>
                  <li><strong>Fixed Amount Discounts:</strong> Take $15 or $25 off when shoppers hit a minimum spend threshold.</li>
                  <li><strong>Free Shipping Rule:</strong> Set your store threshold (e.g. $75.00). The cart drawer automatically calculates how much more the customer needs to add to unlock free shipping!</li>
                </ul>
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "18px", color: "#17372e", margin: "0 0 8px" }}>
                  💳 Secure Stripe Payments &amp; Express Checkout
                </h3>
                <p>
                  Velour handles payments with native Stripe integration:
                </p>
                <ul style={{ paddingLeft: "20px", color: "#5b6b60" }}>
                  <li><strong>1-Click Express Pay:</strong> Supports Shop Pay and Apple Pay for mobile visitors.</li>
                  <li><strong>Sandbox Test Mode:</strong> Safe local testing using <code>4242...</code> card filler.</li>
                  <li><strong>Live Mode:</strong> Add your Stripe Publishable &amp; Secret keys in <em>Integrations ➔ Stripe</em> to accept real payments with 2-day bank deposits.</li>
                </ul>
              </div>
            )}

            {activeTab === "shipping" && (
              <div>
                <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "18px", color: "#17372e", margin: "0 0 8px" }}>
                  🚚 5-Stage Live Shipment Tracking Pipeline
                </h3>
                <p>
                  Keep your customers informed from purchase to delivery:
                </p>
                <ul style={{ paddingLeft: "20px", color: "#5b6b60" }}>
                  <li><strong>Stage 1: Confirmed:</strong> Order placed and verified receipt generated.</li>
                  <li><strong>Stage 2: Handcrafting:</strong> Studio preparing and packaging items.</li>
                  <li><strong>Stage 3: Dispatched:</strong> Fulfill the order in your dashboard with carrier &amp; tracking code. Automated tracking email sent via Resend.</li>
                  <li><strong>Stage 4 &amp; 5: Out for Delivery &amp; Delivered:</strong> Parcel arrives at customer doorstep.</li>
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e1ded4", display: "flex", justifyContent: "flex-end" }}>
            <button className="button" onClick={onClose}>
              Got it, let's build →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
