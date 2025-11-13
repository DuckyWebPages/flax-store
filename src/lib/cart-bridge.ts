// FILE: src/lib/cart-bridge.ts
import { openCartWithStockWarnings } from "@/lib/shopify-inventory";

// mark that the bridge loaded
// @ts-ignore
window.__cartBridgeLoaded = true;
console.log("[cart-bridge] loaded");

async function jfetch(url: string, opts?: RequestInit) {
  const r = await fetch(url, opts);
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${r.status}`);
  return json;
}

function normalizeCartForDrawer(cart: any) {
  if (cart && cart.lines && Array.isArray(cart.lines.nodes)) {
    cart = { ...cart, lines: { edges: cart.lines.nodes.map((n: any) => ({ node: n })) } };
  }
  return cart;
}

async function addThenGetCart(opts: { handle?: string; sku?: string; quantity: number }) {
  await jfetch("/api/cart-add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const g = await jfetch("/api/cart-get");
  return g.cart || null;
}

export function initCartBridge() {
  // Capture-phase listener so we run BEFORE any legacy bubbling handlers
  document.addEventListener(
  "click",
  async (e) => {
    // 🚫 Ignore clicks inside the React cart drawer
    if ((e.target as HTMLElement)?.closest("[data-cartdrawer='astro-react']")) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Accept either class AND any element that has data-handle
      const btn =
        target.closest(".add-to-cart-react, .add-to-cart, [data-handle]") as HTMLElement | null;
      if (!btn) return;

      // Require a handle; otherwise let the click pass through
      const handle = btn.getAttribute("data-handle") || undefined;
      const sku = btn.getAttribute("data-sku") || undefined;
      const qty = Number(btn.getAttribute("data-qty") || "1") || 1;
      if (!handle && !sku) return;

      // Stop legacy listeners from hijacking the click
      e.preventDefault();
      e.stopPropagation();

      btn.setAttribute("disabled", "true");
      btn.classList.add("adding");

      try {
        const rawCart = await addThenGetCart({ handle, sku, quantity: qty });
        const cart = normalizeCartForDrawer(rawCart);
        console.log("[cart-bridge] opening drawer with cart:", cart);
        (window as any).__lastCartEvent = cart; // 👈 save for late listeners
        await openCartWithStockWarnings(cart);
      } catch (err: any) {
        alert(err?.message || "Could not add to cart.");
        console.error(err);
      } finally {
        btn.removeAttribute("disabled");
        btn.classList.remove("adding");
      }
    },
    { capture: true } // <-- important so we beat older bubble listeners
  );
  // --- Listen for clicks on the cart icon and open drawer ---
window.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("open-cart-btn");
  if (openBtn) {
    openBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const g = await jfetch("/api/cart-get");
        const cart = normalizeCartForDrawer(g.cart);
        console.log("[cart-bridge] icon clicked, opening drawer");
        window.dispatchEvent(
          new CustomEvent("cart:open", { detail: { cart, requestedMap: {}, warnings: [] } })
        );
      } catch (err) {
        console.warn("[cart-bridge] open-cart-btn failed", err);
      }
    });
  }
});
// Listen for quantity changes triggered inside the React drawer
window.addEventListener("cart:update", (e: any) => {
  const detail = e.detail || {};
  console.log("[cart-bridge] received cart:update", detail);
  const cart = normalizeCartForDrawer(detail.cart);
  window.dispatchEvent(
    new CustomEvent("cart:open", { detail: { cart, requestedMap: {}, warnings: [] } })
  );
});
// === React drawer → bridge sync ===
window.addEventListener("cart:update", (e: any) => {
  const detail = e.detail || {};
  console.log("[cart-bridge] received cart:update", detail);
  const cart = normalizeCartForDrawer(detail.cart);
  window.dispatchEvent(
    new CustomEvent("cart:open", { detail: { cart, requestedMap: {}, warnings: [] } })
  );
});

}
