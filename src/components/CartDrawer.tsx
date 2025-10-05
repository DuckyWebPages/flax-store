import React from "react";
import { useCart } from "./CartProvider";

export default function CartDrawer() {
  const { items, totalCents, setQty, remove, clear, open, setOpen } = useCart();
  const [loading, setLoading] = React.useState(false);

  const handleCheckout = async () => {
    try {
      console.log("[checkout] click; items=", items);

      // Guard: empty cart
      if (!items.length) {
        alert("Your cart is empty.");
        return;
      }

      // Read promo from the single field (optional)
      const couponEl = document.querySelector<HTMLInputElement>('[data-coupon]');
      const promoCode = couponEl ? couponEl.value.trim() : "";

      setLoading(true);

      // Build payload for /api/create-checkout-session (SKU + qty)
      const payload = {
        items: items.map((i) => ({
          id: i.id,   // e.g. "fhl-single"
          qty: i.qty, // quantity
        })),
        promoCode,
      };

      console.log("[checkout] posting payload=", payload);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Read raw first to avoid JSON.parse crash if server returns HTML (e.g., 404)
      const raw = await res.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { /* ignore */ }

      console.log("[checkout] status:", res.status, "data:", data);

      if (!res.ok || !data?.url) {
        const msg = (data && data.error) ? data.error : `Checkout failed (HTTP ${res.status}).`;
        alert(msg);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("[checkout] error:", err);
      alert("Sorry—checkout could not start: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "320px",
        height: "100%",
        background: "#fff",
        boxShadow: "-2px 0 8px rgba(0,0,0,.2)",
        padding: 16,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform .3s",
        zIndex: 9999,
      }}
      aria-hidden={!open}
      role="complementary"
      aria-label="Shopping cart"
    >
      <button onClick={() => setOpen(false)}>Close</button>
      <h2>Cart</h2>

      {items.length === 0 ? (
        <p>Empty</p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.id} style={{ marginBottom: 8 }}>
              {i.name} x{i.qty} = ${(i.unitCents * i.qty / 100).toFixed(2)}{" "}
              <button onClick={() => setQty(i.id, Math.max(0, i.qty - 1))} disabled={loading}>-</button>
              <button onClick={() => setQty(i.id, i.qty + 1)} disabled={loading}>+</button>
              <button onClick={() => remove(i.id)} disabled={loading}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 12, fontWeight: 700 }}>
        Total: ${(totalCents / 100).toFixed(2)}
      </div>

      <button onClick={clear} style={{ marginTop: 8 }} disabled={loading}>
        Clear
      </button>

      {items.length > 0 && (
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            background: loading ? "#666" : "black",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Starting checkout..." : "Checkout"}
        </button>
      )}
    </div>
  );
}
