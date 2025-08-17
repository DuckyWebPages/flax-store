// src/pages/api/checkout.ts
export const prerender = false; // do NOT run at build time

export async function POST({ request }: { request: Request }) {
  // Load Stripe only when this endpoint is called (prevents build errors)
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
    // Expecting: { items: [{ id, name, unitCents, qty, image? }, ...] }
    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items to checkout' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Build Stripe Checkout line items
    const origin = request.headers.get('origin') ?? new URL(request.url).origin;

    const line_items = items.map((i: any) => ({
      quantity: Math.max(1, Number(i.qty) || 1),
      price_data: {
        currency: 'usd',
        // IMPORTANT: unit_amount is in cents (integer)
        unit_amount: Number(i.unitCents),
        product_data: {
          name: String(i.name ?? 'Item'),
          // Optional product image on the checkout page
          ...(i.image ? { images: [new URL(i.image, origin).href] } : {}),
        },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      // Optional extras to enable later:
      // shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      // automatic_tax: { enabled: false },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[checkout] error:', err);
    return new Response(JSON.stringify({ error: 'Checkout error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
