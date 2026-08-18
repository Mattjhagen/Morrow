"use client";

import { Store, StoreTheme } from "../lib/store-api";

export default function StorefrontHero({
  store,
  theme,
  onShopNow,
}: {
  store: Store;
  theme: StoreTheme;
  onShopNow: () => void;
}) {
  return (
    <>
      <section className="sf-hero">
        <div className="sf-hero-inner">
          <div className="sf-hero-content">
            <div className="sf-hero-tag">
              <span>✦</span> {store.tagline || "Artisan Goods Studio"}
            </div>
            <h1 className="sf-hero-title">
              {theme.banner_headline}
            </h1>
            <p className="sf-hero-desc">
              {theme.banner_subhead}
            </p>
            <div className="sf-hero-actions">
              <button className="sf-btn-primary" onClick={onShopNow}>
                Explore Collection <b>→</b>
              </button>
            </div>
          </div>

          <div className="sf-hero-visual">
            <div className="sf-hero-card">
              <img
                src={theme.hero_image}
                alt={store.name}
                className="sf-hero-img"
              />
              <div className="sf-hero-floating-pill">
                <span className="brand-mark" style={{ width: "24px", height: "24px", fontSize: "16px" }}>v</span>
                <div>
                  <small>NEW ARRIVAL SERIES</small>
                  <b>Small-batch craftsmanship</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <div className="sf-trust-bar">
        <div className="sf-trust-item">
          <div className="sf-trust-icon">🌿</div>
          <div className="sf-trust-text">
            <b>Carbon-Neutral Delivery</b>
            <small>Packaged with 100% recyclable fibers</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <div className="sf-trust-icon">✦</div>
          <div className="sf-trust-text">
            <b>Small-Batch Studio Made</b>
            <small>Handcrafted by independent artisans</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <div className="sf-trust-icon">🕊️</div>
          <div className="sf-trust-text">
            <b>Calm 30-Day Returns</b>
            <small>Hassle-free exchange guarantee</small>
          </div>
        </div>
      </div>
    </>
  );
}
