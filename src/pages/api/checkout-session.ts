// FILE: src/pages/api/checkout-session.ts
export const prerender = false;

import type { APIRoute } from "astro";
import Stripe from "stripe";

export const GET: APIRoute = async ({ url }) => {
  // Secret must exist at runtime
  const secret = (import.meta.env.STRIPE_SECRET_KEY || "").trim();
  if (!secret) {
    return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY missing" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const session_id = url.searchParams.get("session_id");
  if (!session_id) {
    return new Response(JSON.stringify({ error: "Missing session_id" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: [
        "line_items.data.price.product",
        "customer_details",
        "shipping_cost.shipping_rate",
        "discounts.promotion_code",
        "discounts.coupon",
        "payment_intent",
      ],
    });

    // Build a compact summary for your Thank You page or debugging
    const shippingRate =
      (session.shipping_cost?.shipping_rate as Stripe.ShippingRate | null) || null;

    const discounts = (session.discounts || []) as Array<
      | (Stripe.ApiList<Stripe.Discount> & any)
      | (Stripe.Checkout.Session.Discount & any)
      | any
    >;

    const summary = {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      currency: session.currency,
      subtotal: session.amount_subtotal,
      total: session.amount_total,
      tax_total: session.total_details?.amount_tax ?? 0,
      discount_total: session.total_details?.amount_discount ?? 0,
      shipping_total: session.shipping_cost?.amount_total ?? 0,
      shipping_rate: shippingRate
        ? {
            id: shippingRate.id,
            display_name: shippingRate.display_name,
            fixed_amount: shippingRate.fixed_amount?.amount ?? null,
          }
        : null,
      promo_codes: discounts.map((d: any) => ({
        id: d?.promotion_code?.id ?? null,
        code: d?.promotion_code?.code ?? null,
        coupon_name: d?.coupon?.name ?? null,
        percent_off: d?.coupon?.percent_off ?? null,
        amount_off: d?.coupon?.amount_off ?? null,
      })),
      customer: {
        email: session.customer_details?.email ?? null,
        name: session.customer_details?.name ?? null,
      },
      items_count: Number(session?.line_items?.data?.reduce?.((n: number, li: any) => n + (li.quantity ?? 0), 0) ?? 0),
    };

    return new Response(JSON.stringify({ session, summary }), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err?.message || "Unable to retrieve checkout session",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
