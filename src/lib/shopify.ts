/* FILE: src/lib/shopify.ts */
const DOMAIN =
  import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN ||
  import.meta.env.PUBLIC_SHOPIFY_DOMAIN; // fallback for older name

const TOKEN =
  import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
  import.meta.env.PUBLIC_SHOPIFY_TOKEN; // fallback for older name

if (!DOMAIN || !TOKEN) {
  throw new Error(
    "Shopify env missing: set PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN in Production."
  );
}

export async function shopifyQuery(query: string, variables: Record<string, any> = {}) {
  const res = await fetch(`https://${DOMAIN}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(json?.errors?.[0]?.message || `Shopify query failed (${res.status})`);
  }
  return json.data;
}
