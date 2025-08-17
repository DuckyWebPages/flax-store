import React from "react";
import { CartProvider } from "./CartProvider";
import CartDrawer from "./CartDrawer";

export default function CartRoot() {
  return (
    <CartProvider>
      <CartDrawer />
    </CartProvider>
  );
}

