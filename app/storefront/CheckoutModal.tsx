"use client";

import { useState } from "react";
import { Discount, Order, Store, StorefrontOrderInput, money, placeStorefrontOrder, validateDiscountCode } from "../lib/store-api";
import { CartItem } from "./types";

const SHIPPING_METHODS = [
  { id: "std", name: "Standard Ground (3–5 Business Days)", priceCents: 500 },
  { id: "exp", name: "Express 2-Day Air", priceCents: 1500 },
  { id: "ovn", name: "Overnight Priority Delivery", priceCents: 2800 },
];

export default function CheckoutModal({
  store,
  cart,
  appliedDiscount,
  onClose,
  onOrderCompleted,
}: {
  store: Store;
  cart: CartItem[];
  appliedDiscount: Discount | null;
  onClose: () => void;
  onOrderCompleted: (order: Order) => void;
}) {
  // Form State
  const [email, setEmail] = useState("maya.founder@example.com");
  const [name, setName] = useState("Maya Patel");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [street, setStreet] = useState("340 Townsend Street, Suite 200");
  const [city, setCity] = useState("San Francisco");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("94107");
  const [country, setCountry] = useState("United States");

  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_METHODS[0]);
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");

  const [discount, setDiscount] = useState<Discount | null>(appliedDiscount);
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Totals calculations
  const subtotalCents = cart.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0);

  let discountCents = 0;
  if (discount) {
    if (discount.type === "percentage") {
      discountCents = Math.round((subtotalCents * discount.value) / 100);
    } else if (discount.type === "fixed") {
      discountCents = Math.min(subtotalCents, discount.value);
    } else if (discount.type === "free_shipping") {
      discountCents = selectedShipping.priceCents;
    }
  }

  // Free shipping threshold rule ($75+)
  const shippingCostCents =
    subtotalCents >= 7500 && selectedShipping.id === "std"
      ? 0
      : discount?.type === "free_shipping"
      ? 0
      : selectedShipping.priceCents;

  const taxableAmount = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxableAmount * 0.075);
  const finalTotalCents = taxableAmount + shippingCostCents + taxCents;

  const fillTestCard = () => {
    setCardNumber("4242 •••• •••• 4242");
    setCardExp("08/29");
    setCardCvc("737");
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoMsg("");
    const res = await validateDiscountCode(store.id, promoInput, subtotalCents);
    if (res.valid && res.discount) {
      setDiscount(res.discount);
      setPromoMsg(res.message);
    } else {
      setPromoMsg(res.message);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !street || !city || !zip) {
      setErr("Please complete all shipping address fields.");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const orderPayload: StorefrontOrderInput = {
        customer: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        },
        shippingAddress: {
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          country: country.trim(),
        },
        items: cart.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          unitPriceCents: i.product.price_cents,
          quantity: i.quantity,
          imageUrl: i.product.image_url,
        })),
        shippingMethod: {
          name: selectedShipping.name,
          priceCents: shippingCostCents,
        },
        discountCode: discount?.code,
        discountCents,
      };

      const placedOrder = await placeStorefrontOrder(store.id, orderPayload);
      onOrderCompleted(placedOrder);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "We were unable to process your checkout.");
      setBusy(false);
    }
  };

  return (
    <div className="sf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sf-checkout-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sf-modal-close" onClick={onClose} aria-label="Close checkout">
          ×
        </button>

        {/* Left Form Column */}
        <div className="sf-checkout-main">
          {/* Brand header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
            <span className="brand-mark" style={{ width: "24px", height: "24px", fontSize: "16px" }}>v</span>
            <b style={{ fontFamily: "var(--sf-font-serif)", fontSize: "20px" }}>{store.name} Secure Checkout</b>
          </div>

          {/* Express Checkout options */}
          <div style={{ marginBottom: "24px" }}>
            <small style={{ font: "9px var(--sf-font-mono)", letterSpacing: "0.1em", color: "var(--sf-muted)", display: "block", marginBottom: "8px" }}>
              EXPRESS CHECKOUT
            </small>
            <div className="sf-express-checkout">
              <button type="button" className="sf-express-btn shoppay" onClick={fillTestCard}>
                <span>Shop Pay</span>
              </button>
              <button type="button" className="sf-express-btn applepay" onClick={fillTestCard}>
                <span> Apple Pay</span>
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--sf-muted)", fontSize: "12px" }}>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--sf-line)" }} />
              <span>OR PAY WITH CARD</span>
              <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--sf-line)" }} />
            </div>
          </div>

          <form onSubmit={handleSubmitOrder} className="sf-checkout-form">
            {/* Step 1: Contact */}
            <div>
              <h3 className="sf-checkout-step-title">
                <span className="sf-step-num">1</span>
                <span>Contact Information</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  Full Name
                  <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  Email Address
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
              </div>
              <label style={{ marginTop: "12px" }}>
                Phone Number (for delivery updates)
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            </div>

            {/* Step 2: Shipping Address */}
            <div style={{ marginTop: "16px" }}>
              <h3 className="sf-checkout-step-title">
                <span className="sf-step-num">2</span>
                <span>Shipping Address</span>
              </h3>
              <label>
                Street Address
                <input value={street} onChange={(e) => setStreet(e.target.value)} required />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <label>
                  City
                  <input value={city} onChange={(e) => setCity(e.target.value)} required />
                </label>
                <label>
                  State
                  <input value={state} onChange={(e) => setState(e.target.value)} required />
                </label>
                <label>
                  ZIP Code
                  <input value={zip} onChange={(e) => setZip(e.target.value)} required />
                </label>
              </div>
            </div>

            {/* Step 3: Shipping Method */}
            <div style={{ marginTop: "16px" }}>
              <h3 className="sf-checkout-step-title">
                <span className="sf-step-num">3</span>
                <span>Delivery Speed</span>
              </h3>
              <div className="sf-shipping-options">
                {SHIPPING_METHODS.map((method) => {
                  const isFree = subtotalCents >= 7500 && method.id === "std";
                  const cost = isFree ? 0 : method.priceCents;
                  return (
                    <div
                      key={method.id}
                      className={`sf-shipping-option-card ${selectedShipping.id === method.id ? "selected" : ""}`}
                      onClick={() => setSelectedShipping(method)}
                    >
                      <div>
                        <b style={{ fontSize: "13px" }}>{method.name}</b>
                        <small style={{ display: "block", color: "var(--sf-muted)" }}>
                          {isFree ? "Free shipping unlocked ($75+ order)" : "Carbon-neutral studio dispatch"}
                        </small>
                      </div>
                      <strong>{cost === 0 ? "FREE" : money(cost)}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Payment */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 className="sf-checkout-step-title" style={{ margin: 0 }}>
                  <span className="sf-step-num">4</span>
                  <span>Payment (Stripe Native)</span>
                </h3>
                <button type="button" className="sf-test-card-fill-btn" onClick={fillTestCard}>
                  ⚡ Fill Test Card
                </button>
              </div>

              <div className="sf-payment-card-box">
                <label>
                  Card Number
                  <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" required />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label>
                    Expiration Date
                    <input value={cardExp} onChange={(e) => setCardExp(e.target.value)} placeholder="MM/YY" required />
                  </label>
                  <label>
                    Security CVC
                    <input value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" required />
                  </label>
                </div>
              </div>
            </div>

            {err && (
              <p style={{ background: "#fbeee7", color: "#b84224", padding: "10px 14px", borderRadius: "6px", fontSize: "13px" }}>
                {err}
              </p>
            )}

            <button type="submit" className="sf-checkout-btn" style={{ marginTop: "24px" }} disabled={busy}>
              <span>{busy ? "Processing Secure Order…" : `Pay ${money(finalTotalCents)} · Place Order`}</span>
              <b>→</b>
            </button>
          </form>
        </div>

        {/* Right Order Summary Column */}
        <div className="sf-checkout-summary-panel">
          <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "20px", margin: "0 0 20px" }}>
            Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)})
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxHeight: "280px", overflowY: "auto", marginBottom: "20px" }}>
            {cart.map((item) => (
              <div key={item.product.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <img
                    src={item.product.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"}
                    alt=""
                    style={{ width: "52px", height: "52px", borderRadius: "6px", objectFit: "cover" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      background: "var(--sf-ink)",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      fontSize: "10px",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {item.quantity}
                  </span>
                </div>
                <div style={{ flex: 1, fontSize: "13px" }}>
                  <b style={{ display: "block", color: "var(--sf-ink)" }}>{item.product.name}</b>
                  <small style={{ color: "var(--sf-muted)" }}>{money(item.product.price_cents)} each</small>
                </div>
                <strong>{money(item.product.price_cents * item.quantity)}</strong>
              </div>
            ))}
          </div>

          {/* Promo code entry */}
          <form onSubmit={handleApplyPromo} className="sf-coupon-box">
            <input
              type="text"
              placeholder="Promo code"
              className="sf-coupon-input"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
            />
            <button type="submit" className="sf-coupon-btn">
              Apply
            </button>
          </form>
          {promoMsg && (
            <p style={{ fontSize: "11px", margin: "-8px 0 14px", color: discount ? "#3b6d2a" : "#b8621d" }}>
              {promoMsg}
            </p>
          )}

          {/* Breakdown table */}
          <div className="sf-cart-subtotals" style={{ marginTop: "16px" }}>
            <div className="sf-subtotal-row">
              <span>Subtotal</span>
              <span>{money(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div className="sf-subtotal-row discount">
                <span>Discount ({discount?.code})</span>
                <span>−{money(discountCents)}</span>
              </div>
            )}
            <div className="sf-subtotal-row">
              <span>Shipping ({selectedShipping.name.split("(")[0]})</span>
              <span>{shippingCostCents === 0 ? "FREE" : money(shippingCostCents)}</span>
            </div>
            <div className="sf-subtotal-row">
              <span>Estimated Taxes (7.5%)</span>
              <span>{money(taxCents)}</span>
            </div>
            <div className="sf-subtotal-row total" style={{ fontSize: "20px" }}>
              <span>Total Due</span>
              <span>{money(finalTotalCents)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
