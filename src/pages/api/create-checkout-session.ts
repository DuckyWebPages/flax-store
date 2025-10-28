// FILE: src/pages/api/create-checkout-session.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

// Helps avoid TEST/LIVE mixups in logs
const keyPrefix = (import.meta.env.STRIPE_SECRET_KEY || "").slice(0, 7);
console.log("[stripe] key mode:", keyPrefix.startsWith("sk_live") ? "LIVE" : "TEST");

// ───────────────────────────────────────────────────────────────────────────────
// HARD-CODED PRICE IDS (canonical SKUs as keys)
const PRICE_MAP: Record<string, string> = {
  // Teas / supplements
  "dandelion-tea":        "price_1SKCR1EBOCXQH1bcsMWwThUb",
  "hibiscus-tea":         "price_1SKCP8EBOCXQH1bcjkimtNBv",
  "sulfurzyme":           "price_1SKCKDEBOCXQH1bcr1E3ndKs",

  // Young Living
  "BLM":                  "price_1SKAVdEBOCXQH1bcamiEg344",
  "methylene-blue":       "price_1SK7YrEBOCXQH1bcKPcdY56O",
  "ningxia-nitro":        "price_1SJKrUEBOCXQH1bcfdXTYIvJ",

  // Flax Hull Lignans
  "fhl-single":           "price_1S5d2YEBOCXQH1bcbs0n7mW5",
  "fhl-bundle-3":         "price_1S5d2YEBOCXQH1bcrZycUxU0",
  "ancient-single":       "price_1S5d2YEBOCXQH1bcCvPNe214",
  "fhl-subscription":     "price_1S5d2XEBOCXQH1bc0U9Njupz",
  "ancient-bundle-3":     "price_1S5d2XEBOCXQH1bcodQ0WJgQ",

  // Aftershot / detox
  "aftershot-zeolite":    "price_1S5d2XEBOCXQH1bcb4pLLA3z", // 1 oz
  "aftershot-3pack":      "price_1S5d2XEBOCXQH1bcyQ355YfB",
  "ocean-cleanse-single": "price_1S5d2WEBOCXQH1bcJipHjLHr",
  "essiac-tea":           "price_1S5d2WEBOCXQH1bckTo518Dj",
};

// Accept common typos / legacy slugs so pages don’t break
const SKU_ALIAS: Record<string, string> = {
  // casing / common variations
  blm: "BLM",
  "Ningxia-Nitro": "ningxia-nitro",
  Sulfurzyme: "sulfurzyme",
  Methylenemethylene-blue: "methylene-blue",
  "flaxfhl-single": "fhl-single",
  "fhl-3-jar": "fhl-bundle-3",

  // AfterShot / Zeolite variants seen on site & in Stripe
  "aftershot-3pak": "aftershot-3pack",
  "aftershot-8oz": "aftershot-zeolite",
  "aftershot-1oz": "aftershot-zeolite",
  "zeolite-8oz": "aftershot-zeolite",
  "Zeolite-8OZ": "aftershot-zeolite", // letter O
  "Zeolite-80Z": "aftershot-zeolite", // zero (lookup_key)
};

// ENV override helper (e.g., STRIPE_PRICE_ID_FHL_SINGLE)
function envPriceIdForSku(sku: string): string | undefined {
  const envKey = "STRIPE_PRICE_ID_" + sku.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  return (import.meta.env as any)[envKey];
}

function looksLikePriceId(v: string | undefined): v is string {
  return !!v && v.startsWith("price_");
}

// Lookup-key fallback: resolve by Stripe Price.lookup_key if map/env missing
async function findPriceIdByLookupKey(lookupKey: string): Promise<string | undefined> {
  try {
    const list = await stripe.prices.list({
      lookup_keys: [lookupKey],
      active: true,
      limit: 1,
      expand: ["data.product"],
    });
    return list.data?.[0]?.id; // "price_..."
  } catch (e) {
    console.warn("[stripe] lookup-key search failed:", (e as Error).message);
    return undefined;
  }
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const items: Array<{ id: string; qty?: number }> = Array.isArray(body?.items) ? body.items : [];
    const promoCode: string | undefined = body?.promoCode;

    if (!items.length) {
      return new Response(JSON.stringify({ error: "No items provided." }), { status: 400 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const it of items) {
      const sku = String(it.id || "").trim();
      const qty = Math.max(1, Number(it.qty || 1));
      const aliasKey = (SKU_ALIAS[sku] ?? sku).trim();

      let priceId = envPriceIdForSku(aliasKey) || PRICE_MAP[aliasKey];

      console.log("[checkout] sku:", sku, "→ alias:", aliasKey, "map:", PRICE_MAP[aliasKey], "env:", envPriceIdForSku(aliasKey));

      // Fallback: try lookup_key = aliasKey, then raw sku if different
      if (!looksLikePriceId(priceId)) {
        priceId = await findPriceIdByLookupKey(aliasKey);
        console.log("[checkout] lookupKey (alias) →", aliasKey, "→", priceId);
      }
      if (!looksLikePriceId(priceId) && sku !== aliasKey) {
        priceId = await findPriceIdByLookupKey(sku);
        console.log("[checkout] lookupKey (raw) →", sku, "→", priceId);
      }

      if (!looksLikePriceId(priceId)) {
        return new Response(JSON.stringify({ error: `Missing or invalid Price ID for SKU "${sku}".` }), { status: 400 });
      }

      line_items.push({
        price: priceId,
        quantity: qty,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 99 },
      });
    }

    // Build absolute URLs safely
    const rawOrigin =
      (import.meta.env.SITE_URL && import.meta.env.SITE_URL.startsWith("http"))
        ? import.meta.env.SITE_URL
        : url.origin;

    const origin = rawOrigin.replace(/\/$/, "");
    // ✅ Send users to your robust thank-you page that loads the session
    const success_url = `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${origin}/cartcancel`;

    console.log("[checkout] redirect URLs:", { origin, success_url, cancel_url });

    const promotion_code_id = promoCode
      ? (await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 })).data?.[0]?.id
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url,
      cancel_url,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      discounts: promotion_code_id ? [{ promotion_code: promotion_code_id }] : undefined,
      payment_method_types: ["card"],
      customer_creation: "if_required",
      automatic_tax: { enabled: false },
    });

    return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200 });
  } catch (err: any) {
    const payload = {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      raw: err?.raw
        ? {
            message: err.raw.message,
            type: err.raw.type,
            code: err.raw.code,
            statusCode: err.raw.statusCode,
          }
        : undefined,
    };
    console.error("[stripe] create-checkout-session error:", payload);
    return new Response(JSON.stringify({ error: payload.message || "Unknown error" }), { status: 500 });
  }
};
