// src/pages/api/checkout.ts
export const prerender = false; // must run on the server at request time

export async function POST({ request }: { request: Request }) {
  const { default: Stripe } = await import('stripe');

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY on the server' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  // Map your cart IDs -> Stripe Price IDs (copy from your Stripe Dashboard)
  // Example only — replace these with YOUR live/test Price IDs.
  const PRICES: Record<string, string> = {
    'fhl-single': 'price_1RwprFEFshq3zxZhtRRrXOjE', // $39.00
    'fhl-bundle': 'price_1RwriPEFshq3zxZhMz3MO2IL', // $112.50
    'ancient-single': 'price_1RwtyoEFshq3zxZhljPpaF3j', // $45
    'ancient-bundle': 'price_1S4EcgEFshq3zxZhPou8GVyX', // $132
  };

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

  try {
    const body = await request.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!items.length) {
      return new Response(JSON.stringify({ error: 'No items provided' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Validate every item and build Stripe line_items
    const line_items = items.map((i: any, idx: number) => {
      const id = String(i?.id ?? '');
      const qty = Math.max(1, Number(i?.qty) || 1);
      const priceId = PRICES[id];

      if (!id) throw new Error(`Item at index ${idx} is missing "id".`);
      if (!priceId) throw new Error(`No Stripe Price found for id "${id}".`);
      if (!Number.isFinite(qty) || qty < 1) throw new Error(`Bad quantity for "${id}".`);

      return { price: priceId, quantity: qty };
    });

    const origin = request.headers.get('origin') ?? new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[checkout] error:', err?.message ?? err, err?.stack);
    return new Response(
      JSON.stringify({
        error:
          err?.message ||
          'Checkout error (server). Check server logs and Price IDs.',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
