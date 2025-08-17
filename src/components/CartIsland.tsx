import React from "react";
import { CartProvider } from "./CartProvider";
import CartButton from "./CartButton";
import CartDrawer from "./CartDrawer";

export default function CartIsland({ children }: { children?: React.ReactNode }) {
  return (
    <CartProvider>
      {/* Header controls */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <CartButton />
      </div>

      {/* Page content that needs cart context (e.g., AddToCart buttons) */}
      {children}

      {/* Drawer mounted once */}
      <CartDrawer />
    </CartProvider>
  );
}
