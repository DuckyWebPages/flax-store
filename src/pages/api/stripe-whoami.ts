import type { APIRoute } from "astro";
import Stripe from "stripe";

export const GET: APIRoute = async () => {
  const key = (import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!key) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), { status: 500 });
  }
  try {
    const stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    const acct = await stripe.accounts.retrieve();
    return new Response(JSON.stringify({ id: acct.id, type: acct.type }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "whoami failed" }), { status: 500 });
  }
};
