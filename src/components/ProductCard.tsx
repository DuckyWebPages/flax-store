import * as React from "react";
import { Button } from "./ui/Button";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  badge?: string;
  description?: string;
  inStock?: boolean;
};

type Props = {
  product: Product;
  onAddToCart?: (p: Product) => void;
  compact?: boolean;
};

export default function ProductCard({ product, onAddToCart, compact = false }: Props) {
  const { id, name, priceCents, imageUrl, badge, description, inStock = true } = product;

  const price = (priceCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  return (
    <article
      className="product-card"
      style={{
        // hard-enforce white card + subtle shadow (no Tailwind)
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        padding: compact ? 12 : 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
      }}
    >
      {/* Fixed 4:3 media box */}
      <div className="product-media" style={{ borderRadius: 12, background: "#f9fafb", overflow: "hidden" }}>
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
        {badge && (
          <span
            style={{
              position: "absolute",
              left: 12,
              top: 12,
              borderRadius: 999,
              background: "rgba(5, 150, 105, 0.9)",
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 title={name} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {name}
          </h3>
          {description && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#475569", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {description}
            </p>
          )}
        </div>
        <div style={{ whiteSpace: "nowrap", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{price}</div>
      </div>

      <div>
        <Button
          variant="primary"
          className="add-to-cart"
          disabled={!inStock}
          data-sku={id}
          data-qty={1}
          data-price={priceCents}
          data-name={name}
          onClick={() => onAddToCart?.(product)}
          aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
          type="button"
          // Make the button compact and NOT full-width
          style={{ alignSelf: "flex-start", padding: "8px 14px", fontSize: 14 }}
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </article>
  );
}
