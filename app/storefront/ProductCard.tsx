"use client";

import { Product, money } from "../lib/store-api";

export default function ProductCard({
  product,
  onOpenPdp,
  onQuickAdd,
}: {
  product: Product;
  onOpenPdp: (p: Product) => void;
  onQuickAdd: (p: Product, e: React.MouseEvent) => void;
}) {
  const isSale = product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents;
  const discountPercent = isSale
    ? Math.round(((product.compare_at_price_cents! - product.price_cents) / product.compare_at_price_cents!) * 100)
    : 0;

  return (
    <article className="sf-product-card" onClick={() => onOpenPdp(product)}>
      <div className="sf-card-image-wrap">
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"}
          alt={product.name}
          className="sf-card-img"
          loading="lazy"
        />
        
        <div className="sf-card-badges">
          {isSale && <span className="sf-badge sale">Save {discountPercent}%</span>}
          {product.badges?.map((b) => (
            <span key={b} className={`sf-badge ${b.toLowerCase().replace(/\s+/g, "")}`}>
              {b}
            </span>
          ))}
          {product.inventory_count > 0 && product.inventory_count <= 4 && (
            <span className="sf-badge lowstock">Only {product.inventory_count} left</span>
          )}
        </div>

        <button
          className="sf-quick-add-btn"
          onClick={(e) => onQuickAdd(product, e)}
          disabled={product.inventory_count === 0}
        >
          {product.inventory_count > 0 ? "+ Quick Add to Bag" : "Sold Out"}
        </button>
      </div>

      <div className="sf-card-body">
        {product.category && <span className="sf-card-category">{product.category}</span>}
        <h3 className="sf-card-title">{product.name}</h3>

        {product.rating && (
          <div className="sf-card-rating">
            <span className="sf-stars">★ {product.rating.toFixed(1)}</span>
            {product.review_count && <span>({product.review_count})</span>}
          </div>
        )}

        <div className="sf-card-price-row">
          <span className="sf-current-price">{money(product.price_cents, product.currency)}</span>
          {isSale && (
            <span className="sf-compare-price">
              {money(product.compare_at_price_cents!, product.currency)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
