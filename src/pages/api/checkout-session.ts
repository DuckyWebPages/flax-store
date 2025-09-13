// FILE: src/pages/api/checkout-session.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";

const secret = import.meta.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.warn("[/api/checkout-session] Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secret as string, {
  // Keep apiVersion pinned so minor Stripe changes don't break you
  apiVersion: "2024-06-20",
});

export const GET: APIRoute = async ({ url }) => {
  try {
    const session_id = url.searchParams.get("session_id");
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: [
        "line_items.data.price.product",
        "customer_details",
        // Optional but handy if you ever need more granular payment info:
        "payment_intent",
      ],
    });

    return new Response(JSON.stringify({ session }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unable to retrieve checkout session" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
