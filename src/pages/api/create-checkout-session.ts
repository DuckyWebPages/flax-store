// src/pages/api/create-checkout-session.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

export const POST: APIRoute = async ({ request }) => {
  const key = (import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }

  // 🔒 Central place to map your product ids -> Stripe price ids
  // Prefer env vars so you never hardcode secrets in the repo
  const PRICE_MAP: Record<string, string | undefined> = {
  "fhl-single": import.meta.env.STRIPE_PRICE_ID_FLAXSINGLETEST,     // Flax Hull Lignan (Single Jar)
  "asg-single": import.meta.env.STRIPE_PRICE_ID_ANCIENTSINGLETEST,  // Ancient Seeds & Grains (Single Jar)
};

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    return new Response(JSON.stringify({ error: "No items provided" }), {
      status: 400, headers: { "content-type": "application/json" },
    });
  }

  // ✅ Normalize whatever the cart sends into Stripe line_items
  const line_items = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const quantity = Number(it.quantity ?? it.qty ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return new Response(JSON.stringify({ error: `items[${i}].quantity must be > 0` }), {
        status: 400, headers: { "content-type": "application/json" },
      });
    }

    // 1) Direct price id
    if (it.price && String(it.price).startsWith("price_")) {
      line_items.push({ price: String(it.price), quantity });
      continue;
    }

    // 2) Your cart's shape: { id: "fhl-single", qty: N }
    if (it.id && PRICE_MAP[it.id]) {
      line_items.push({ price: PRICE_MAP[it.id] as string, quantity });
      continue;
    }

    // 3) Raw Stripe price_data (optional support)
    if (it.price_data && typeof it.price_data === "object") {
      line_items.push({ price_data: it.price_data, quantity });
      continue;
    }

    return new Response(
      JSON.stringify({
        error:
          `items[${i}] must include price:"price_..." OR id matching PRICE_MAP OR a valid price_data object`,
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  // Prefer Origin header; fallback to request URL origin
  const originHeader = request.headers.get("origin");
  const origin = originHeader || new URL(request.url).origin;

  try {
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      success_url: new URL("/thank-you?session_id={CHECKOUT_SESSION_ID}", origin).toString(),
      cancel_url: new URL("/cart?canceled=1", origin).toString(),
      metadata: { source: "flax-store" },
    });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/create-checkout-session] error:", err?.message || err);
    return new Response(JSON.stringify({ error: err?.message || "Checkout failed" }), {
      status: 500, headers: { "content-type": "application/json" },
    });
  }
};
