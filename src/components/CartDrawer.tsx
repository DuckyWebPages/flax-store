import React from "react";
import { useCart } from "./CartProvider";

export default function CartDrawer() {
  const { items, totalCents, setQty, remove, clear, open, setOpen } = useCart();
  const [loading, setLoading] = React.useState(false);

  async function handleCheckout() {
    try {
      console.log("[checkout] click; items=", items);

      if (!items.length) {
        alert("Your cart is empty.");
        return;
      }

      // Build the payload expected by /api/create-checkout-session
      const lineItems = items.map((i) => ({
        price: i.priceId, // must be "price_..." (Stripe Price ID)
        quantity: i.qty,
      }));

      // Quick validation to catch missing priceIds early
      const bad = lineItems.find((li, idx) => !li.price || !String(li.price).startsWith("price_"));
      if (bad) {
        console.error("[checkout] missing/invalid priceId in lineItems:", lineItems);
        alert(
          "One or more items are missing a Stripe price ID. Please refresh the page or re-add the item. If it keeps happening, tell me."
        );
        return;
      }

      console.log("[checkout] posting lineItems=", lineItems);
      setLoading(true);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lineItems }),
      });

      console.log("[checkout] HTTP status:", res.status);
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // If the server failed before sending JSON
        console.error("[checkout] non-JSON response");
      }
      console.log("[checkout] response JSON:", data);

      if (!res.ok) {
        alert(data?.error || `Checkout failed (HTTP ${res.status}).`);
        return;
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(data?.error || "Checkout failed (no redirect URL).");
      }
    } catch (err: any) {
      console.error("[checkout] error:", err);
      alert("Checkout failed: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

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
