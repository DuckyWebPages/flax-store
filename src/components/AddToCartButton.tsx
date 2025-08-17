import React from "react";
import { useCart } from "./CartProvider";
import type { CartItem } from "../lib/cart";

type Props = {
  id: string;
  name: string;
  cents: number; // unit price in cents
  image?: string;
};

export default function AddToCartButton({ id, name, cents, image }: Props) {
  const { add, setOpen } = useCart();

  const onClick = () => {
    const item: CartItem = {
      id,
      name,
      unitCents: Math.max(0, Math.round(cents)),
      image,
      qty: 1,
    };
    add(item, 1);   // your provider supports (item, qty?)
    setOpen(true);  // show the cart drawer
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-block",
        padding: ".6rem .9rem",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        background: "#fff",
        cursor: "pointer",
      }}
    >
      Add to Cart
    </button>
  );
}
