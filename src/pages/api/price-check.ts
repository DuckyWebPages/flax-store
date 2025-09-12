// FILE: src/pages/api/price-check.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

// Helper: safe trim
const clean = (s: unknown) => String(s ?? "").trim();

const PRICE_FLAX = clean(import.meta.env.STRIPE_PRICE_ID_FLAXSINGLETEST);
const PRICE_ANCT = clean(import.meta.env.STRIPE_PRICE_ID_ANCIENTSINGLETEST);

export const GET: APIRoute = async ({ request }) => {
  const key = String(import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), { status: 500 });
  }

  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  try {
    const url = new URL(request.url);
    const given = clean(url.searchParams.get("id"));

    // Which IDs are we about to check?
    const toCheck = given ? [given] : [PRICE_FLAX, PRICE_ANCT];

    const results: Array<Record<string, unknown>> = [];
    for (const id of toCheck) {
      if (!id) {
        results.push({ id, ok: false, error: "EMPTY_ID" });
        continue;
      }
      try {
        // Attempt to retrieve the price from *this key's* environment/account
        const p = await stripe.prices.retrieve(id);
        results.push({
          id,
          ok: true,
          currency: p.currency,
          unit_amount: p.unit_amount,
          active: p.active,
          livemode: !!p.livemode,
          product: typeof p.product === "string" ? p.product : p.product?.id,
        });
      } catch (err: any) {
        results.push({
          id,
          ok: false,
          error: err?.raw?.message || err?.message || String(err),
          type: err?.type || "unknown",
        });
      }
    }

    // Also show what env vars are present (masked)
    const seen = {
      STRIPE_SECRET_KEY_prefix: key.slice(0, 7),
      STRIPE_PRICE_ID_FLAXSINGLETEST_present: !!PRICE_FLAX,
      STRIPE_PRICE_ID_ANCIENTSINGLETEST_present: !!PRICE_ANCT,
    };

    return new Response(JSON.stringify({ seen, results }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
};
