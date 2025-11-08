// Minimal client wrapper for Shopify Buy SDK
import Client from "shopify-buy";

const domain = import.meta.env.PUBLIC_SHOPIFY_DOMAIN;
const token  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

if (!domain || !token) {
  // Fail fast in dev if envs are missing
  console.warn(
    "[Shopify] Missing PUBLIC_SHOPIFY_DOMAIN or PUBLIC_SHOPIFY_STOREFRONT_TOKEN"
  );
}

export const shopifyClient = Client.buildClient({
  domain,
  storefrontAccessToken: token,
});

// Convenience helpers (optional)
export async function createCheckout() {
  return shopifyClient.checkout.create();
}

export async function fetchCheckout(id: string) {
  return shopifyClient.checkout.fetch(id);
}

export async function addLineItems(checkoutId: string, items: Array<{ variantId: string; quantity: number }>) {
  return shopifyClient.checkout.addLineItems(checkoutId, items);
}
