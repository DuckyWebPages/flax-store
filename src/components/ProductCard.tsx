import React from "react";
import { Button } from "./ui/Button";

type Product = {
  id: string;           // your SKU (what your cart code expects)
  name: string;
  priceCents: number;   // integer cents, e.g. 4499
  imageUrl: string;
  badge?: string;       // "Featured", "New", etc. (optional)
  description?: string; // optional
  inStock?: boolean;    // default true
};

type Props = {
  product: Product;
  onAddToCart?: (p: Product) => void; // optional – your cart can hook into this later
  compact?: boolean;                  // smaller layout for featured section
};

export default function ProductCard({ product, onAddToCart, compact = false }: Props) {
  const { id, name, priceCents, imageUrl, badge, description, inStock = true } = product;

  const price = (priceCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-50">
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{name}</h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{description}</p>
          )}
        </div>
        <div className="shrink-0 text-right text-base font-semibold text-slate-900">
          {price}
        </div>
      </div>

      <div className="mt-3">
        <Button
          variant="primary"
          className="w-full"
          disabled={!inStock}
          // These data-* attributes let your existing cart handler keep working.
          data-sku={id}
          data-qty={1}
          data-price={priceCents}
          data-name={name}
          onClick={() => onAddToCart?.(product)}
          aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </article>
  );
}
