import React from "react";
import { CartProvider } from "./CartProvider";
import CartDrawer from "./CartDrawer";
import AddToCartButton from "./AddToCartButton";

type P = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  stripePaymentLink?: string;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

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

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {p.stripePaymentLink?.startsWith("https://buy.stripe.com/") ? (
                  <a
                    href={p.stripePaymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      textDecoration: "none",
                      background: "#111827",     // BLACK BACKGROUND
                      color: "#fff",             // WHITE TEXT
                      border: "1px solid #111827",
                      padding: ".6rem .9rem",
                      borderRadius: 10,
                    }}
                  >
                    Buy Now
                  </a>
                ) : (
                  <button
                    disabled
                    title="Checkout link missing or invalid"
                    style={{
                      opacity: 0.6,
                      cursor: "not-allowed",
                      border: "1px solid #cbd5e1",
                      padding: ".6rem .9rem",
                      borderRadius: 10,
                      background: "#f1f5f9",
                    }}
                  >
                    Coming soon
                  </button>
                )}

                <AddToCartButton
                  id={p.id}
                  name={p.name}
                  cents={Math.round((p.price || 0) * 100)}
                  image={p.image}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </CartProvider>
  );
}
