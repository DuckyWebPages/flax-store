import React from "react";
import { CartProvider } from "./CartProvider";
import CartDrawer from "./CartDrawer";
import AddToCart from "./AddToCart";

type P = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  stripePaymentLink?: string; // kept, but not used here
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// tiny util so we can pass a CTA class reliably
const cx = (...xs: Array<string | undefined | false>) => xs.filter(Boolean).join(" ");

export default function ShopApp({ products }: { products: P[] }) {
  return (
    <CartProvider>
      {/* The slide-out cart drawer (opens after Add to Cart) */}
      <CartDrawer />

      {/* Product grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {products.map((p) => (
          <article
            key={p.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {p.image ? (
              <img
                src={p.image}
                alt={p.name}
                style={{ width: "100%", height: 220, objectFit: "cover" }}
                loading="lazy"
              />
            ) : null}

            <div style={{ padding: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 .25rem 0" }}>
                {p.name}
              </h2>

              {typeof p.price === "number" ? (
                <div style={{ fontWeight: 600, margin: "0 0 .5rem 0" }}>
                  {fmt(p.price)}
                </div>
              ) : null}

              {p.description ? (
                <p
                  style={{
                    fontSize: ".95rem",
                    lineHeight: 1.35,
                    margin: "0 0 .75rem 0",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {p.description}
                </p>
              ) : null}

              {/* Actions (NO Buy Now link; Add to Cart only) */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <AddToCart
                  id={p.id}
                  name={p.name}
                  unitCents={Math.round((p.price || 0) * 100)}
                  image={p.image}
                  className={cx("btn-cta", "add-to-cart")}
                  {...{ "data-sku": p.id }}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </CartProvider>
  );
}
