import React from "react";
import { useCart } from "./CartProvider.tsx";
import type { CartItem } from "../lib/cart";

type Props = (CartItem & { qty?: number }) &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function AddToCart({
  qty,
  className,
  style,
  children,
  id,
  name,
  unitCents,
  image,
  ...rest
}: Props) {
  const { add, setOpen } = useCart();

  const cls = ["add-to-cart", "btn-cta", className].filter(Boolean).join(" ");

  // Same pill/black/white style you like
  const baseStyle: React.CSSProperties = {
    background: "#111827",
    color: "#fff",
    border: 0,
    borderRadius: 9999,
    padding: "10px 16px",
    minWidth: 160,
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 18px rgba(0,0,0,.18)",
    cursor: "pointer",
    lineHeight: 1,
    ...style,
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    add({ id, name, unitCents, image }, qty ?? 1);
    setOpen(true);
    rest.onClick?.(e);
  };

  return (
    <button
      type="button"
      className={cls}
      style={baseStyle}
      aria-label="Add to Cart"
      data-sku={id}
      onClick={handleClick}
      {...rest}
    >
      {children ?? "Add to Cart"}
    </button>
  );
}
