"use client";

import { useMemo } from "react";
import { Product } from "../lib/store-api";
import ProductCard from "./ProductCard";

export default function ProductCatalog({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onOpenPdp,
  onQuickAdd,
}: {
  products: Product[];
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (sort: any) => void;
  onOpenPdp: (p: Product) => void;
  onQuickAdd: (p: Product, e: React.MouseEvent) => void;
}) {
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.status === "archived" || p.status === "draft") return false;
        if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesDesc = p.description?.toLowerCase().includes(q);
          const matchesCat = p.category?.toLowerCase().includes(q);
          if (!matchesName && !matchesDesc && !matchesCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price_cents - b.price_cents;
        if (sortBy === "price-desc") return b.price_cents - a.price_cents;
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0; // featured
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="catalog" className="sf-catalog-section">
      <div className="sf-catalog-head">
        <div className="sf-catalog-title-row">
          <div>
            <h2>Curated Collection</h2>
            <p>Thoughtfully designed objects and textiles for your everyday rituals.</p>
          </div>
          <div className="sf-filter-controls">
            <input
              type="text"
              className="sf-search-input"
              placeholder="Search ceramics, linen…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <select
              className="sf-sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Customer Rated</option>
              <option value="newest">Newest Releases</option>
            </select>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="sf-filter-bar">
          <div className="sf-category-pills">
            <button
              className={`sf-cat-pill ${selectedCategory === "All" ? "active" : ""}`}
              onClick={() => onSelectCategory("All")}
            >
              All Objects ({products.filter((p) => p.status === "active").length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat && p.status === "active").length;
              return (
                <button
                  key={cat}
                  className={`sf-cat-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => onSelectCategory(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--sf-paper)", borderRadius: "12px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>✦</div>
          <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "22px", margin: "0 0 8px" }}>
            No objects found matching your search
          </h3>
          <p style={{ color: "var(--sf-muted)", margin: "0 0 20px" }}>
            Try clearing your search query or choosing another category filter.
          </p>
          <button
            className="sf-btn-secondary"
            onClick={() => {
              onSelectCategory("All");
              onSearchChange("");
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="sf-product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenPdp={onOpenPdp}
              onQuickAdd={onQuickAdd}
            />
          ))}
        </div>
      )}
    </section>
  );
}
