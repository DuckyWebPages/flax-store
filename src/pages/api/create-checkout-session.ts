// src/pages/api/create-checkout-session.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

export const POST: APIRoute = async ({ request }) => {
  // Read from BOTH import.meta.env and process.env, then trim
  const rawKey =
    (import.meta.env?.STRIPE_SECRET_KEY as string | undefined) ??
    (process.env?.STRIPE_SECRET_KEY as string | undefined) ??
    "";
  const key = rawKey.trim();

  if (!key) {
    // Extra diagnostics so we know which env this is running in
    const envName =
      (import.meta.env?.VERCEL_ENV as string | undefined) ??
      (process.env?.VERCEL_ENV as string | undefined) ??
      (import.meta.env?.MODE as string | undefined) ??
      "unknown";
    return new Response(
      JSON.stringify({ error: `STRIPE_SECRET_KEY missing (env=${envName})` }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // Production when Vercel Production; otherwise Test/Preview/Dev
  const IS_PROD =
    ((import.meta.env?.VERCEL_ENV as string | undefined) ??
      (process.env?.VERCEL_ENV as string | undefined) ??
      (import.meta.env?.MODE as string | undefined)) === "production";

  if (IS_PROD && !key.startsWith("sk_live_")) {
    return new Response(
      JSON.stringify({ error: "Stripe key is not LIVE (sk_live_…). Check Vercel Production env." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  // (leave the rest of your file unchanged below this line)


  // Helper to read env safely
  const ENV = import.meta.env as unknown as Record<string, string | undefined>;
  const get = (k: string) => (ENV[k] || "").trim() || undefined;

  // -------- PRICE MAPS (fixed SKUs) ----------
  // Support both naming styles you’ve used for env vars.
  // Also support BOTH SKUs for AfterShot (aftershot-8oz and zeolite-single) in BOTH envs.
  const PRICE_MAP: Record<string, string | undefined> = IS_PROD
    ? {
        // LIVE
        "zeolite-8oz": get("STRIPE_PRICE_ID_ZEOLITE_LIVE") || get("STRIPE_PRICE_ID_AFTERSHOT"),

        "fhl-single":           get("STRIPE_PRICE_ID_FLAXSINGLELIVE")          || get("STRIPE_PRICE_ID_FLAXSINGLE"),

        "ancient-single":       get("STRIPE_PRICE_ID_ANCIENTSINGLELIVE")       || get("STRIPE_PRICE_ID_ANCIENTSINGLE"),

        "ocean-cleanse-single": get("STRIPE_PRICE_ID_OCEANCLEANSELIVE")        || get("STRIPE_PRICE_ID_OCEANCLEANSE"),

        "essiac-tea-single":    get("STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_LIVE")  || get("STRIPE_PRICE_ID_ESSIAC"),

        // AfterShot / Zeolite — support both SKUs
        "aftershot-8oz":        get("STRIPE_PRICE_ID_AFTERSHOT")               || get("STRIPE_PRICE_ID_ZEOLITE_LIVE"),
        "zeolite-single":       get("STRIPE_PRICE_ID_ZEOLITE_LIVE")            || get("STRIPE_PRICE_ID_AFTERSHOT"),
      }
    : {
        // TEST
        "zeolite-8oz": get("STRIPE_PRICE_ID_ZEOLITE_TEST") || get("STRIPE_PRICE_ID_AFTERSHOT_TEST"),

        "fhl-single":           get("STRIPE_PRICE_ID_FLAXSINGLETEST"),

        "ancient-single":       get("STRIPE_PRICE_ID_ANCIENTSINGLETEST"),

        // Support both possible test env var names you’ve used
        "ocean-cleanse-single": get("STRIPE_PRICE_ID_OCEAN_CLEANSE_TEST")      || get("STRIPE_PRICE_ID_OCEANCLEANSETEST"),

        // Essiac test naming variants
        "essiac-tea-single":    get("STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_TEST")  || get("STRIPE_PRICE_ID_ESSIAC_TEST"),

        // AfterShot / Zeolite — support both SKUs
        "aftershot-8oz":        get("STRIPE_PRICE_ID_AFTERSHOT_TEST")          || get("STRIPE_PRICE_ID_ZEOLITE_TEST"),
        "zeolite-single":       get("STRIPE_PRICE_ID_ZEOLITE_TEST")            || get("STRIPE_PRICE_ID_AFTERSHOT_TEST"),
      };

  // -------- Read body ----------
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonErr(400, "Invalid JSON body");
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  const promoCode = String(body?.promoCode || "").trim();
  if (!items.length) return jsonErr(400, "No items provided");

  // -------- Build line_items ----------
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    const quantity = Number(it.quantity ?? it.qty ?? it["data-qty"] ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return jsonErr(400, `items[${i}].quantity must be > 0`);
    }

    // 1) Direct Stripe price usage
    if (it.price && String(it.price).startsWith("price_")) {
      line_items.push({ price: String(it.price), quantity });
      continue;
    }

    // 2) Map cart id/sku -> env price id
    const rawId = it.id ?? it.sku ?? it.handle ?? it.productId ?? it.slug ?? it.code ?? null;
    const cartId = rawId ? String(rawId).toLowerCase().trim() : "";

    if (cartId && cartId in PRICE_MAP) {
      const priceId = PRICE_MAP[cartId];
      if (!priceId) return jsonErr(500, missingFixedEnvHint(cartId, IS_PROD));
      line_items.push({ price: priceId, quantity });
      continue;
    }

    // 3) Essential oils: eo-<short>-<size> (e.g., eo-pepp-15ml)
    if (cartId && cartId.startsWith("eo-")) {
      const parts = cartId.split("-");
      if (parts.length < 3) return jsonErr(400, `Bad EO SKU: ${cartId}`);
      const short = parts[1];
      const size  = parts.slice(2).join("-");
      const eoKey = `STRIPE_PRICE_ID_EO_${short.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${size.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${IS_PROD ? "LIVE" : "TEST"}`;
      const priceId = get(eoKey);
      if (!priceId) return jsonErr(500, `Missing Stripe Price ID env for EO SKU "${cartId}". Set ${eoKey}.`);
      line_items.push({ price: priceId, quantity });
      continue;
    }

    // 4) raw price_data support (fallback)
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

  // -------- Build URLs ----------
  const originHeader = request.headers.get("origin");
  const origin = originHeader || new URL(request.url).origin;

  try {
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

    // Discounts:
    // - STRIPE_COUPON_99: force-apply a coupon ID (good for 99% test)
    // - promoCode from client: attach an active Promotion Code by code
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

    const forcedCoupon = (get("STRIPE_COUPON_99") || "").trim();
    if (forcedCoupon) discounts.push({ coupon: forcedCoupon });

    if (promoCode) {
      const list = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (list.data[0]?.id) discounts.push({ promotion_code: list.data[0].id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true, // Users can still type codes on Stripe
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      discounts: discounts.length ? discounts : undefined,
      success_url: new URL("/thank-you?session_id={CHECKOUT_SESSION_ID}", origin).toString(),
      cancel_url: new URL("/cart?canceled=1", origin).toString(),
      metadata: { source: "flax-store", promo_entered: promoCode },
    });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/create-checkout-session] error:", err?.message || err);
    return jsonErr(500, err?.message || "Checkout failed");
  }
};

/* ---------------- helpers ---------------- */
function jsonErr(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function missingFixedEnvHint(id: string, isProd: boolean): string {
  // Shared helper: tells you exactly which env to set, based on prod vs test
  const FINAL = isProd ? "LIVE" : "TEST";
  switch (id) {
    case "fhl-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_FLAXSINGLE${FINAL} or STRIPE_PRICE_ID_FLAXSINGLE.`;
    case "ancient-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_ANCIENTSINGLE${FINAL} or STRIPE_PRICE_ID_ANCIENTSINGLE.`;
    case "ocean-cleanse-single":
      return `Missing env for ${id}. Set STRIPE_PRICE_ID_OCEANCLEANSE${FINAL} or STRIPE_PRICE_ID_OCEANCLEANSE.`;
    case "essiac-tea-single":
      return isProd
        ? `Missing env for ${id}. Set STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_LIVE or STRIPE_PRICE_ID_ESSIAC.`
        : `Missing env for ${id}. Set STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_TEST or STRIPE_PRICE_ID_ESSIAC_TEST.`;
    case "aftershot-8oz":
    case "zeolite-single":
      return isProd
        ? `Missing env for ${id}. Set STRIPE_PRICE_ID_AFTERSHOT or STRIPE_PRICE_ID_ZEOLITE_LIVE.`
        : `Missing env for ${id}. Set STRIPE_PRICE_ID_AFTERSHOT_TEST or STRIPE_PRICE_ID_ZEOLITE_TEST.`;
    default:
      return `Missing env for ${id}.`;
  }
}
