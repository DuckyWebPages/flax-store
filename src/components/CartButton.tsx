import React from "react";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const { count, setOpen } = useCart();
  return (
    <button onClick={() => setOpen(true)} style={{padding:"8px 12px",border:"1px solid #ddd",borderRadius:8,cursor:"pointer"}}>
      🛒 Cart {count ? <span style={{marginLeft:8,fontWeight:"bold"}}>{count}</span> : null}
    </button>
  );
}
