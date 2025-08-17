import React from "react";
import { CartProvider } from "./CartProvider";
import CartButton from "./CartButton";
import CartDrawer from "./CartDrawer";
import AddToCart from "./AddToCart";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  stripePaymentLink?: string;
};

export default function CartIsland({ products }: { products: Product[] }) {
  return (
    <CartProvider>
      {/* Header cart button */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}>
        <CartButton />
      </div>

      {/* Product grid (rendered inside the same React tree so context is available) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {products.map((p) => {
          const unitCents = Math.round((p.price ?? 0) * 100);
          const item = { id: p.id, name: p.name, unitCents, image: p.image };
          return (
            <article
              key={p.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 10,
                    background: "#f1f5f9",
                  }}
                />
              ) : null}
              <div style={{ fontWeight: 700, margin: "10px 0 4px" }}>{p.name}</div>
              {p.description ? (
                <div style={{ fontSize: 14, color: "#475569" }}>{p.description}</div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 10,
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontWeight: 800 }}>${(p.price ?? 0).toFixed(2)}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <AddToCart {...item} />
                  {p.stripePaymentLink ? (
                    <a
                      href={p.stripePaymentLink}
                      rel="noopener noreferrer"
                      style={{
                        background: "#000",
                        color: "#fff",
                        padding: "8px 12px",
                        borderRadius: 8,
                        fontSize: 14,
                        textDecoration: "none",
                      }}
                    >
                      Buy
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: "#64748b" }}>Coming soon</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Drawer mounted once */}
      <CartDrawer />
    </CartProvider>
  );
}

