// FILE: src/pages/api/cart-create.ts
import type { APIRoute } from "astro";

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN || import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN || import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN || import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

const CART_CREATE = /* GraphQL */ `
mutation CartCreate($lines: [CartLineInput!]) {
  cartCreate(input: { lines: $lines }) {
    cart { id checkoutUrl }
    userErrors { field message }
  }
}
`;

export const POST: APIRoute = async () => {
  const r = await fetch(`https://${DOMAIN}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": String(TOKEN),
    },
    body: JSON.stringify({ query: CART_CREATE, variables: { lines: [] } }),
  });

  const json = await r.json();
  const cart = json?.data?.cartCreate?.cart;
  const err  = json?.data?.cartCreate?.userErrors?.[0]?.message;

  if (!cart) {
    return new Response(JSON.stringify({ ok: false, error: err || "cartCreate failed" }), { status: 400 });
  }
  return new Response(JSON.stringify({ ok: true, cart }), { status: 200 });
};
