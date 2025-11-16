// FILE: src/components/CartBridge.tsx
import { useEffect } from "react";
import { initCartBridge } from "@/lib/cart-bridge";

export default function CartBridge() {
  useEffect(() => {
    try {
      initCartBridge();
    } catch (err) {
      console.error("[CartBridge] init failed", err);
    }
  }, []);

  return null;
}
