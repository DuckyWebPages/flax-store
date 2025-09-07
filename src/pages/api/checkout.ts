// src/pages/api/checkout.ts
export const prerender = false; // must run on server at request time

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(key || '', { apiVersion: '2024-06-20' });

// Server-side catalog (authoritative prices/images)
// Make sure these IDs match your data-sku’s in the Add-to-Cart buttons.
const CATALOG: Record<string, { name: string; unit_amount: number; image: string }> = {
  'fhl-single': {
    name: 'Flax Hull Lignan (Single Jar)',
    unit_amount: 3900,
    image: '/images/products/flax-hull-single.jpg',
  },
  'ancient-single': {
    name: 'FLH Ancient Seeds & Grains (Single Jar)',
    unit_amount: 4500,
    image: '/images/products/ancient-single-small.png',
  },
  // If you reintroduce bundles later, add them here:
  // 'fhl-bundle': { name: 'Flax Hull Lignan Bundle (3 Jars)', unit_amount: 11250, image: '/images/flax-hull-bundle-small.jpg' },
  // 'ancient-bundle': { name: 'Ancient Seeds & Grains (3 Jar Bundle)', unit_amount: 13200, image: '/images/products/ancient3jarsmall.jpg' },
};

function absoluteUrl(origin: string, path: string) {
  if (path.startsWith('http')) return path;
  return new URL(path, origin).toString();
}

export async function POST({ request }: { request: Request }) {
  try {
    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY on server' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const origin = request.headers.get('origin') ?? new URL(request.url).origin;

    const body = await request.json().catch(() => null);
    const items: Array<{ id: string; qty: number }> = Array.isArray(body?.items) ? body!.items : [];

    if (!items.length) {
      return new Response(JSON.stringify({ error: 'No items provided' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Build line items from the secure catalog
    const line_items = items
      .map(({ id, qty }, idx) => {
        const product = CATALOG[id];
        if (!product) throw new Error(`Unknown item id "${id}" at index ${idx}`);
        const quantity = Math.max(1, Number(qty || 1));
        return {
          quantity,
          price_data: {
            currency: 'usd',
            unit_amount: product.unit_amount,
            product_data: {
              name: product.name,
              images: [absoluteUrl(origin, product.image)],
            },
          },
        } as Stripe.Checkout.SessionCreateParams.LineItem;
      });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      success_url: absoluteUrl(origin, '/thanks?session_id={CHECKOUT_SESSION_ID}'),
      cancel_url: absoluteUrl(origin, '/cart-cancelled'),
      metadata: { source: 'flax-store' },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[api/checkout] error:', err?.message || err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Checkout failed' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
