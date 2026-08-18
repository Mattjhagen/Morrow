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
  const [selectedImg, setSelectedImg] = useState(product.image_url || "");
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [activeTab, setActiveTab] = useState<"specs" | "craft" | "shipping">("specs");

  useEffect(() => {
    setSelectedImg(product.image_url || "");
    setQty(1);
    getProductReviews(product.id).then(setReviews);
  }, [product]);

  const gallery = product.gallery_urls?.length ? product.gallery_urls : [product.image_url || ""];
  const isSale = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents;
  const discountPercent = isSale
    ? Math.round(((product.compare_at_price_cents! - product.price_cents) / product.compare_at_price_cents!) * 100)
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
              <span className="sf-pdp-price">{money(product.price_cents, product.currency)}</span>
              {isSale && (
                <>
                  <span className="sf-pdp-compare">
                    {money(product.compare_at_price_cents!, product.currency)}
                  </span>
                  <span className="sf-save-badge">Save {discountPercent}%</span>
                </>
              )}
            </div>

            {product.inventory_count > 0 ? (
              <div className={`sf-stock-badge ${product.inventory_count <= 4 ? "lowstock" : "instock"}`}>
                <span>●</span>{" "}
                {product.inventory_count <= 4
                  ? `Only ${product.inventory_count} remaining in current batch`
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
                  onClick={() => setQty(Math.min(product.inventory_count || 10, qty + 1))}
                  disabled={qty >= product.inventory_count}
                >
                  +
                </button>
              </div>

              <button
                className="sf-btn-add-cart"
                onClick={() => {
                  onAddToCart(product, qty);
                  onClose();
                }}
                disabled={product.inventory_count === 0}
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
