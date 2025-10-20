// FILE: src/components/AddToCartButton.tsx
import React from "react";
import AddToCart from "./AddToCart.tsx";

type Props = {
  id: string;
  name: string;
  /** Price in cents (e.g. 4995) */
  cents: number;
  image?: string;
  className?: string;
  style?: React.CSSProperties;
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
  // Just translate `cents` → `unitCents` and forward everything to the canonical component
  return (
    <AddToCart
      id={id}
      name={name}
      unitCents={cents}
      image={image}
      className={className}
      style={style}
      onClick={onClick}
    >
      Add to Cart
    </AddToCart>
  );
}
