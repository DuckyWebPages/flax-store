// FILE: src/lib/shopify.js
const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;           // e.g., flax-lignan-health.myshopify.com
const TOKEN  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;       // your Storefront token (rotated/new)
const API_VERSION = '2024-10';                                        // lock version on purpose

export async function shopifyQuery(query, variables = {}) {
  const url = `https://${DOMAIN}/api/${API_VERSION}/graphql.json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Shopify ${res.status}: ${text || res.statusText}`);
  }

  const payload = await res.json();
  if (payload.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(payload.errors)}`);
  }
  return payload.data;
}
