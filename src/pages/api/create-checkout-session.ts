// FILE: src/pages/api/create-checkout-session.ts
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

  // Decide env: Production (LIVE) vs Preview/Dev (TEST)
  const IS_PROD = (import.meta.env.VERCEL_ENV ?? import.meta.env.MODE) === "production";

  // Map cart ids -> Stripe Price IDs (LIVE for prod, TEST for preview/dev)
  const PRICE_MAP: Record<string, string | undefined> = IS_PROD
    ? {
        // LIVE
        "fhl-single": import.meta.env.STRIPE_PRICE_ID_FLAXSINGLELIVE,
        "ancient-single": import.meta.env.STRIPE_PRICE_ID_ANCIENTSINGLELIVE,
        "ocean-cleanse-single": import.meta.env.STRIPE_PRICE_ID_OCEANCLEANSELIVE,
      }
    : {
        // TEST (only items you actually test locally/preview)
        "fhl-single": import.meta.env.STRIPE_PRICE_ID_FLAXSINGLETEST,
        "ancient-single": import.meta.env.STRIPE_PRICE_ID_ANCIENTSINGLETEST,
        // intentionally no test price for Ocean Cleanse
        // "ocean-cleanse-single": import.meta.env.STRIPE_PRICE_ID_OCEANCLEANSETEST,
      };

  // OPTIONAL: fail only for missing ids that are actually referenced
  // (We don't hard-fail just because some products aren't configured in this env.)
  const referencedKeys: string[] = [];

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

  // Normalize whatever the cart sends into Stripe line_items
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const quantity = Number(it.quantity ?? it.qty ?? it["data-qty"] ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return new Response(JSON.stringify({ error: `items[${i}].quantity must be > 0` }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // 1) Accept direct Stripe price id
    if (it.price && String(it.price).startsWith("price_")) {
      line_items.push({ price: String(it.price), quantity });
      continue;
    }

    // 2) Map your cart id/sku/etc -> Price ID
    const rawId =
      it.id ?? it.sku ?? it.handle ?? it.productId ?? it.slug ?? it.code ?? null;
    const cartId = rawId ? String(rawId).toLowerCase().trim() : null;
    const mappedPrice = cartId ? PRICE_MAP[cartId] : undefined;
    if (cartId) referencedKeys.push(cartId);

    if (mappedPrice) {
      line_items.push({ price: mappedPrice as string, quantity });
      continue;
    }

    // 3) Allow raw price_data (optional)
    if (it.price_data && typeof it.price_data === "object") {
      line_items.push({ price_data: it.price_data, quantity });
      continue;
    }

    return new Response(
      JSON.stringify({
        error:
          `items[${i}] must include price:"price_..." OR id/sku matching PRICE_MAP OR a valid price_data object`,
        receivedKeys: Object.keys(it || {}),
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
