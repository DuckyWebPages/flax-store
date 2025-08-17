import type { APIRoute } from "astro";
import Stripe from "stripe";

const secret = import.meta.env.STRIPE_SECRET_KEY as string;
const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { items } = (await request.json()) as {
      items: Array<{ name: string; unitCents: number; qty: number }>;
    };

    const line_items = items.map((i) => ({
      quantity: i.qty,
      price_data: {
        currency: "usd",
        unit_amount: i.unitCents,
        product_data: { name: i.name },
      },
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: new URL("/success", url).toString(),
      cancel_url: new URL("/", url).toString(),
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "failed_to_create_session" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};
