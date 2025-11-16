// FILE: src/lib/cart-bridge.ts
import { openCartWithStockWarnings } from "@/lib/shopify-inventory";

async function jfetch(url: string, opts?: RequestInit) {
  const r = await fetch(url, opts);
  const json = await r.json().catch(() => ({}));
  if (!r.ok || (json as any)?.ok === false) {
    throw new Error((json as any)?.error || `HTTP ${r.status}`);
  }
  return json;
}

function normalizeCartForDrawer(cart: any) {
  if (cart && cart.lines && Array.isArray(cart.lines.nodes)) {
    cart = {
      ...cart,
      lines: { edges: cart.lines.nodes.map((n: any) => ({ node: n })) },
    };
  }
  return cart;
}

function computeCartQuantity(cart: any): number {
  if (!cart) return 0;
  if (typeof cart.totalQuantity === "number") return cart.totalQuantity;

  const edges = cart.lines?.edges || cart.lines?.nodes || [];
  return edges.reduce((sum: number, edge: any) => {
    const q = edge?.node?.quantity ?? 0;
    return sum + (typeof q === "number" ? q : 0);
  }, 0);
}

function updateCartBadge(cart: any) {
  const badge = document.getElementById("cart-badge") as HTMLElement | null;
  if (!badge) return;

  const total = computeCartQuantity(cart);
  if (total > 0) {
    badge.textContent = String(total);
    badge.style.display = "inline-block";
  } else {
    badge.textContent = "0";
    badge.style.display = "none";
  }
}

async function addThenGetCart(opts: { handle?: string; sku?: string; quantity: number }) {
  await jfetch("/api/cart-add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const g = await jfetch("/api/cart-get");
  return (g as any).cart || null;
}

async function syncCartFromServer() {
  try {
    const g = await jfetch("/api/cart-get");
    const cart = normalizeCartForDrawer((g as any).cart);
    updateCartBadge(cart);
    return cart;
  } catch (err) {
    console.warn("[cart-bridge] initial cart sync failed", err);
    return null;
  }
}

export function initCartBridge() {
  // ✅ ONLY run in the browser
  if (typeof window === "undefined") return;

  // prevent double-wiring
  if ((window as any).__cartBridgeLoaded) return;
  (window as any).__cartBridgeLoaded = true;
  console.log("[cart-bridge] init");

  // --- Global click handler for add-to-cart buttons ---
  document.addEventListener(
    "click",
    async (e) => {
      // 🚫 Ignore clicks inside the React cart drawer
      if ((e.target as HTMLElement)?.closest("[data-cartdrawer='astro-react']")) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest(
        ".add-to-cart-react, .add-to-cart, [data-handle]",
      ) as HTMLElement | null;
      if (!btn) return;

      const handle = btn.getAttribute("data-handle") || undefined;
      const sku = btn.getAttribute("data-sku") || undefined;
      const qty = Number(btn.getAttribute("data-qty") || "1") || 1;
      if (!handle && !sku) return;

      e.preventDefault();
      e.stopPropagation();

      btn.setAttribute("disabled", "true");
      btn.classList.add("adding");

      try {
        const rawCart = await addThenGetCart({ handle, sku, quantity: qty });
        const cart = normalizeCartForDrawer(rawCart);
        console.log("[cart-bridge] opening drawer with cart:", cart);
        (window as any).__lastCartEvent = cart;

        // 🔹 keep badge in sync
        updateCartBadge(cart);

        await openCartWithStockWarnings(cart);
      } catch (err: any) {
        alert(err?.message || "Could not add to cart.");
        console.error(err);
      } finally {
        btn.removeAttribute("disabled");
        btn.classList.remove("adding");
      }
    },
    { capture: true },
  );

  // --- Cart icon → open drawer + sync badge ---
  const openBtn = document.getElementById("open-cart-btn");
  if (openBtn) {
    openBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const g = await jfetch("/api/cart-get");
        const cart = normalizeCartForDrawer((g as any).cart);
        console.log("[cart-bridge] icon clicked, opening drawer");

        // keep badge accurate
        updateCartBadge(cart);

        window.dispatchEvent(
          new CustomEvent("cart:open", {
            detail: { cart, requestedMap: {}, warnings: [] },
          }),
        );
      } catch (err) {
        console.warn("[cart-bridge] open-cart-btn failed", err);
      }
    });
  }

  // --- React drawer → bridge sync (e.g. quantity changes) ---
  window.addEventListener("cart:update", (e: any) => {
    const detail = e.detail || {};
    console.log("[cart-bridge] received cart:update", detail);
    const cart = normalizeCartForDrawer(detail.cart);
    updateCartBadge(cart);
    window.dispatchEvent(
      new CustomEvent("cart:open", {
        detail: { cart, requestedMap: {}, warnings: [] },
      }),
    );
  });

  // 🔹 Initial badge sync on page load
  syncCartFromServer();
}
