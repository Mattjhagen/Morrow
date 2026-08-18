"use client";

import { useEffect, useState } from "react";
import "./storefront.css";
import {
  Discount,
  Order,
  Product,
  Store,
  StoreTheme,
  DEFAULT_THEME,
  getStoreTheme,
  listProducts,
} from "../lib/store-api";
import { CartItem } from "./types";
import StorefrontNav from "./StorefrontNav";
import StorefrontHero from "./StorefrontHero";
import ProductCatalog from "./ProductCatalog";
import ProductDetailModal from "./ProductDetailModal";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import OrderConfirmationModal from "./OrderConfirmationModal";

export default function StorefrontView({
  store,
  onOpenDashboard,
  onBackToLanding,
}: {
  store: Store;
  onOpenDashboard: () => void;
  onBackToLanding: () => void;
}) {
  const [theme, setTheme] = useState<StoreTheme>(DEFAULT_THEME);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  // Interactive Modals & Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [activePdpProduct, setActivePdpProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Load store theme and products
  useEffect(() => {
    getStoreTheme(store.id).then(setTheme);
    listProducts(store.id).then((prods) => {
      setProducts(prods);
      const uniqueCats = Array.from(new Set(prods.map((p) => p.category).filter(Boolean))) as string[];
      setCategories(uniqueCats);
    });
  }, [store.id]);

  // Cart Management
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOrderCompleted = (order: Order) => {
    setCart([]);
    setAppliedDiscount(null);
    setIsCheckoutOpen(false);
    setConfirmedOrder(order);
    // Reload products to reflect updated inventory
    listProducts(store.id).then(setProducts);
  };

  return (
    <div className="storefront-root">
      {/* Navigation Header */}
      <StorefrontNav
        store={store}
        theme={theme}
        cart={cart}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenDashboard={onOpenDashboard}
        onBackToLanding={onBackToLanding}
      />

      {/* Hero Banner */}
      <StorefrontHero
        store={store}
        theme={theme}
        onShopNow={() => {
          const el = document.getElementById("catalog");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Product Catalog & Category Filters */}
      <ProductCatalog
        products={products}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onOpenPdp={(p) => setActivePdpProduct(p)}
        onQuickAdd={(p, e) => {
          e.stopPropagation();
          handleAddToCart(p, 1);
        }}
      />

      {/* Storefront Footer */}
      <footer className="sf-footer">
        <div className="sf-footer-grid">
          <div className="sf-footer-brand">
            <h3>{store.name}</h3>
            <p style={{ color: "#bdccc4", fontSize: "14px", lineHeight: "1.6", maxWidth: "340px" }}>
              {theme.banner_subhead}
            </p>
          </div>

          <div className="sf-footer-col">
            <h4>Collections</h4>
            <ul>
              {categories.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => {
                      setSelectedCategory(c);
                      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0 }}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="sf-footer-col">
            <h4>Studio & Care</h4>
            <ul>
              <li>Our Sustainable Studio</li>
              <li>Ceramic Care Guide</li>
              <li>Wholesale & Trade</li>
              <li>Carbon Neutral Shipping</li>
            </ul>
          </div>

          <div className="sf-footer-col sf-footer-newsletter">
            <h4>The Studio Journal</h4>
            <p style={{ fontSize: "13px", color: "#bdccc4", margin: "0 0 12px" }}>
              Stories on slow living, studio previews, and exclusive small batch drops.
            </p>
            <input type="email" placeholder="you@domain.com" />
            <button className="sf-btn-primary" style={{ width: "100%", padding: "10px" }}>
              Subscribe
            </button>
          </div>
        </div>

        <div className="sf-footer-bottom">
          <span>© {new Date().getFullYear()} {store.name} · Powered by Velour Commerce Engine</span>
          <div style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={onOpenDashboard}
              style={{ background: "none", border: "none", color: "var(--sf-lime)", cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
            >
              Merchant Admin ↗
            </button>
            <button
              onClick={onBackToLanding}
              style={{ background: "none", border: "none", color: "#bdccc4", cursor: "pointer", fontSize: "12px" }}
            >
              Velour Home
            </button>
          </div>
        </div>
      </footer>

      {/* PDP Modal */}
      {activePdpProduct && (
        <ProductDetailModal
          product={activePdpProduct}
          onClose={() => setActivePdpProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          storeId={store.id}
          theme={theme}
          cart={cart}
          appliedDiscount={appliedDiscount}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onApplyDiscount={(d) => setAppliedDiscount(d)}
          onClose={() => setIsCartOpen(false)}
          onProceedToCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          store={store}
          cart={cart}
          appliedDiscount={appliedDiscount}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {/* Order Confirmed Modal */}
      {confirmedOrder && (
        <OrderConfirmationModal
          order={confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
          onOpenDashboard={onOpenDashboard}
        />
      )}
    </div>
  );
}
