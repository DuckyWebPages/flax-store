import React from "react";
import { useCart } from "./CartProvider";

type Props = {
  /** Product id / sku used by your cart */
  id: string;
  /** Product display name */
  name: string;
  /** Price in cents (e.g. $49.95 => 4995) */
  cents: number;
  /** Optional image URL */
  image?: string;

  /** Optional styling hooks */
  className?: string;
  style?: React.CSSProperties;

  /** Optional click handler in addition to adding to cart */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export default function AddToCartButton({
  id,
  name,
  cents,
  image,
  className,
  style,
  onClick,
}: Props) {
  const { add, setOpen } = useCart();

  // Merge classes so page-level CSS can hook in too
  const cls = ["add-to-cart", "btn-cta", className].filter(Boolean).join(" ");

  // Default black/white CTA styles (works even if no CSS is loaded)
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
    // allow page/component overrides
    ...style,
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    add({ id, name, unitCents: cents, image }, 1);
    setOpen(true);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      className={cls}
      style={baseStyle}
      aria-label="Add to Cart"
      data-sku={id}
      onClick={handleClick}
    >
      Add to Cart
    </button>
  );
}
