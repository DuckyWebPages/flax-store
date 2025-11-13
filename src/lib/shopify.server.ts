// FILE: src/lib/shopify.server.ts
// Server-safe Shopify helpers for Storefront API 2024-10
// - Uses checkoutUrl (NOT webUrl).
// - Resolves a product's FIRST sellable variant by handle.
// - Persists a Cart ID in an HttpOnly cookie from the API route.

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN; // e.g. "flax-lignan-health.myshopify.com"
const TOKEN = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN; // Storefront access token

if (!DOMAIN || !TOKEN) {
  throw new Error(
    "Missing Shopify env. Set PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN.",
  );
}

const API = "2024-10";
const GQL_ENDPOINT = `https://${DOMAIN}/api/${API}/graphql.json`;

type GqlResp<T> = { data?: T; errors?: any };

async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shopify HTTP ${res.status}: ${text}`);
  }

  const json = (await res.json()) as GqlResp<T>;
  if (json.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  if (!json.data) {
    throw new Error(`Shopify GraphQL: no data in response`);
  }
  return json.data;
}

// --- Product / variant helpers ---

const PRODUCT_BY_HANDLE = /* GraphQL */ `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      variants(first: 10) {
        edges {
          node {
            id
            availableForSale
          }
        }
      }
    }
  }
`;

export async function resolveVariantIdByHandle(
  handle: string,
): Promise<string> {
  const data = await shopifyGraphQL<{
    product: {
      id: string;
      title: string;
      variants: { edges: { node: { id: string; availableForSale: boolean } }[] };
    } | null;
  }>(PRODUCT_BY_HANDLE, { handle });

  const product = data.product;
  if (!product) throw new Error(`Product not found for handle "${handle}"`);
  const edge =
    product.variants?.edges?.find((e) => e.node.availableForSale) ??
    product.variants?.edges?.[0];
  if (!edge?.node?.id)
    throw new Error(`No variant found for "${handle}"`);
  return edge.node.id; // merchandiseId (gid://shopify/ProductVariant/...)
}

// --- Cart create / add ---

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 10) {
          edges {
            node {
              id
              quantity
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 10) {
          edges {
            node {
              id
              quantity
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createCart(): Promise<{
  cartId: string;
  checkoutUrl: string;
}> {
  const data = await shopifyGraphQL<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(CART_CREATE, { input: {} });

  const cart = data.cartCreate.cart;
  if (!cart)
    throw new Error(
      `cartCreate failed: ${JSON.stringify(data.cartCreate.userErrors)}`,
    );
  return { cartId: cart.id, checkoutUrl: cart.checkoutUrl };
}

export async function addLineToCart(params: {
  cartId: string;
  merchandiseId: string;
  quantity: number;
}): Promise<{ cartId: string; checkoutUrl: string; linesCount: number }> {
  const data = await shopifyGraphQL<{
    cartLinesAdd: {
      cart: {
        id: string;
        checkoutUrl: string;
        lines: { edges: { node: { id: string; quantity: number } }[] };
      } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(CART_LINES_ADD, {
    cartId: params.cartId,
    lines: [{ merchandiseId: params.merchandiseId, quantity: params.quantity }],
  });

  const result = data.cartLinesAdd;
  if (!result.cart)
    throw new Error(
      `cartLinesAdd failed: ${JSON.stringify(result.userErrors)}`,
    );

  const linesCount = result.cart.lines?.edges?.length ?? 0;
  return {
    cartId: result.cart.id,
    checkoutUrl: result.cart.checkoutUrl,
    linesCount,
  };
}

/**
 * Cookie utilities (HttpOnly) for saving cartId on the server.
 */
export function readCartIdFromCookie(
  cookieHeader: string | null | undefined,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)shop_cart_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCartIdCookie(cartId: string): string {
  // 30 days, strict
  const maxAge = 60 * 60 * 24 * 30;
  return `shop_cart_id=${encodeURIComponent(
    cartId,
  )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

// === Cart query + helpers ===

const CART_QUERY = /* GraphQL */ `
  query Cart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 50) {
        nodes {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              quantityAvailable
              availableForSale
              product {
                title
                handle
                featuredImage {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getCartById(cartId: string | null | undefined) {
  // 🛑 If we don't have a cart ID, don't call Shopify at all
  if (!cartId) return null;

  const data = await shopifyGraphQL<{ cart: any }>(CART_QUERY, { cartId });
  return data?.cart ?? null;
}

const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          subtotalAmount {
            amount
            currencyCode
          }
          totalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 50) {
          nodes {
            id
            quantity
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                quantityAvailable
                availableForSale
                product {
                  title
                  handle
                  featuredImage {
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function updateLineQuantity(
  cartId: string,
  lineId: string,
  quantity: number,
) {
  const data = await shopifyGraphQL<{ cartLinesUpdate: any }>(
    CART_LINES_UPDATE,
    {
      cartId,
      lines: [{ id: lineId, quantity }],
    },
  );

  const result = data.cartLinesUpdate;
  if (!result.cart) {
    throw new Error(
      `cartLinesUpdate failed: ${JSON.stringify(result.userErrors)}`,
    );
  }

  return result.cart;
}

const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function removeCartLine(cartId: string, lineId: string) {
  const data = await shopifyGraphQL<{ cartLinesRemove: any }>(
    CART_LINES_REMOVE,
    {
      cartId,
      lineIds: [lineId],
    },
  );

  const result = data.cartLinesRemove;
  if (!result.cart) {
    throw new Error(
      `cartLinesRemove failed: ${JSON.stringify(result.userErrors)}`,
    );
  }

  return result.cart;
}
