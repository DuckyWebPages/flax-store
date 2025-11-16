// FILE: src/scripts/cart-entry.ts
import { initCartBridge } from "@/lib/cart-bridge";

if (typeof window !== "undefined") {
  initCartBridge();
}
