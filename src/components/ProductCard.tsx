import React from "react";
import { Button } from "./ui/Button";

export type Product = {
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

const ProductCard: React.FC<Props> = ({ product, onAddToCart, compact = false }) => {
  const { id, name, priceCents, imageUrl, badge, description, inStock = true } = product;

  const price = (priceCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

  return (
    <article
      className="product-card"
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        padding: compact ? 10 : 12,            // was 12/16
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 8,                                 // was 10
        height: "100%",
        position: "relative",
      }}
    >
      {/* MEDIA (fixed ratio via CSS) */}
      <div className="product-media" style={{ borderRadius: 10, background: "#f9fafb", overflow: "hidden", marginBottom: 2 }}>
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
              left: 10,
              top: 10,
              borderRadius: 999,
              background: "rgba(5,150,105,.9)",
              padding: "5px 8px",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* BODY */}
      <div className="product-body" style={{ minHeight: 0 }}>
        <h3
          className="product-title"
          title={name}
          style={{
            margin: 0,
            fontSize: 15,                        // was 16
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.4em",                  // reserve ≈2 lines
          }}
        >
          {name}
        </h3>

        {description && (
          <p
            className="product-desc"
            style={{
              margin: "6px 0 0",
              fontSize: 13.5,                    // was 14
              color: "#475569",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6em",                // reserve ≈2 lines
            }}
          >
            {description}
          </p>
        )}

        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
          {price}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="product-actions" style={{ paddingTop: 6 }}>
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
          style={{ padding: "6px 12px", fontSize: 14 }}  // tighter button
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </article>
  );
};

export default ProductCard;
