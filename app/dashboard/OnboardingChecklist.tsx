"use client";

import { useState } from "react";
import { Discount, Product, Store, StoreTheme } from "../lib/store-api";

export default function OnboardingChecklist({
  store,
  products,
  discounts,
  theme,
  onAddProduct,
  onOpenTheme,
  onOpenDiscounts,
  onOpenStripe,
  onOpenStorefront,
}: {
  store: Store;
  products: Product[];
  discounts: Discount[];
  theme: StoreTheme;
  onAddProduct: () => void;
  onOpenTheme: () => void;
  onOpenDiscounts: () => void;
  onOpenStripe: () => void;
  onOpenStorefront: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(true);

  const steps = [
    {
      id: "product",
      title: "Add your first product",
      desc: "Upload photos, set pricing, compare-at sale prices, and inventory stock.",
      completed: products.length > 0,
      actionLabel: "+ Add Product",
      action: onAddProduct,
    },
    {
      id: "theme",
      title: "Personalize your storefront theme",
      desc: "Set your announcement bar, editorial hero headline, and brand aesthetic.",
      completed: !!theme.announcement && theme.announcement.length > 10,
      actionLabel: "Edit Theme →",
      action: onOpenTheme,
    },
    {
      id: "discount",
      title: "Create a welcome promotion code",
      desc: "Drive your first drop conversions with a promo like WELCOME10 or FREESHIP.",
      completed: discounts.length > 0,
      actionLabel: "+ Create Code",
      action: onOpenDiscounts,
    },
    {
      id: "stripe",
      title: "Connect Stripe payment gateway",
      desc: "Accept Apple Pay, Google Pay, and credit cards with 1-click Express Checkout.",
      completed: stripeConfigured,
      actionLabel: "Configure Stripe ⚙️",
      action: onOpenStripe,
    },
    {
      id: "preview",
      title: "Test your live storefront checkout",
      desc: "Browse your catalog as a shopper and complete a test checkout order.",
      completed: false,
      actionLabel: "Open Storefront 🛍️",
      action: onOpenStorefront,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (collapsed) {
    return (
      <div
        style={{
          background: "#fffcf4",
          border: "1px solid #e1ded4",
          borderRadius: "10px",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "#2d5438", fontWeight: "bold" }}>✦ Store Setup Guide:</span>
          <span style={{ fontSize: "13px", color: "#5b6b60" }}>
            {completedCount} of {steps.length} steps completed ({progressPercent}%)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          style={{ background: "none", border: "none", color: "#17372e", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
        >
          Show Checklist ↓
        </button>
      </div>
    );
  }

  return (
    <section
      style={{
        background: "linear-gradient(180deg, #fffcf4 0%, #f7f4ea 100%)",
        border: "1px solid #e1ded4",
        borderRadius: "12px",
        padding: "24px 28px",
        marginBottom: "28px",
        boxShadow: "0 4px 16px rgba(23, 55, 46, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ color: "#2d5438", fontSize: "14px" }}>✦</span>
            <span style={{ font: "10px var(--sf-font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", color: "#5b6b60", fontWeight: "bold" }}>
              GETTING STARTED TUTORIAL
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "22px", margin: 0, color: "#17372e" }}>
            Welcome to {store.name} · Launch Checklist
          </h2>
          <p style={{ margin: "4px 0 0", color: "#6e7c73", fontSize: "13px" }}>
            Complete these {steps.length} essentials to start taking live orders.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          style={{ background: "none", border: "none", color: "#8a978c", fontSize: "12px", cursor: "pointer" }}
        >
          Minimize Guide ✕
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", color: "#33463a", marginBottom: "6px" }}>
          <span>{completedCount} of {steps.length} steps completed</span>
          <span>{progressPercent}% ready</span>
        </div>
        <div style={{ background: "#e5e2d8", height: "6px", borderRadius: "99px", overflow: "hidden" }}>
          <div
            style={{
              background: "#2d5438",
              height: "100%",
              width: `${progressPercent}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {steps.map((s, idx) => (
          <div
            key={s.id}
            style={{
              background: s.completed ? "#f4f7ed" : "#fff",
              border: `1px solid ${s.completed ? "#c9dcb2" : "#e4e0d5"}`,
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              <span
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: "bold",
                  background: s.completed ? "#2d5438" : "#f0ece1",
                  color: s.completed ? "#fff" : "#8a978c",
                }}
              >
                {s.completed ? "✓" : String(idx + 1)}
              </span>
              <div>
                <b
                  style={{
                    fontSize: "14px",
                    color: "#17372e",
                    textDecoration: s.completed ? "line-through" : "none",
                    opacity: s.completed ? 0.75 : 1,
                  }}
                >
                  {s.title}
                </b>
                <p style={{ margin: "2px 0 0", color: "#6e7c73", fontSize: "12px" }}>{s.desc}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={s.action}
              style={{
                background: s.completed ? "#fff" : "#17372e",
                color: s.completed ? "#2d5438" : "#fff",
                border: s.completed ? "1px solid #c9dcb2" : "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {s.completed ? "Review" : s.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
