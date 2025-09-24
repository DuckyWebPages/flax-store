// src/pages/api/create-checkout-session.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

export const POST: APIRoute = async ({ request }) => {
  const key = (import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return jsonErr(500, "STRIPE_SECRET_KEY missing");

  // prod when deploying to Vercel Production; otherwise test
  const IS_PROD = (import.meta.env.VERCEL_ENV ?? import.meta.env.MODE) === "production";

  // helper to read env safely
  const ENV = import.meta.env as unknown as Record<string, string | undefined>;
  const get = (k: string) => (ENV[k] || "").trim() || undefined;

  // ----- PRICE MAP (fixed SKUs) -----
  // NOTE: we support both styles you already have in Vercel:
  //   - with LIVE suffix:  STRIPE_PRICE_ID_FLAXSINGLELIVE
  //   - without suffix:     STRIPE_PRICE_ID_FLAXSINGLE
  const PRICE_MAP: Record<string, string | undefined> = IS_PROD
    ? {
        // Production
        "fhl-single":            get("STRIPE_PRICE_ID_FLAXSINGLELIVE")        || get("STRIPE_PRICE_ID_FLAXSINGLE"),
        "ancient-single":        get("STRIPE_PRICE_ID_ANCIENTSINGLELIVE")     || get("STRIPE_PRICE_ID_ANCIENTSINGLE"),
        "ocean-cleanse-single":  get("STRIPE_PRICE_ID_OCEANCLEANSELIVE")      || get("STRIPE_PRICE_ID_OCEANCLEANSE"),
        "essiac-tea-single":     get("STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_LIVE")|| get("STRIPE_PRICE_ID_ESSIAC"),
        // Zeolite: you asked for zeolite-single; also allow your AFTERSHOT id
        "zeolite-single":        get("STRIPE_PRICE_ID_ZEOLITE_LIVE")          || get("STRIPE_PRICE_ID_AFTERSHOT"),
      }
    : {
        // Preview/Dev (TEST)
        "fhl-single":            get("STRIPE_PRICE_ID_FLAXSINGLETEST"),
        "ancient-single":        get("STRIPE_PRICE_ID_ANCIENTSINGLETEST"),
        "ocean-cleanse-single":  get("STRIPE_PRICE_ID_OCEAN_CLEANSE_TEST")    || get("STRIPE_PRICE_ID_OCEANCLEANSETEST"),
        "essiac-tea-single":     get("STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_TEST")|| get("STRIPE_PRICE_ID_ESSIAC_TEST"),
        "zeolite-single":        get("STRIPE_PRICE_ID_ZEOLITE_TEST")          || get("STRIPE_PRICE_ID_AFTERSHOT_TEST"),
      };

  // ----- Read body -----
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonErr(400, "Invalid JSON body");
  }
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return jsonErr(400, "No items provided");

  // ----- Build line_items -----
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const quantity = Number(it.quantity ?? it.qty ?? it["data-qty"] ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return jsonErr(400, `items[${i}].quantity must be > 0`);
    }

    // 1) direct Stripe price
    if (it.price && String(it.price).startsWith("price_")) {
      line_items.push({ price: String(it.price), quantity });
      continue;
    }

    // 2) map cart id -> env price id
    const rawId = it.id ?? it.sku ?? it.handle ?? it.productId ?? it.slug ?? it.code ?? null;
    const cartId = rawId ? String(rawId).toLowerCase().trim() : "";

    // fixed SKUs
    if (cartId && cartId in PRICE_MAP) {
      const priceId = PRICE_MAP[cartId];
      if (!priceId) {
        return jsonErr(500, missingFixedEnvHint(cartId, IS_PROD));
      }
      line_items.push({ price: priceId, quantity });
      continue;
    }

    // 3) Essential oils: eo-<short>-<size>  e.g. eo-pepp-15ml
    if (cartId && cartId.startsWith("eo-")) {
      const parts = cartId.split("-");
      if (parts.length < 3) return jsonErr(400, `Bad EO SKU: ${cartId}`);

      const short = parts[1];                 // pepp
      const size  = parts.slice(2).join("-"); // 15ml
      const eoKey = `STRIPE_PRICE_ID_EO_${short.toUpperCase().replace(/[^A-Z0-9]/g,"_")}_${size.toUpperCase().replace(/[^A-Z0-9]/g,"_")}_${IS_PROD ? "LIVE" : "TEST"}`;
      const priceId = get(eoKey);
      if (!priceId) {
        return jsonErr(500, `Missing Stripe Price ID env for EO SKU "${cartId}". Set ${eoKey}.`);
      }
      line_items.push({ price: priceId, quantity });
      continue;
    }

    // 4) raw price_data support (optional)
    if (it.price_data && typeof it.price_data === "object") {
      line_items.push({ price_data: it.price_data, quantity });
      continue;
    }

    return new Response(JSON.stringify({
      error: `items[${i}] must include price:"price_..." OR id/sku in PRICE_MAP/EO envs OR price_data`,
      receivedKeys: Object.keys(it || {}),
      cartIdTried: cartId || null,
      env: IS_PROD ? "production" : "preview/dev",
    }), { status: 400, headers: { "content-type": "application/json" } });
  }

  // ----- URLs -----
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
    return jsonErr(500, err?.message || "Checkout failed");
  }
};

/* ---------------- helpers ---------------- */
function jsonErr(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { "content-type": "application/json" },
  });
}

function missingFixedEnvHint(id: string, isProd: boolean): string {
  const FINAL = isProd ? "LIVE" : "TEST";
  switch (id) {
    case "fhl-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_FLAXSINGLE${FINAL} or STRIPE_PRICE_ID_FLAXSINGLE.`;
    case "ancient-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_ANCIENTSINGLE${FINAL} or STRIPE_PRICE_ID_ANCIENTSINGLE.`;
    case "ocean-cleanse-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_OCEANCLEANSE${FINAL} or STRIPE_PRICE_ID_OCEANCLEANSE.`;
    case "essiac-tea-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_${FINAL} or STRIPE_PRICE_ID_ESSIAC${isProd ? "" : "_TEST"}.`;
    case "zeolite-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_ZEOLITE_${FINAL} or STRIPE_PRICE_ID_AFTERSHOT${isProd ? "" : "_TEST"}.`;
    default:
      return `Missing env for ${id}.`;
  }
}
