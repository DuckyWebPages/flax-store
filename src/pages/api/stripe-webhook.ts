// FILE: src/pages/api/stripe-webhook.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";
import { decrementStock } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export const post: APIRoute = async ({ request }) => {
  const sig = request.headers.get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const rawBody = await request.arrayBuffer();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig!,
      whSecret
    );
  } catch (err: any) {
    console.error("[webhook] bad signature:", err?.message);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Prefer our metadata snapshot set at checkout time:
      let items: { sku: string; qty: number }[] | null = null;
      try {
        if (session.metadata?.items_json) {
          items = JSON.parse(session.metadata.items_json);
        }
      } catch {}

      // Fallback: fetch line items and map from price metadata.sku (set these in Stripe Dashboard)
      if (!items) {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
        items = lineItems.data.map(li => ({
          sku: (li.price?.metadata?.sku as string) || (li.description as string) || "unknown",
          qty: li.quantity || 1
        }));
      }

      if (items && items.length) {
        await decrementStock(items);
      } else {
        console.warn("[webhook] no items parsed; nothing decremented");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[webhook] handler error", err);
    return new Response("Webhook error", { status: 500 });
  }
};
