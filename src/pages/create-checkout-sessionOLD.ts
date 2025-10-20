// FILE: src/pages/api/create-checkout-session.ts
// PURPOSE: Create a Stripe Checkout session. Robust env detection + helpful diagnostics.
export const prerender = false;
export const runtime = 'node'; // ensure Node runtime so process.env works on Vercel

import type { APIRoute } from "astro";
import Stripe from "stripe";

/** Helper: quick JSON error */
function jsonErr(status: number, message: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Helper: env hint for missing fixed SKU mappings */
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
      return isProd
        ? `Missing env for ${id}. Set STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_LIVE or STRIPE_PRICE_ID_ESSIAC.`
        : `Missing env for ${id}. Set STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_TEST or STRIPE_PRICE_ID_ESSIAC_TEST.`;
    case "aftershot-8oz":
    case "zeolite-single":
    case "zeolite-8oz":
      return isProd
        ? `Missing env for ${id}. Set STRIPE_PRICE_ID_ZEOLITE_LIVE or STRIPE_PRICE_ID_AFTERSHOT.`
        : `Missing env for ${id}. Set STRIPE_PRICE_ID_ZEOLITE_TEST or STRIPE_PRICE_ID_AFTERSHOT_TEST.`;
    default:
      return `Missing env for ${id}.`;
  }
}

export const POST: APIRoute = async ({ request }) => {
  // --- Read Stripe key from BOTH env sources ---
  const rawKey =
    (import.meta.env?.STRIPE_SECRET_KEY as string | undefined) ??
    (process.env?.STRIPE_SECRET_KEY as string | undefined) ??
    "";
  const key = rawKey.trim();

  // Which environment is this deployment?
  const envName =
    (import.meta.env?.VERCEL_ENV as string | undefined) ??
    (process.env?.VERCEL_ENV as string | undefined) ??
    (import.meta.env?.MODE as string | undefined) ??
    "unknown";

  // If key is missing, return a diagnostic (no secrets leaked)
  if (!key) {
    const hadImport = Boolean((import.meta.env as any)?.STRIPE_SECRET_KEY);
    const hadProcess = Boolean(process.env?.STRIPE_SECRET_KEY);
    return jsonErr(500, `STRIPE_SECRET_KEY missing (env=${envName})`, {
      importMetaSeen: hadImport,
      processEnvSeen: hadProcess,
      hint: "Set STRIPE_SECRET_KEY in Vercel > Settings > Environment Variables for the Production environment, then redeploy.",
    });
  }

  const IS_PROD = envName === "production";
  if (IS_PROD && !key.startsWith("sk_live_")) {
    return jsonErr(500, "Stripe key is not LIVE (sk_live_…). Check Vercel Production env.");
  }

  // Safe env getter (supports both import.meta.env and process.env)
  const ENV = {
    get(k: string) {
      const val =
        ((import.meta.env as any)?.[k] as string | undefined) ??
        (process.env as any)?.[k];
      return (val || "").trim() || undefined;
    },
  };

  // --- FIXED PRICE MAPS ---
  const PRICE_MAP: Record<string, string | undefined> = IS_PROD
    ? {
        // LIVE
        "fhl-single":           ENV.get("STRIPE_PRICE_ID_FLAXSINGLELIVE")          || ENV.get("STRIPE_PRICE_ID_FLAXSINGLE"),
        "ancient-single":       ENV.get("STRIPE_PRICE_ID_ANCIENTSINGLELIVE")       || ENV.get("STRIPE_PRICE_ID_ANCIENTSINGLE"),
        "ocean-cleanse-single": ENV.get("STRIPE_PRICE_ID_OCEANCLEANSELIVE")        || ENV.get("STRIPE_PRICE_ID_OCEANCLEANSE"),
        "essiac-tea-single":    ENV.get("STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_LIVE")  || ENV.get("STRIPE_PRICE_ID_ESSIAC"),
        // AfterShot / Zeolite
        "aftershot-8oz":        ENV.get("STRIPE_PRICE_ID_AFTERSHOT")               || ENV.get("STRIPE_PRICE_ID_ZEOLITE_LIVE"),
        "zeolite-single":       ENV.get("STRIPE_PRICE_ID_ZEOLITE_LIVE")            || ENV.get("STRIPE_PRICE_ID_AFTERSHOT"),
        "zeolite-8oz":          ENV.get("STRIPE_PRICE_ID_ZEOLITE_LIVE")            || ENV.get("STRIPE_PRICE_ID_AFTERSHOT"),
        "zeolite-3pack": ENV.get("STRIPE_PRICE_ID_ZEOLITE_3PACK_LIVE") || ENV.get("STRIPE_PRICE_ID_AFTERSHOT3PACK"),
 "methylene-blue": {
    name: "Methylene Blue",
    priceId: process.env.STRIPE_PRICE_ID_MBLUELIVE!,   // uses your LIVE Price ID
    // optional: lookupKey: process.env.STRIPE_LOOKUP_KEY_MBLUE, // if your code supports lookupKey
    image: "/images/products/MethBluefront.jpg",
  },

    : {
        // TEST
        "fhl-single":           ENV.get("STRIPE_PRICE_ID_FLAXSINGLETEST"),
        "ancient-single":       ENV.get("STRIPE_PRICE_ID_ANCIENTSINGLETEST"),
        "ocean-cleanse-single": ENV.get("STRIPE_PRICE_ID_OCEAN_CLEANSE_TEST")      || ENV.get("STRIPE_PRICE_ID_OCEANCLEANSETEST"),
        "essiac-tea-single":    ENV.get("STRIPE_PRICE_ID_ESSIAC_TEA_SINGLE_TEST")  || ENV.get("STRIPE_PRICE_ID_ESSIAC_TEST"),
        "aftershot-8oz":        ENV.get("STRIPE_PRICE_ID_AFTERSHOT_TEST")          || ENV.get("STRIPE_PRICE_ID_ZEOLITE_TEST"),
        "zeolite-single":       ENV.get("STRIPE_PRICE_ID_ZEOLITE_TEST")            || ENV.get("STRIPE_PRICE_ID_AFTERSHOT_TEST"),
        "zeolite-8oz":          ENV.get("STRIPE_PRICE_ID_ZEOLITE_TEST")            || ENV.get("STRIPE_PRICE_ID_AFTERSHOT_TEST"),
    "zeolite-3pack": ENV.get("STRIPE_PRICE_ID_ZEOLITE_3PACK_TEST") || ENV.get("STRIPE_PRICE_ID_AFTERSHOT3PACK_TEST"),


      };

  // --- Read request body (expects { items: [...], promoCode?: string }) ---
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonErr(400, "Invalid JSON body");
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  const promoCode = String(body?.promoCode || "").trim();

  if (!items.length) return jsonErr(400, "No items provided");

  // --- Build Stripe line_items ---
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    const quantity = Number(it.quantity ?? it.qty ?? it["data-qty"] ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return jsonErr(400, `items[${i}].quantity must be > 0`);
    }

    // 1) Direct Stripe price (price_...)
    if (it.price && String(it.price).startsWith("price_")) {
      line_items.push({ price: String(it.price), quantity });
      continue;
    }

    // 2) SKU mapping
    const rawId = it.id ?? it.sku ?? it.handle ?? it.productId ?? it.slug ?? it.code ?? null;
    const cartId = rawId ? String(rawId).toLowerCase().trim() : "";

    if (cartId && PRICE_MAP[cartId]) {
      const priceId = PRICE_MAP[cartId];
      if (!priceId) return jsonErr(500, missingFixedEnvHint(cartId, IS_PROD));
      line_items.push({ price: priceId, quantity });
      continue;
    }

    // 3) Essential oils pattern: eo-<short>-<size> (eo-pepp-15ml)
    if (cartId && cartId.startsWith("eo-")) {
      const parts = cartId.split("-");
      if (parts.length < 3) return jsonErr(400, `Bad EO SKU: ${cartId}`);
      const short = parts[1];
      const size  = parts.slice(2).join("-");
      const keyName = `STRIPE_PRICE_ID_EO_${short.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${size.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${IS_PROD ? "LIVE" : "TEST"}`;
      const priceId = ENV.get(keyName);
      if (!priceId) return jsonErr(500, `Missing Stripe Price ID env for EO SKU "${cartId}". Set ${keyName}.`);
      line_items.push({ price: priceId, quantity });
      continue;
    }

    // 4) Fallback: raw price_data passthrough
    if (it.price_data && typeof it.price_data === "object") {
      line_items.push({ price_data: it.price_data, quantity });
      continue;
    }

    // Could not map this item
    return jsonErr(400, `items[${i}] must include price:"price_..." OR id/sku in PRICE_MAP/EO envs OR price_data`, {
      receivedKeys: Object.keys(it || {}),
      cartIdTried: cartId || null,
      env: IS_PROD ? "production" : "preview/dev",
    });
  }

  // --- Build success/cancel URLs from request origin ---
  const originHeader = request.headers.get("origin");
  const origin = originHeader || new URL(request.url).origin;

  try {
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

    // -------- Discounts (safe & robust) --------
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

    // Only allow a forced coupon in PREVIEW/DEV, never in Production
    const forcedCoupon = !IS_PROD ? ENV.get("STRIPE_COUPON_99") : undefined;
    // IMPORTANT: forcedCoupon must be a real Coupon ID (like "Z4i0..."), not a human promo code such as "TEST1"
    if (forcedCoupon) discounts.push({ coupon: forcedCoupon });

    if (promoCode) {
      // Try exact code first; if not found, try a no-spaces variant
      const findPromo = async (code: string) => {
        const res = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
        return res.data[0]?.id;
      };

      let promoId = await findPromo(promoCode);
      if (!promoId) {
        const noSpace = promoCode.replace(/\s+/g, "");
        if (noSpace && noSpace.toLowerCase() !== promoCode.toLowerCase()) {
          promoId = await findPromo(noSpace);
        }
      }
      if (promoId) discounts.push({ promotion_code: promoId });
      // If still not found, we proceed without discounts (no error)
    }

    // Create session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
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
