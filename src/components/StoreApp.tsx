// FILE: src/components/StoreApp.tsx
import React from "react";

type Product = {
  id: string;        // SKU (must match your API / PRICE_MAP alias)
  name: string;
  priceCents: number;
  imageUrl: string;
  badge?: string;
};

export default function StoreApp({ products }: { products: Product[] }) {
  // One way to the cart: call the provider bridge we set in CartApp.tsx
  const add = (p: Product) => {
    (window as any).FLH_ADD?.({
      id: p.id,
      name: p.name,
      qty: 1,
      unitCents: p.priceCents,
      image: p.imageUrl,
    });
    (window as any).cartOpen?.();
  };

  return (
    <div className="prodpg__grid">
      {products.map((p) => (
        <div className="feat-card" key={p.id}>
          <a className="feat-link" href={`/products/${slugFromId(p.id)}`} aria-label={p.name}>
            <div className="feat-imgwrap">
              {p.badge ? <span className="feat-badge">{p.badge}</span> : null}
              <img src={p.imageUrl} alt={p.name} loading="lazy" decoding="async" />
            </div>
            <span className="feat-title">{p.name}</span>
            <span className="feat-price">{formatCents(p.priceCents)}</span>
          </a>

          {/* NOTE: We DO NOT rely on data-* here; we call the provider directly */}
          <button
            className="btn-cta add-to-cart"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // don't navigate the <a>
              add(p);
            }}
            aria-label={`Add ${p.name} to cart`}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}

function formatCents(cents: number): string {
  const n = Number.isFinite(cents) ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function slugFromId(id: string): string {
  // Map common SKUs to slugs you actually have pages for
  const map: Record<string, string> = {
    "fhl-single": "flax-hull-lignans",
    "ancient-single": "flax-hull-lignans",     // goes to the flax page; adjust if you have a dedicated page
    "ocean-cleanse-single": "ocean-cleanse",
    "essiac-tea": "essiac-tea",
    // add more if needed
  };
  return map[id] || id;
}
