"use client";

import { Store, StoreTheme } from "../lib/store-api";
import { CartItem } from "./types";

export default function StorefrontNav({
  store,
  theme,
  cart,
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenCart,
  onOpenDashboard,
  onBackToLanding,
  onOpenCustomerOrders,
}: {
  store: Store;
  theme: StoreTheme;
  cart: CartItem[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenCart: () => void;
  onOpenDashboard: () => void;
  onBackToLanding: () => void;
  onOpenCustomerOrders?: () => void;
}) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Announcement Bar */}
      {theme.announcement && (
        <div className="sf-announcement-bar">
          <span>{theme.announcement}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <header className="sf-navbar">
        <div className="sf-brand-group">
          <button className="sf-brand-logo" onClick={onBackToLanding} title="Back to Velour Platform">
            <span className="brand-mark" style={{ width: "28px", height: "28px", fontSize: "18px" }}>
              {store.name.charAt(0).toLowerCase()}
            </span>
            {store.name}
          </button>
          <span className="sf-brand-badge">{store.handle}.velour.live</span>
        </div>

        {/* Navigation Categories */}
        <nav className="sf-nav-links">
          <button
            className={`sf-nav-link ${selectedCategory === "All" ? "active" : ""}`}
            onClick={() => onSelectCategory("All")}
          >
            All Works
          </button>
          {categories.slice(0, 4).map((cat) => (
            <button
              key={cat}
              className={`sf-nav-link ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="sf-nav-actions">
          {onOpenCustomerOrders && (
            <button
              className="sf-icon-btn"
              onClick={onOpenCustomerOrders}
              title="Track Order or View Receipts"
              style={{ fontSize: "13px", fontWeight: "600" }}
            >
              <span>📦 Orders</span>
            </button>
          )}
          <button className="sf-icon-btn" onClick={onOpenDashboard} title="Open Merchant Dashboard">
            <span>⚙️ Admin</span>
          </button>
          <button className="sf-cart-btn" onClick={onOpenCart} aria-label="Open Shopping Bag">
            <span>Bag</span>
            <span className="sf-cart-count">{totalItems}</span>
          </button>
        </div>
      </header>
    </>
  );
}
