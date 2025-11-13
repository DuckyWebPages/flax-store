// FILE: src/components/CartDrawer.tsx
// Cart drawer with stock warnings + optimistic quantity updates + remove button
import { useEffect, useMemo, useRef, useState } from "react";

type Money = { amount: string; currencyCode: string };

type CartLine = {
  id: string;
  quantity: number;
  cost?: { subtotalAmount?: Money };
  merchandise?: {
    id: string; // variant GID
    title: string;
    product?: {
      title: string;
      handle: string;
      featuredImage?: { url: string; altText?: string };
      // images?: { nodes: { url: string; altText?: string }[] }; // optional
    };
    price?: Money;
  };
};

type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost?: { subtotalAmount?: Money; totalAmount?: Money };
  lines: { edges: { node: CartLine }[] };
};

type Warning = {
  lineId: string;
  title: string;
  requested: number;
  available: number;
};

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [stockAlert, setStockAlert] = useState<string | null>(null);

  // Warnings state
  const [warnings, setWarnings] = useState<Warning[]>([]);
  // Snapshot of what the shopper *asked for* before clamping
  const prevQtyRef = useRef<Record<string, number>>({});

  // === EVENTS ===
  useEffect(() => {
    // Our main "open" event. We accept optional warnings + requestedMap.
    const onOpen = (e: any) => {
      const d = e.detail || {};
      console.log("[CartDrawer] received cart:open", d);
      const nextCart = d.cart as Cart;
      setCart(nextCart);
      setOpen(true);

      if (d.requestedMap && typeof d.requestedMap === "object") {
        prevQtyRef.current = d.requestedMap;
      }
      if (Array.isArray(d.warnings)) setWarnings(d.warnings);
      else setWarnings([]);
    };

    const onInit = (e: any) => {
      console.log("[CartDrawer] received cart:init", e.detail);
      setCart(e.detail.cart as Cart);
    };

    const onWarnings = (e: any) => {
      const d = e.detail || {};
      if (Array.isArray(d.warnings)) setWarnings(d.warnings);
      if (d.requestedMap && typeof d.requestedMap === "object") {
        prevQtyRef.current = d.requestedMap;
      }
    };

    const onStockAlert = (e: any) => {
      const msg = e.detail?.message || "";
      console.log("[CartDrawer] received cart:stockalert", msg);
      setStockAlert(msg);
      if (msg) setTimeout(() => setStockAlert(null), 4000);
    };

    // Attach listeners
    window.addEventListener("cart:open", onOpen as any);
    window.addEventListener("cart:init", onInit as any);
    window.addEventListener("cart:warnings", onWarnings as any);
    window.addEventListener("cart:stockalert", onStockAlert as any);

    // If the cart bridge already ran before React mounted, re-sync here
    const maybeCart = (window as any).__lastCartEvent;
    if (maybeCart) {
      console.log("[CartDrawer] late sync with saved cart");
      setCart(maybeCart);
      setOpen(true);
    }

    return () => {
      window.removeEventListener("cart:open", onOpen as any);
      window.removeEventListener("cart:init", onInit as any);
      window.removeEventListener("cart:warnings", onWarnings as any);
      window.removeEventListener("cart:stockalert", onStockAlert as any);
    };
  }, []);

  // === If no warnings were passed, synthesize them by comparing requested vs actual ===
  useEffect(() => {
    if (!cart?.lines?.edges?.length) {
      setWarnings([]);
      return;
    }
    setWarnings((existing) => {
      if (existing.length) return existing; // already supplied
      const req = prevQtyRef.current || {};
      const next: Warning[] = [];
      for (const { node } of cart.lines.edges) {
        const requested = req[node.id];
        if (requested && node.quantity < requested) {
          const title =
            node.merchandise?.product?.title ||
            node.merchandise?.title ||
            "This item";
          next.push({
            lineId: node.id,
            title,
            requested,
            available: node.quantity,
          });
        }
      }
      return next;
    });

    // update baseline
    const now: Record<string, number> = {};
    for (const { node } of cart.lines.edges) now[node.id] = node.quantity;
    prevQtyRef.current = now;
  }, [cart]);

  const warningByLineId = useMemo(() => {
    const m: Record<string, Warning> = {};
    for (const w of warnings) m[w.lineId] = w;
    return m;
  }, [warnings]);

  // === Checkout redirect ===
  const goCheckout = async () => {
    if (!cart?.checkoutUrl) return alert("Missing checkout URL");
    window.location.href = cart.checkoutUrl;
  };

  const hasAnyWarnings = warnings.length > 0;

  // Keeps overlay visible while drawer open
  useEffect(() => {
    const overlay = document.getElementById("cart-overlay");
    if (!overlay) return;
    if (open) overlay.classList.add("open");
    else overlay.classList.remove("open");
  }, [open]);

  // Optional: click outside drawer closes it
  useEffect(() => {
    const overlay = document.getElementById("cart-overlay");
    if (!overlay) return;

    const closeOnClick = (e: MouseEvent) => {
      // Only close if the click was directly on the overlay (not inside the drawer)
      if ((e.target as HTMLElement)?.id === "cart-overlay") setOpen(false);
    };

    overlay.addEventListener("click", closeOnClick);
    return () => overlay.removeEventListener("click", closeOnClick);
  }, []);

  // === Render ===
  return (
    <aside
      data-cartdrawer="astro-react"
      className={`cart-drawer ${open ? "is-open" : ""}`}
    >
      <header className="cd-head">
        <h3>Cart ({cart?.totalQuantity ?? 0})</h3>
        <button onClick={() => setOpen(false)}>Close</button>
      </header>

      {hasAnyWarnings && (
        <div
          className="mx-4 mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
          aria-live="polite"
        >
          Some items were updated due to limited stock.
        </div>
      )}

      <div className="cd-body">
        {!cart || cart.totalQuantity === 0 ? (
          <p className="p-4">Your cart is empty.</p>
        ) : (
          <ul className="cd-lines">
            {cart.lines.edges.map(({ node }) => {
              const img =
                node.merchandise?.product?.featuredImage?.url ||
                // optional extra images field if present
                // @ts-ignore
                node.merchandise?.product?.images?.nodes?.[0]?.url ||
                "/images/products/flaxsinglefield.jpg"; // fallback

              const title =
                node.merchandise?.product?.title ||
                node.merchandise?.title ||
                "Item";

                            const price = node.merchandise?.price;
              const w = warningByLineId[node.id];
              const lineId = node.id; // capture for optimistic update
              const variantId = node.merchandise?.id; // Shopify variant GID
              const maxAvailable = (node.merchandise as any)?.quantityAvailable;

              const handleQtyChange = async (requestedQty: number) => {
                if (requestedQty < 1) return;

                // 🔹 Clamp against maxAvailable if we have it
                let newQty = requestedQty;
                if (typeof maxAvailable === "number" && newQty > maxAvailable) {
                  newQty = maxAvailable;

                  // Fire the yellow "almost out of stock" message
                  window.dispatchEvent(
                    new CustomEvent("cart:stockalert", {
                      detail: {
                        message:
                          "This product is almost out of stock. You can’t add more than we currently have, but more is on the way!",
                      },
                    }),
                  );
                }

                // If clamping means "no change", bail early
                if (newQty === node.quantity) return;

                // 🔹 Optimistic UI: update quantity immediately in local state
                setCart((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    lines: {
                      edges: prev.lines.edges.map((edge) =>
                        edge.node.id === lineId
                          ? {
                              ...edge,
                              node: {
                                ...edge.node,
                                quantity: newQty,
                              },
                            }
                          : edge
                      ),
                    },
                  };
                });

                try {
                  const r = await fetch("/api/cart-set-qty", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      lineId,
                      quantity: newQty,
                      handle: node.merchandise?.product?.handle,
                      variantId,
                    }),
                  });

                  const j = await r.json();

                  // If server says it failed, resync and bail
                  if (!r.ok || j.ok === false) {
                    console.error("[cart-set-qty] failed", j);
                    alert(j.error || "Could not update quantity");

                    // Hard resync cart from server
                    try {
                      const resync = await fetch("/api/cart-get");
                      const g = await resync.json();
                      if (g?.cart) {
                        window.dispatchEvent(
                          new CustomEvent("cart:update", {
                            detail: { cart: g.cart },
                          }),
                        );
                      }
                    } catch (err2) {
                      console.error("Resync after failure failed", err2);
                    }

                    return;
                  }

                  // Let the bridge normalize & reopen the drawer with the new cart
                  if (j?.cart) {
                    window.dispatchEvent(
                      new CustomEvent("cart:update", {
                        detail: { cart: j.cart },
                      }),
                    );
                  }

                  // If server also sent a message, show it
                  if (j?.message) {
                    window.dispatchEvent(
                      new CustomEvent("cart:stockalert", {
                        detail: { message: j.message },
                      }),
                    );
                  }
                } catch (err) {
                  console.error("Qty update failed", err);
                  alert("Could not update quantity");
                }
              };

              const handleRemoveLine = async () => {
  // Optimistic remove
  setCart((prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      lines: {
        edges: prev.lines.edges.filter((edge) => edge.node.id !== lineId),
      },
      totalQuantity: Math.max(0, prev.totalQuantity - node.quantity),
    };
  });

  try {
    const r = await fetch("/api/cart-set-qty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineId,
        quantity: 0,
        handle: node.merchandise?.product?.handle,
        variantId, // 👈 send this too (doesn't hurt)
      }),
    });

    const j = await r.json();

    if (!r.ok || j.ok === false) {
      console.error("[cart-set-qty remove] failed", j);
      alert(j.error || "Could not remove item");

      // resync cart
      try {
        const resync = await fetch("/api/cart-get");
        const g = await resync.json();
        if (g?.cart) {
          window.dispatchEvent(
            new CustomEvent("cart:update", {
              detail: { cart: g.cart },
            }),
          );
        }
      } catch (err2) {
        console.error("Resync after remove failed", err2);
      }

      return;
    }

    if (j?.cart) {
      window.dispatchEvent(
        new CustomEvent("cart:update", {
          detail: { cart: j.cart },
        }),
      );
    }
  } catch (err) {
    console.error("Remove line failed", err);
    alert("Could not remove item");
  }
};


              return (
                <li
                  key={node.id}
                  className="cd-line rounded-xl border p-3"
                  data-lineid={node.id}
                >
                  <img src={img} alt={title} className="cd-thumb" />
                  <div className="cd-info">
                    <div className="cd-title-row">
                      <div className="cd-title">{title}</div>
                      <button
                        type="button"
                        className="cd-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleRemoveLine();
                        }}
                        aria-label={`Remove ${title} from cart`}
                      >
                        ×
                      </button>
                    </div>

                    {price && (
                      <div className="cd-price">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: price.currencyCode,
                        }).format(Number(price.amount))}
                      </div>
                    )}

                    <div className="cd-qty">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleQtyChange(node.quantity - 1);
                        }}
                      >
                        −
                      </button>
                      <span className="qty-val">{node.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleQtyChange(node.quantity + 1);
                        }}
                      >
                        +
                      </button>
                    </div>

                    {w && (
                      <p className="cd-warning">
                        Only {w.available} left for <strong>{w.title}</strong>.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <footer className="cd-foot">
        {stockAlert && <p className="stock-warning flash">{stockAlert}</p>}
        <button
          className="btn-cta"
          disabled={!cart || cart.totalQuantity === 0}
          onClick={goCheckout}
        >
          Checkout
        </button>
      </footer>
    </aside>
  );
}
