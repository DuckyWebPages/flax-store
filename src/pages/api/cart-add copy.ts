// FILE: src/pages/api/cart-add.ts
import type { APIRoute } from "astro";

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN || import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

// 1) Lookup variant by product handle
const PRODUCT_BY_HANDLE = /* GraphQL */ `
query ProductByHandle($handle: String!) {
  product(handle: $handle) {
    variants(first: 10) {
      edges { node { id availableForSale } }
    }
  }
}
`;

// 2) Add to cart by variant id
const CART_LINES_ADD = /* GraphQL */ `
mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      checkoutUrl
      totalQuantity
      lines(first: 50) {
        edges { node { id quantity merchandise { ... on ProductVariant { id title product { handle title } price { amount currencyCode } } } } }
      }
    }
    userErrors { field message }
  }
}
`;

export const POST: APIRoute = async ({ request }) => {
  let cartId = "", handle = "", qty = 1;

  try {
    const body = await request.json();                 // ← this is the bit that often goes wrong
    cartId = String(body?.cartId || "");
    handle = String(body?.handle || "");
    qty    = Number(body?.qty ?? 1);
  } catch (_) {}

  if (!handle) {
    return new Response(JSON.stringify({ ok: false, error: "Missing product handle" }), { status: 400 });
  }
  if (!cartId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing cartId" }), { status: 400 });
  }

  // 1) get first sellable variant
  const pRes = await fetch(`https://${DOMAIN}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": String(TOKEN),
    },
    body: JSON.stringify({ query: PRODUCT_BY_HANDLE, variables: { handle } }),
  });
  const pJson = await pRes.json();
  const edges = pJson?.data?.product?.variants?.edges || [];
  const variant = edges.find((e: any) => e?.node?.availableForSale)?.node || edges[0]?.node;

  if (!variant?.id) {
    return new Response(JSON.stringify({ ok: false, error: "No sellable variant for handle '"+handle+"'" }), { status: 404 });
  }

  // 2) add line
  const aRes = await fetch(`https://${DOMAIN}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": String(TOKEN),
    },
    body: JSON.stringify({
      query: CART_LINES_ADD,
      variables: { cartId, lines: [{ merchandiseId: variant.id, quantity: Math.max(1, qty|0) }] },
    }),
  });

  const aJson = await aRes.json();
  const err = aJson?.data?.cartLinesAdd?.userErrors?.[0]?.message;
  const cart = aJson?.data?.cartLinesAdd?.cart;

  if (err || !cart) {
    return new Response(JSON.stringify({ ok: false, error: err || "cartLinesAdd failed" }), { status: 400 });
  }
  return new Response(JSON.stringify({ ok: true, cart }), { status: 200 });
};
