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
// HARD-CODED PRICE IDS
// Keys MUST match your <button data-sku="..."> on product pages.
const PRICE_MAP: Record<string, string> = {
  "BLM": "price_1SKAVdEBOCXQH1bcamiEg344",
  "dandelion-tea": "price_1SKCR1EBOCXQH1bcsMWwThUb",
  "methylene-blue": "price_1SK7YrEBOCXQH1bcKPcdY56O",
};
// ───────────────────────────────────────────────────────────────────────────────

function envPriceIdForSku(sku: string): string | undefined {
  const envKey = "STRIPE_PRICE_ID_" + sku.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  return (import.meta.env as any)[envKey];
}

function getPriceIdForSku(sku: string): string | undefined {
  return envPriceIdForSku(sku) || PRICE_MAP[sku];
}

function looksLikePriceId(v: string | undefined): v is string {
  return !!v && v.startsWith("price_");
}

async function findPromotionCodeIdByCode(code?: string) {
  if (!code) return undefined;
  try {
    const list = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
    return list?.data?.[0]?.id;
  } catch (e) {
    console.warn("[stripe] promo lookup failed:", (e as Error).message);
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

      const priceId = getPriceIdForSku(sku);
      if (!looksLikePriceId(priceId)) {
        return new Response(
          JSON.stringify({ error: `Missing or invalid Price ID for SKU "${sku}".` }),
          { status: 400 }
        );
      }

      line_items.push({
        price: priceId,
        quantity: qty,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 99 },
      });
    }

    const origin = import.meta.env.SITE_URL || url.origin;
    const success_url = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}/checkout/cancelled`;

    const promotion_code_id = await findPromotionCodeIdByCode(promoCode);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items,
      success_url,
      cancel_url,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      discounts: promotion_code_id ? [{ promotion_code: promotion_code_id }] : undefined,

      // Apple Pay / Google Pay ride on "card" if enabled + domain verified
      payment_method_types: ["card", "cashapp"],

      customer_creation: "if_required",
      automatic_tax: { enabled: false },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return new Response(JSON.stringify({ id: session.id, url: session.url }), { status: 200 });
  } catch (err) {
    console.error("[stripe] create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unknown error" }),
      { status: 500 }
    );
  }
};
