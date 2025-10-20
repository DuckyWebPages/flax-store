// FILE: src/pages/api/create-checkout-session.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

// Optional fallback map. ONLY fill entries that don't have lookup_key set in Stripe.
// Example: "fhl-single": "price_1Pxxxxxxx"
const HARDCODED: Record<string, string> = {
  "fhl-single": "price_1S5d2YEBOCXQH1bcbs0n7mW5",
  // add others here only if needed, e.g.:
  // "ancient-single": "price_live_ABCDEFG",
  "methylene-blue":
    import.meta.env.STRIPE_PRICE_ID_MBLUELIVE || "price_1SK7YrEBOCXQH1bcKPcdY56O",
};

type IncomingItem = { id: string; qty: number };
type Payload = { items: IncomingItem[]; promoCode?: string };

// Resolve your internal id (e.g., "fhl-single") to a real Stripe price_... id.
async function priceIdForInternalId(internalId: string): Promise<string> {
  // 1) Try Prices by lookup_key (BEST: set lookup_key in Stripe UI to your internal id)
  try {
    const byLookup = await stripe.prices.list({
      lookup_keys: [internalId],
      active: true,
      limit: 1,
      expand: ["data.product"],
    });
    if (byLookup.data.length) return byLookup.data[0].id;
  } catch (e) {
    console.warn("[stripe] prices.list lookup_key failed:", e);
  }

  // 2) Try Product metadata.sku or metadata.id == internalId
  try {
    const prods = await stripe.products.list({ active: true, limit: 100 });
    for (const p of prods.data) {
      const sku = (p.metadata?.sku || p.metadata?.id || "").trim();
      if (sku && sku === internalId) {
        const prices = await stripe.prices.list({
          product: p.id,
          active: true,
          limit: 10,
        });
        if (prices.data.length) {
          const oneTime = prices.data.find((pr) => !pr.recurring) || prices.data[0];
          return oneTime.id;
        }
      }
    }
  } catch (e) {
    console.warn("[stripe] products.list/price fetch failed:", e);
  }

  // 3) Fallback hardcoded map
  if (HARDCODED[internalId]) return HARDCODED[internalId];

  throw new Error(
    `Unknown product id "${internalId}". Set Stripe Price.lookup_key to "${internalId}" OR add it to HARDCODED.`
  );
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const body = (await request.json()) as Payload;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return new Response(JSON.stringify({ error: "No items." }), { status: 400 });
    }

    console.log("[checkout] incoming items:", items);

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const i of items) {
      const priceId = await priceIdForInternalId(String(i.id));
      const quantity = Math.max(1, Math.min(99, Number(i.qty || 1)));
      line_items.push({ price: priceId, quantity });
    }

    console.log("[checkout] line_items:", line_items);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      allow_promotion_codes: true,
      success_url: `${url.origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/cart?canceled=1`,
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (err: any) {
    console.error("[create-checkout-session] error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Checkout failed" }), {
      status: 400,
    });
  }
};
