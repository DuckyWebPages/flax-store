import type { APIRoute } from 'astro';

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = '2024-10';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { merchId, qty = 1 } = await request.json();
    if (!merchId) {
      return new Response(JSON.stringify({ error: 'Missing merchId' }), { status: 400 });
    }

    const url = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;
    const query = `
      mutation CreateCart($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart { id checkoutUrl }
          userErrors { field message }
        }
      }
    `;
    const variables = { lines: [{ merchandiseId: merchId, quantity: qty }] };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();
    const errors = json?.errors || json?.data?.cartCreate?.userErrors;
    if (!res.ok || (errors && errors.length)) {
      return new Response(JSON.stringify({ error: errors || res.statusText }), { status: 400 });
    }

    const checkoutUrl = json.data.cartCreate.cart.checkoutUrl;
    return new Response(JSON.stringify({ checkoutUrl }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 });
  }
};
