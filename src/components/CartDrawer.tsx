// FILE: src/components/CartDrawer.tsx
import React from "react";
import CartProvider, { useCart } from "./CartProvider.tsx";
import "./cart-drawer.css"; // keep this; inline style below is just a safety net

export default function CartDrawer() {
  const { items, totalCents, setQty, remove, clear, open, setOpen } = useCart();
  const [loading, setLoading] = React.useState(false);

  // Debug: see "open" state flip; add window.cartOpen()/cartClose() helpers
  React.useEffect(() => {
    console.log("[CartDrawer] open =", open);
    (window as any).cartOpen = () => setOpen(true);
    (window as any).cartClose = () => setOpen(false);
  }, [open, setOpen]);

  const updateQty = (id: string, next: number) => {
    const q = Math.max(1, Number.isFinite(next) ? Math.floor(next) : 1);
    setQty(id, q);
  };

  const handleCheckout = async () => {
    try {
      if (!items.length) {
        alert("Your cart is empty.");
        return;
      }
      const couponEl = document.querySelector<HTMLInputElement>("[data-coupon]");
      const promoCode = couponEl ? couponEl.value.trim() : "";
      setLoading(true);

      const payload = {
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        promoCode,
      };

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch {}

      if (!res.ok || !data?.url) {
        const msg = (data && data.error) ? data.error : `Checkout failed (HTTP ${res.status}).`;
        alert(msg);
        return;
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error("[checkout] error:", err);
      alert("Sorry—checkout could not start: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className={`cart-drawer ${open ? "open" : ""}`}
      aria-hidden={!open}
      role="complementary"
      aria-label="Shopping cart"
      // Inline fallback so it works even if CSS didn't load
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "360px",
        maxWidth: "92vw",
        height: "100%",
        background: "#fff",
        boxShadow: "-2px 0 24px rgba(0,0,0,.2)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .28s ease",
        zIndex: 999999
      }}
    >
      <div className="cart-shell">
        <header className="header">
          <h2>Cart</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            title="Close"
          >
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <div className="empty">Your cart is empty.</div>
        ) : (
          <ul className="items" role="list">
            {items.map((i) => (
              <li key={i.id} className="cart-row">
                <div className="thumb">
                  <img
                    src={(i as any).image || "/images/products/placeholder.jpg"}
                    alt={i.name}
                    loading="lazy"
                  />
                </div>

                <div className="meta">
                  <div className="title">{i.name}</div>
                  <div className="price">${(i.unitCents / 100).toFixed(2)}</div>
                </div>

                <div className="controls">
                  <div className="stepper" role="group" aria-label={`Quantity for ${i.name}`}>
                    <button
                      type="button"
                      className="step"
                      onClick={() => updateQty(i.id, i.qty - 1)}
                      aria-label="Decrease quantity"
                      disabled={loading}
                    >
                      –
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="\d*"
                      min={1}
                      value={i.qty}
                      onChange={(e) => updateQty(i.id, Number(e.currentTarget.value || 1))}
                      aria-label={`Quantity for ${i.name}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="step"
                      onClick={() => updateQty(i.id, i.qty + 1)}
                      aria-label="Increase quantity"
                      disabled={loading}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="remove"
                    onClick={() => remove(i.id)}
                    title="Remove"
                    aria-label={`Remove ${i.name}`}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer className="footer">
          <div className="totals">
            <span>Total</span>
            <strong>${(totalCents / 100).toFixed(2)}</strong>
          </div>

          <div className="actions">
            <button
              type="button"
              className="btn btn-clear"
              onClick={clear}
              disabled={loading || !items.length}
              title="Clear cart"
            >
              Clear
            </button>

            <button
              type="button"
              className="btn btn-checkout"
              onClick={handleCheckout}
              disabled={loading || !items.length}
              title="Proceed to checkout"
            >
              {loading ? "Starting…" : "Checkout"}
            </button>
          </div>
        </footer>
      </div>
    </aside>
  );
}
