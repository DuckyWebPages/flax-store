// src/pages/api/checkout.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

export const GET: APIRoute = async ({ request }) => {
  const key = (import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), { status: 500 });
  }

  const url = new URL(request.url);
  const session_id = (url.searchParams.get("session_id") || "").trim();
  if (!session_id || !session_id.startsWith("cs_")) {
    return new Response(JSON.stringify({ error: "Invalid or missing session_id" }), { status: 400 });
  }

  try {
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items.data.price.product", "payment_intent"],
    });

// after `const session = await stripe.checkout.sessions.retrieve(... expand ...)`

const pi = typeof session.payment_intent === "string" ? null : session.payment_intent;
const charge = pi && Array.isArray((pi as any).charges?.data) ? (pi as any).charges.data[0] : null;

return new Response(JSON.stringify({
  id: session.id,
  status: session.status,
  payment_status: session.payment_status,
  amount_total: session.amount_total,
  currency: session.currency,
  customer_details: session.customer_details,
  shipping_details: session.shipping_details,
  created: session.created,                // unix timestamp (optional)
  receipt_url: charge?.receipt_url || null, // handy for support
  line_items: (session.line_items?.data || []).map((li) => ({
    quantity: li.quantity,
    amount_total: li.amount_total,
    price: typeof li.price === "string" ? li.price : {
      id: li.price?.id,
      unit_amount: li.price?.unit_amount,
      currency: li.price?.currency,
      product: typeof li.price?.product === "string"
        ? li.price?.product
        : { id: (li.price?.product as any)?.id, name: (li.price?.product as any)?.name },
    },
  })),
}), { status: 200, headers: { "content-type": "application/json" }});

  } catch (e: any) {
    console.error("[api/checkout-session] error", e?.message || e);
    return new Response(JSON.stringify({ error: e?.message || "Failed to load session" }), { status: 500 });
  }
};
