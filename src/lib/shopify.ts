// FILE: src/lib/shopify.ts
const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN;            // e.g. "1b2nqi-hb.myshopify.com"
const TOKEN  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;        // length ~32
const API_URL = `https://${DOMAIN}/api/2024-10/graphql.json`;

if (!DOMAIN) throw new Error("Missing PUBLIC_SHOPIFY_STORE_DOMAIN");
if (!TOKEN)  throw new Error("Missing PUBLIC_SHOPIFY_STOREFRONT_TOKEN");

export async function shopifyQuery<T = any>(query: string, variables: Record<string, any> = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify fetch failed: ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    const msg = json.errors.map((e: any) => e.message).join("; ");
    throw new Error(`Shopify GraphQL error: ${msg}`);
  }
  return json.data as T;
}
// tiny helper (server-side) to get first sellable variant by handle
const PRODUCT_QUERY = `
  query ($handle: String!) {
    product(handle: $handle) {
      variants(first: 1) { nodes { id title availableForSale } }
    }
  }
`;
