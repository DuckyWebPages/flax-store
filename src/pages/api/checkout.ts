// src/pages/api/checkout.ts
export const prerender = false; // do NOT run at build time

import { PRICE_MAP } from '../../lib/priceMap';

// We keep the dynamic import to avoid build-time issues
export async function POST({ request }: { request: Request }) {
  const { default: Stripe } = await import('stripe');

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: 'Stripe not configured (missing STRIPE_SECRET_KEY)' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

  try {
    // Expecting { items: [{ id: 'fhl-bundle', qty: 1 }, ...] }
    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items to checkout' }), {
        status: 400, headers: { 'content-type': 'application/json' },
      });
    }

    // Build Stripe line_items using PRICE IDs only
    const line_items = [];
    for (const row of items) {
      const id = String(row?.id || '');
      const qty = Number(row?.qty || 0);
      const priceId = PRICE_MAP[id];

      if (!priceId) {
        // unknown SKU — skip it
        continue;
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        continue;
      }

      line_items.push({ price: priceId, quantity: qty });
    }

    if (line_items.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid line items' }), {
        status: 400, headers: { 'content-type': 'application/json' },
      });
    }

    const origin = request.headers.get('origin') ?? new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[checkout] error:', err);
    return new Response(JSON.stringify({ error: 'Checkout error' }), {
      status: 500, headers: { 'content-type': 'application/json' },
    });
  }
}
