// src/pages/api/create-checkout-session.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

export const POST: APIRoute = async ({ request }) => {
  // --- Required secret ---
  const key = (import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // --- Decide env: Production (LIVE) vs Preview/Dev (TEST) ---
  const IS_PROD = (import.meta.env.VERCEL_ENV ?? import.meta.env.MODE) === "production";

  // --- Map cart ids -> Stripe Price IDs ---
  // LIVE env values must be set in Vercel (Production scope).
  const PRICE_MAP: Record<string, string | undefined> = IS_PROD
    ? {
        // LIVE (Production)
        "fhl-single": import.meta.env.STRIPE_PRICE_ID_FLAXSINGLELIVE,
        "ancient-single": import.meta.env.STRIPE_PRICE_ID_ANCIENTSINGLELIVE,
        "ocean-cleanse-single": import.meta.env.STRIPE_PRICE_ID_OCEANCLEANSELIVE,
        "essiac-tea-single": import.meta.env.STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_LIVE,
      }
    : {
        // TEST (Preview/Dev)
        "fhl-single": import.meta.env.STRIPE_PRICE_ID_FLAXSINGLETEST,
        "ancient-single": import.meta.env.STRIPE_PRICE_ID_ANCIENTSINGLETEST,
        // Intentionally skipping test price for ocean-cleanse/essiac unless you add them later.
        // "ocean-cleanse-single": import.meta.env.STRIPE_PRICE_ID_OCEAN_CLEANSE_TEST,
        // "essiac-tea-single": import.meta.env.STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_TEST,
      };

  // --- Read request body ---
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    return new Response(JSON.stringify({ error: "No items provided" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // --- Normalize to Stripe line_items ---
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    // Allow quantity as quantity/qty/data-qty
    const quantity = Number(it.quantity ?? it.qty ?? it["data-qty"] ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return new Response(JSON.stringify({ error: `items[${i}].quantity must be > 0` }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // 1) Direct Stripe price id: { price: "price_..." }
    if (it.price && String(it.price).startsWith("price_")) {
      line_items.push({ price: String(it.price), quantity });
      continue;
    }

    // 2) Your cart’s shape: { id: "sku" } OR { sku: "sku" } OR other common aliases
    const rawId =
      it.id ?? it.sku ?? it.handle ?? it.productId ?? it.slug ?? it.code ?? null;
    const cartId = rawId ? String(rawId).toLowerCase().trim() : "";

    if (cartId && PRICE_MAP[cartId]) {
      line_items.push({ price: PRICE_MAP[cartId] as string, quantity });
      continue;
    }

    // 3) Raw Stripe price_data (optional support)
    if (it.price_data && typeof it.price_data === "object") {
      line_items.push({ price_data: it.price_data, quantity });
      continue;
    }

    // If we reach here, we couldn't map the item
    return new Response(
      JSON.stringify({
        error:
          `items[${i}] must include price:"price_..." OR id/sku matching PRICE_MAP OR a valid price_data object`,
        receivedKeys: Object.keys(it || {}),
        cartIdTried: cartId || null,
        env: IS_PROD ? "production" : "preview/dev",
      }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  // --- Build success/cancel URLs based on origin ---
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
