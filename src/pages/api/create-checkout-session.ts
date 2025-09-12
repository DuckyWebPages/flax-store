// src/pages/api/create-checkout-session.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

export const POST: APIRoute = async ({ request }) => {
  const key = (import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const items = Array.isArray((body as any)?.items) ? (body as any).items : [];
  // Expecting: [{ price: "price_XXXX", quantity: 1 }, ...]
  if (!items.length) {
    return new Response(JSON.stringify({ error: "No items provided" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Basic validation of each item
  for (const [idx, it] of items.entries()) {
    if (!it?.price || !String(it.price).startsWith("price_")) {
      return new Response(
        JSON.stringify({ error: `items[${idx}].price must be a Stripe price_ id` }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (!it?.quantity || Number(it.quantity) <= 0) {
      return new Response(
        JSON.stringify({ error: `items[${idx}].quantity must be > 0` }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items, // already in { price, quantity } form
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      success_url: new URL("/thanks?session_id={CHECKOUT_SESSION_ID}", origin).toString(),
      cancel_url: new URL("/cart-cancelled", origin).toString(),
      metadata: { source: "flax-store" },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/create-checkout-session] error:", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Checkout failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
