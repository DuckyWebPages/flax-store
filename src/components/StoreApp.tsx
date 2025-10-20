// FILE: src/components/StoreApp.tsx
import React from "react";
import CartProvider from "./CartProvider.tsx";
import CartDrawer from "./CartDrawer";
import ProductCard from "./ProductCard";

type Product = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  badge?: string;
  description?: string;
  inStock?: boolean;
};

export default function StoreApp({ products }: { products: Product[] }) {
  return (
    <CartProvider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "1rem",
        }}
      >
        {products.map((p) => (
  <ProductCard
    key={p.id}
    product={p}
    buttonClass="btn-cta add-to-cart" // ← this ties into your global CSS
  />
))}

      </div>

      <CartDrawer />
    </CartProvider>
  );
}
