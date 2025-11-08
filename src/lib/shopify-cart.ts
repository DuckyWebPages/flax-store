// FILE: src/lib/shopify-cart.ts
// Minimal Shopify Cart API helper for a headless Astro site.

const DOMAIN =
  (import.meta as any).env?.PUBLIC_SHOPIFY_STORE_DOMAIN ||
  (typeof window !== "undefined" && (window as any).SHOPIFY?.domain);

const TOKEN =
  (import.meta as any).env?.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
  (typeof window !== "undefined" && (window as any).SHOPIFY?.token);

if (!DOMAIN || !TOKEN) {
  throw new Error("Shopify config missing. Provide PUBLIC_SHOPIFY_* envs or window.SHOPIFY.");
}

const API = "2024-10";
const GQL_ENDPOINT = `https://${DOMAIN}/api/${API}/graphql.json`;

type GqlResponse<T> = { data?: T; errors?: any };
function hdrs() {
  return {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": TOKEN,
  };
}
async function gql<T>(query: string, variables?: Record<string, any>): Promise<GqlResponse<T>> {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: hdrs(),
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// ---- Local storage keys ----
const KEY_ID = "shopify_cart_id";
const KEY_CHECKOUT = "shopify_cart_checkout_url";
function getCartId(): string | null { try { return localStorage.getItem(KEY_ID); } catch { return null; } }
function setCartId(id: string) { try { localStorage.setItem(KEY_ID, id); } catch {} }
function getCheckout(): string | null { try { return localStorage.getItem(KEY_CHECKOUT); } catch { return null; } }
function setCheckout(url: string) { try { localStorage.setItem(KEY_CHECKOUT, url); } catch {} }

// ---- Ensure cart ----
export async function ensureCart(): Promise<{ id: string; checkoutUrl: string }> {
  const existing = getCartId();
  if (existing) return { id: existing, checkoutUrl: getCheckout() || "" };

  const CREATE = /* GraphQL */ `
    mutation CreateCart {
      cartCreate(input: {}) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }
  `;
  const r = await gql<{ cartCreate: { cart: { id: string; checkoutUrl: string } | null; userErrors: any[] } }>(CREATE);
  const cart = r.data?.cartCreate?.cart;
  if (!cart) {
    console.error("cartCreate failed:", JSON.stringify(r, null, 2));
    throw new Error("Failed to create Shopify cart");
  }
  setCartId(cart.id);
  setCheckout(cart.checkoutUrl);
  return { id: cart.id, checkoutUrl: cart.checkoutUrl };
}

// ---- Add by variant id ----
export async function addVariant(variantId: string, quantity = 1) {
  const { id: cartId } = await ensureCart();
  const ADD = /* GraphQL */ `
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }
  `;
  const r = await gql<{ cartLinesAdd: { cart: { id: string; checkoutUrl: string; totalQuantity: number } | null; userErrors: any[] } }>(
    ADD, { cartId, lines: [{ merchandiseId: variantId, quantity }] }
  );
  const cart = r.data?.cartLinesAdd?.cart;
  if (!cart) {
    console.error("cartLinesAdd failed:", JSON.stringify(r, null, 2));
    throw new Error("Failed to add to cart");
  }
  setCheckout(cart.checkoutUrl);
  return cart;
}

// ---- Add by handle (pick a *sellable* variant) ----
export async function addByHandle(handle: string, quantity = 1) {
  const Q = /* GraphQL */ `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
          }
        }
        publishedOnCurrentPublication   # true when published to your Online Store channel
      }
    }
  `;
  const resp = await gql<{ product: {
    id: string;
    title: string;
    publishedOnCurrentPublication: boolean;
    variants: { nodes: { id: string; title: string; availableForSale: boolean }[] }
  } | null }>(Q, { handle });

  const product = resp.data?.product || null;
  if (!product) {
    throw new Error(`Product not found for handle '${handle}'. Check the product URL handle in Shopify.`);
  }

  // Try to pick the first sellable variant
  const sellable = product.variants?.nodes?.find(v => v.availableForSale) ?? null;

  // If none are "sellable", fall back to the first variant but explain why
  const chosen = sellable ?? product.variants?.nodes?.[0] ?? null;
  if (!chosen) {
    const why = [
      !product.publishedOnCurrentPublication ? "• Not published to Online Store" : null,
      "• No variants found or none availableForSale",
      "• Check 'Track quantity' and set a positive stock number",
      "• Or enable 'Continue selling when out of stock'"
    ].filter(Boolean).join("\n");
    throw new Error(
      `No sellable variant for handle '${handle}'.\n\nTroubleshooting:\n${why}`
    );
  }

  // If we had to fall back, still warn the user in console (non-blocking)
  if (!sellable && chosen) {
    console.warn(`[Shopify] '${product.title}' has no sellable variants. Using first variant anyway:`, chosen);
  }

  return addVariant(chosen.id, quantity);
}


// ---- Get cart ----
export async function getCart() {
  const id = getCartId();
  if (!id) return null;
  const Q = /* GraphQL */ `
    query CartGet($id: ID!) {
      cart(id: $id) {
        id
        checkoutUrl
        totalQuantity
        lines(first: 50) {
          nodes {
            id
            quantity
            cost { totalAmount { amount currencyCode } }
            merchandise {
              ... on ProductVariant {
                id
                title
                product { title handle }
                image { url altText }
                price { amount currencyCode }
              }
            }
          }
        }
      }
    }
  `;
  const r = await gql<{ cart: any }>(Q, { id });
  return r.data?.cart || null;
}

// ---- Update / remove ----
export async function setLineQuantity(lineId: string, quantity: number) {
  const cartId = getCartId();
  if (!cartId) return null;
  const MUT = /* GraphQL */ `
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }
  `;
  const r = await gql(MUT, { cartId, lines: [{ id: lineId, quantity }] });
  return (r as any).data?.cartLinesUpdate?.cart || null;
}

export async function removeLine(lineId: string) {
  const cartId = getCartId();
  if (!cartId) return null;
  const MUT = /* GraphQL */ `
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { id checkoutUrl totalQuantity }
        userErrors { field message }
      }
    }
  `;
  const r = await gql(MUT, { cartId, lineIds: [lineId] });
  return (r as any).data?.cartLinesRemove?.cart || null;
}

export function getCheckoutUrl(): string | null {
  return getCheckout();
}
