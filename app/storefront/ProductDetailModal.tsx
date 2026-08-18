"use client";

import { useEffect, useState } from "react";
import { Product, ProductReview, getProductReviews, money } from "../lib/store-api";

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, quantity: number) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
  const [selectedImg, setSelectedImg] = useState(product.image_url || "");
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [activeTab, setActiveTab] = useState<"specs" | "craft" | "shipping">("specs");

  useEffect(() => {
    const defaultVar = product.variants?.[0] || null;
    setSelectedVariant(defaultVar);
    setSelectedImg(defaultVar?.image_url || product.image_url || "");
    setQty(1);
    getProductReviews(product.id).then(setReviews);
  }, [product]);

  const activePriceCents = selectedVariant ? selectedVariant.price_cents : product.price_cents;
  const activeCompareCents = selectedVariant ? selectedVariant.compare_at_price_cents : product.compare_at_price_cents;
  const activeStock = selectedVariant ? selectedVariant.inventory_count : product.inventory_count;

  const gallery = product.gallery_urls?.length ? product.gallery_urls : [product.image_url || ""];
  const isSale = activeCompareCents && activeCompareCents > activePriceCents;
  const discountPercent = isSale
    ? Math.round(((activeCompareCents! - activePriceCents) / activeCompareCents!) * 100)
    : 0;

  return (
    <div className="sf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sf-pdp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sf-modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <div className="sf-pdp-grid">
          {/* Gallery Column */}
          <div className="sf-pdp-gallery">
            <div className="sf-pdp-main-img-wrap">
              <img src={selectedImg} alt={product.name} className="sf-pdp-main-img" />
            </div>

            {gallery.length > 1 && (
              <div className="sf-pdp-thumbs">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    className={`sf-pdp-thumb-btn ${selectedImg === img ? "active" : ""}`}
                    onClick={() => setSelectedImg(img)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Actions Column */}
          <div className="sf-pdp-details">
            {product.category && <span className="sf-pdp-category">{product.category}</span>}
            <h1 className="sf-pdp-title">{product.name}</h1>

            <div className="sf-pdp-price-row">
              <span className="sf-pdp-price">{money(activePriceCents, product.currency)}</span>
              {isSale && (
                <>
                  <span className="sf-pdp-compare">
                    {money(activeCompareCents!, product.currency)}
                  </span>
                  <span className="sf-save-badge">Save {discountPercent}%</span>
                </>
              )}
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 1 && (
              <div style={{ margin: "14px 0" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#6e7c73", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
                  Option: <strong style={{ color: "#17372e" }}>{selectedVariant?.name}</strong>
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        if (v.image_url) setSelectedImg(v.image_url);
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        fontFamily: "var(--sf-font-sans)",
                        cursor: "pointer",
                        border: selectedVariant?.id === v.id ? "2px solid #17372e" : "1px solid #d8e0d6",
                        background: selectedVariant?.id === v.id ? "#17372e" : "#fffcf4",
                        color: selectedVariant?.id === v.id ? "#fff" : "#17372e",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {v.name} · {money(v.price_cents)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeStock > 0 ? (
              <div className={`sf-stock-badge ${activeStock <= 4 ? "lowstock" : "instock"}`}>
                <span>●</span>{" "}
                {activeStock <= 4
                  ? `Only ${activeStock} remaining in current batch`
                  : "In Stock & Ready to Ship"}
              </div>
            ) : (
              <div className="sf-stock-badge lowstock">
                <span>●</span> Sold Out
              </div>
            )}

            <p className="sf-pdp-desc">{product.description}</p>

            {/* Quantity and Add to Cart */}
            <div className="sf-pdp-actions">
              <div className="sf-qty-stepper">
                <button
                  className="sf-qty-btn"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                >
                  −
                </button>
                <span className="sf-qty-val">{qty}</span>
                <button
                  className="sf-qty-btn"
                  onClick={() => setQty(Math.min(activeStock || 10, qty + 1))}
                  disabled={qty >= activeStock}
                >
                  +
                </button>
              </div>

              <button
                className="sf-btn-add-cart"
                onClick={() => {
                  const finalProduct: Product = {
                    ...product,
                    name: selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name,
                    price_cents: activePriceCents,
                    compare_at_price_cents: activeCompareCents,
                    image_url: selectedVariant?.image_url || product.image_url,
                  };
                  onAddToCart(finalProduct, qty);
                  onClose();
                }}
                disabled={activeStock === 0}
              >
                <span>{product.inventory_count > 0 ? `Add to Bag · ${money(product.price_cents * qty)}` : "Sold Out"}</span>
              </button>
            </div>

            {/* Product Accordion Info */}
            <div className="sf-accordions">
              <div className="sf-accordion-item">
                <button
                  className="sf-accordion-trigger"
                  onClick={() => setActiveTab(activeTab === "specs" ? ("" as any) : "specs")}
                >
                  <span>Product Specifications</span>
                  <span>{activeTab === "specs" ? "−" : "+"}</span>
                </button>
                {activeTab === "specs" && (
                  <div className="sf-accordion-body">
                    {product.details ? (
                      <table className="sf-specs-table">
                        <tbody>
                          {Object.entries(product.details).map(([k, v]) => (
                            <tr key={k}>
                              <td>{k}</td>
                              <td>{v}</td>
                            </tr>
                          ))}
                          {product.sku && (
                            <tr>
                              <td>SKU</td>
                              <td>{product.sku}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <p>Hand-crafted with natural materials. Sizing and weight may vary slightly due to artisan touch.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="sf-accordion-item">
                <button
                  className="sf-accordion-trigger"
                  onClick={() => setActiveTab(activeTab === "craft" ? ("" as any) : "craft")}
                >
                  <span>Artisan Craftsmanship & Origin</span>
                  <span>{activeTab === "craft" ? "−" : "+"}</span>
                </button>
                {activeTab === "craft" && (
                  <div className="sf-accordion-body">
                    <p>
                      Each object is produced in small, ethical studios prioritizing generational craftsmanship,
                      sustainable resource extraction, and low-waste production lines.
                    </p>
                  </div>
                )}
              </div>

              <div className="sf-accordion-item">
                <button
                  className="sf-accordion-trigger"
                  onClick={() => setActiveTab(activeTab === "shipping" ? ("" as any) : "shipping")}
                >
                  <span>Shipping & Calm Returns</span>
                  <span>{activeTab === "shipping" ? "−" : "+"}</span>
                </button>
                {activeTab === "shipping" && (
                  <div className="sf-accordion-body">
                    <p>
                      Orders ship within 24–48 hours in 100% recyclable, plastic-free boxes. Enjoy calm 30-day returns
                      with prepaid return labels.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="sf-reviews-section">
              <h3 className="sf-reviews-title">Verified Customer Reviews ({reviews.length})</h3>
              {reviews.map((rev) => (
                <div key={rev.id} className="sf-review-card">
                  <div className="sf-review-head">
                    <span className="sf-review-author">{rev.author_name}</span>
                    <span className="sf-review-verified">✓ Verified Buyer</span>
                  </div>
                  <div className="sf-stars">{"★".repeat(rev.rating)}</div>
                  <strong style={{ display: "block", fontSize: "13px", marginTop: "4px", color: "var(--sf-ink)" }}>
                    {rev.title}
                  </strong>
                  <p className="sf-review-text">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
