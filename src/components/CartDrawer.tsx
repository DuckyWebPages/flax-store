import React from "react";
import { useCart } from "./CartProvider";

export default function CartDrawer() {
  const { items, totalCents, setQty, remove, clear, open, setOpen } = useCart();

  async function handleCheckout() {
    try {
      const lineItems = items.map(i => ({
        price: i.priceId,   // must be a valid Stripe price_...
        quantity: i.qty,
      }));

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lineItems }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Checkout failed.");
      }
    } catch (err) {
      console.error("Checkout error", err);
      alert("An error occurred while starting checkout.");
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
              <button onClick={() => setQty(i.id, Math.max(0, i.qty - 1))}>-</button>
              <button onClick={() => setQty(i.id, i.qty + 1)}>+</button>
              <button onClick={() => remove(i.id)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 12, fontWeight: 700 }}>
        Total: ${(totalCents / 100).toFixed(2)}
      </div>

      <button onClick={clear} style={{ marginTop: 8 }}>
        Clear
      </button>

      {items.length > 0 && (
        <button
          onClick={handleCheckout}
          style={{
            marginTop: 12,
            padding: "8px 16px",
            background: "black",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Checkout
        </button>
      )}
    </div>
  );
}
