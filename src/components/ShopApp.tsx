import React from "react";
import CartProvider from "./CartProvider.tsx";


type P = {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ShopApp({ products }: { products: P[] }) {
    const { addItem, setOpen } = useCart();

return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "1.25rem",
      }}
    >
      {products.map((p) => {
        const unitCents = Math.round((p.price || 0) * 100);

        return (
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

              {/* ✅ Add to Cart button (cartStore.js will catch this) */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
  className="btn-cta"
  onClick={() => {
    addItem({
      id: p.id,
      name: p.name,
      unitCents,
      qty: 1,
      priceId: p.id, // temporary placeholder until Stripe IDs are mapped
    });
    setOpen(true); // this makes the drawer slide open immediately
  }}
  aria-label={`Add ${p.name} to cart`}
>
  Add to Cart
</button>

              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
