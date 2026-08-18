"use client";

import { useState } from "react";
import { Discount, StoreTheme, money, validateDiscountCode } from "../lib/store-api";
import { CartItem } from "./types";

export default function CartDrawer({
  storeId,
  theme,
  cart,
  appliedDiscount,
  onUpdateQty,
  onRemoveItem,
  onApplyDiscount,
  onClose,
  onProceedToCheckout,
}: {
  storeId: string;
  theme: StoreTheme;
  cart: CartItem[];
  appliedDiscount: Discount | null;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onApplyDiscount: (d: Discount | null, amountCents: number) => void;
  onClose: () => void;
  onProceedToCheckout: () => void;
}) {
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const subtotalCents = cart.reduce((sum, i) => sum + i.product.price_cents * i.quantity, 0);
  const freeShippingThreshold = theme.free_shipping_threshold_cents || 7500;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalCents);
  const progressPercent = Math.min(100, Math.round((subtotalCents / freeShippingThreshold) * 100));

  let discountCents = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      discountCents = Math.round((subtotalCents * appliedDiscount.value) / 100);
    } else if (appliedDiscount.type === "fixed") {
      discountCents = Math.min(subtotalCents, appliedDiscount.value);
    } else if (appliedDiscount.type === "free_shipping") {
      discountCents = 500;
    }
  }

  const estShippingCents = subtotalCents >= freeShippingThreshold || appliedDiscount?.type === "free_shipping" ? 0 : 500;
  const estTotalCents = Math.max(0, subtotalCents - discountCents) + estShippingCents;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setBusy(true);
    setCouponMsg("");
    const res = await validateDiscountCode(storeId, couponCode, subtotalCents);
    setBusy(false);
    if (res.valid && res.discount) {
      onApplyDiscount(res.discount, res.discountAmountCents);
      setCouponMsg(res.message);
    } else {
      setCouponMsg(res.message);
    }
  };

  return (
    <div className="sf-cart-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sf-cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="sf-cart-head">
          <h3>Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})</h3>
          <button className="sf-modal-close" style={{ position: "static" }} onClick={onClose} aria-label="Close bag">
            ×
          </button>
        </div>

        {/* Free Shipping Milestone Meter */}
        <div className="sf-shipping-meter">
          <div className="sf-shipping-meter-text">
            {remainingForFreeShipping === 0 ? (
              <span>🎉 You’ve unlocked <strong>Free Standard Shipping</strong>!</span>
            ) : (
              <span>
                Add <strong>{money(remainingForFreeShipping)}</strong> more to unlock Free Standard Shipping!
              </span>
            )}
          </div>
          <div className="sf-meter-bar-track">
            <div className="sf-meter-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Cart Item Rows */}
        <div className="sf-cart-items-scroll">
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--sf-muted)" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🛍️</div>
              <h4 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "18px", color: "var(--sf-ink)", margin: "0 0 6px" }}>
                Your shopping bag is empty
              </h4>
              <p style={{ fontSize: "13px", margin: "0 0 20px" }}>Discover our new season artisan ceramic pieces and organic textiles.</p>
              <button className="sf-btn-primary" onClick={onClose}>
                Continue Browsing
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="sf-cart-item-row">
                <img
                  src={item.product.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"}
                  alt={item.product.name}
                  className="sf-cart-item-img"
                />
                <div className="sf-cart-item-info">
                  <h4>{item.product.name}</h4>
                  <div className="sf-cart-item-price">{money(item.product.price_cents)}</div>
                  <div className="sf-cart-item-stepper">
                    <button onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.inventory_count}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  className="sf-cart-item-remove"
                  onClick={() => onRemoveItem(item.product.id)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {cart.length > 0 && (
          <div className="sf-cart-foot">
            <form onSubmit={handleApplyCoupon} className="sf-coupon-box">
              <input
                type="text"
                placeholder="Discount code (e.g. VELOUR10)"
                className="sf-coupon-input"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button type="submit" className="sf-coupon-btn" disabled={busy}>
                {busy ? "…" : "Apply"}
              </button>
            </form>
            {couponMsg && (
              <p style={{ fontSize: "11px", margin: "-8px 0 12px", color: appliedDiscount ? "#3b6d2a" : "#b8621d" }}>
                {couponMsg}
              </p>
            )}

            <div className="sf-cart-subtotals">
              <div className="sf-subtotal-row">
                <span>Subtotal</span>
                <span>{money(subtotalCents)}</span>
              </div>
              {discountCents > 0 && (
                <div className="sf-subtotal-row discount">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>−{money(discountCents)}</span>
                </div>
              )}
              <div className="sf-subtotal-row">
                <span>Estimated Shipping</span>
                <span>{estShippingCents === 0 ? "FREE" : money(estShippingCents)}</span>
              </div>
              <div className="sf-subtotal-row total">
                <span>Estimated Total</span>
                <span>{money(estTotalCents)}</span>
              </div>
            </div>

            <button className="sf-checkout-btn" onClick={onProceedToCheckout}>
              <span>Proceed to Checkout</span>
              <b>→</b>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
