// FILE: src/lib/shopify-inventory.ts
const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_DOMAIN!;
const TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;

// --- 1. Get inventory data from Shopify ---
export async function getVariantInventoryByHandle(handle: string) {
  const q = `
    query Inv($handle: String!) @inContext(country: US) {
      product(handle: $handle) {
        title
        variants(first: 50) {
          nodes {
            id
            title
            availableForSale
            quantityAvailable
            sku
          }
        }
      }
    }
  `;
  const r = await fetch(`https://${DOMAIN}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query: q, variables: { handle } }),
  });
  const { data, errors } = await r.json();
  if (errors) throw new Error(errors[0]?.message || "Shopify error");
  return data.product?.variants?.nodes ?? [];
}

// --- 2. Emit React drawer open event ---
export async function openCartWithStockWarnings(cart: any) {
  if (!cart) {
    window.dispatchEvent(new CustomEvent("cart:open", { detail: { cart: null } }));
    return;
  }

  // You could fetch inventory here to add warnings before opening, but for now just open
  window.dispatchEvent(
    new CustomEvent("cart:open", {
      detail: {
        cart,
        requestedMap: {}, // placeholder
        warnings: [],     // placeholder
      },
    }),
  );
}
