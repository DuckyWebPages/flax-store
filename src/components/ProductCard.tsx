// FILE: src/components/ProductCard.tsx
import React from "react";
import { useCart } from "./CartProvider.tsx";

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
  compact?: boolean;
};

const ProductCard: React.FC<Props> = ({ product, compact = false }) => {
  const { addItem, setOpen } = useCart();
  const { id, name, priceCents, imageUrl, badge, description, inStock = true } = product;

  const handleAdd = () => {
    console.log("[ProductCard] Add clicked:", { id, priceCents });
    addItem({
      id,
      name,
      unitCents: priceCents,
      qty: 1,
      priceId: id,      // required by CartProvider
      image: imageUrl,  // carry product image
    });
    setOpen(true);
  };

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
        padding: compact ? 10 : 12,
        overflow: "hidden",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: 8,
        height: "100%",
        position: "relative",
      }}
    >
      {/* IMAGE */}
      <div
        className="product-media"
        style={{
          borderRadius: 10,
          background: "#f9fafb",
          overflow: "hidden",
          marginBottom: 2,
          position: "relative",
        }}
      >
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

      {/* TEXT */}
      <div className="product-body" style={{ minHeight: 0 }}>
        <h3
          className="product-title"
          title={name}
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.4em",
          }}
        >
          {name}
        </h3>

        {description && (
          <p
            className="product-desc"
            style={{
              margin: "6px 0 0",
              fontSize: 13.5,
              color: "#475569",
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6em",
            }}
          >
            {description}
          </p>
        )}

        <div
          style={{
            marginTop: 6,
            fontSize: 15,
            fontWeight: 700,
            color: "#0f172a",
          }}
        >
          {price}
        </div>
      </div>

      {/* BUTTON */}
      <div className="product-actions" style={{ paddingTop: 6 }}>
        <button
          className="btn-cta add-to-cart"
          onClick={handleAdd}
          disabled={!inStock}
          type="button"
          aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
          // ⬇️ remove inline padding/fontSize so global.css controls size & weight
          style={{
            cursor: inStock ? "pointer" : "not-allowed",
          }}
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
