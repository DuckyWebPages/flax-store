// FILE: src/lib/shopify.server.ts
// Server-safe Shopify helpers for Storefront API 2024-10
// - Uses checkoutUrl (NOT webUrl).
// - Resolves a product's FIRST sellable variant by handle.
// - Persists a Cart ID in an HttpOnly cookie from the API route.

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN; // e.g. "flax-lignan-health.myshopify.com"
const TOKEN  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN; // Storefront access token

if (!DOMAIN || !TOKEN) {
  throw new Error(
    "Missing Shopify env. Set PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN."
  );
}

const API = "2024-10";
const GQL_ENDPOINT = `https://${DOMAIN}/api/${API}/graphql.json`;

type GqlResp<T> = { data?: T; errors?: any };

async function shopifyGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
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

export async function resolveVariantIdByHandle(handle: string): Promise<string> {
  const data = await shopifyGraphQL<{
    product: {
      id: string;
      title: string;
      variants: { edges: { node: { id: string; availableForSale: boolean } }[] };
    } | null;
  }>(PRODUCT_BY_HANDLE, { handle });

  const product = data.product;
  if (!product) throw new Error(`Product not found for handle "${handle}"`);
  const edge = product.variants?.edges?.find(e => e.node.availableForSale) || product.variants?.edges?.[0];
  if (!edge?.node?.id) throw new Error(`No variant found for "${handle}"`);
  return edge.node.id; // this is merchandiseId (gid://shopify/ProductVariant/...)
}

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 10) { edges { node { id quantity } } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 10) { edges { node { id quantity } } }
      }
      userErrors { field message }
    }
  }
`;

export async function createCart(): Promise<{ cartId: string; checkoutUrl: string }> {
  const data = await shopifyGraphQL<{
    cartCreate: {
      cart: { id: string; checkoutUrl: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(CART_CREATE, { input: {} });

  const cart = data.cartCreate.cart;
  if (!cart) throw new Error(`cartCreate failed: ${JSON.stringify(data.cartCreate.userErrors)}`);
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
  if (!result.cart) throw new Error(`cartLinesAdd failed: ${JSON.stringify(result.userErrors)}`);

  const linesCount = result.cart.lines?.edges?.length ?? 0;
  return { cartId: result.cart.id, checkoutUrl: result.cart.checkoutUrl, linesCount };
}

/**
 * Cookie utilities (HttpOnly) for saving cartId on the server.
 */
export function readCartIdFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)shop_cart_id=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCartIdCookie(cartId: string): string {
  // 30 days, strict
  const maxAge = 60 * 60 * 24 * 30;
  return `shop_cart_id=${encodeURIComponent(cartId)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}
// === Add after existing exports in src/lib/shopify.server.ts ===

const CART_QUERY = /* GraphQL */ `
  query Cart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      totalQuantity
      cost {
        subtotalAmount { amount currencyCode }
      }
      lines(first: 50) {
        nodes {
          id
          quantity
          cost { totalAmount { amount currencyCode } }
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              image { url altText }
              product { title handle }
            }
          }
        }
      }
    }
  }
`;

export async function getCartById(cartId: string) {
  const data = await (async function shopifyGraphQLLocal<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const res = await fetch(GQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
    const json = (await res.json()) as GqlResp<T>;
    if ((json as any).errors) throw new Error(JSON.stringify((json as any).errors));
    return json.data as T;
  })(CART_QUERY, { id: cartId });

  return (data as any).cart ?? null;
}

const CART_LINES_UPDATE = /* GraphQL */ `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message }
    }
  }
`;

export async function updateLineQuantity(cartId: string, lineId: string, quantity: number) {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({
      query: CART_LINES_UPDATE,
      variables: { cartId, lines: [{ id: lineId, quantity }] },
    }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const er = json.data?.cartLinesUpdate?.userErrors;
  if (er?.length) throw new Error(er.map((e: any) => e.message).join("; "));
  return json.data?.cartLinesUpdate?.cart;
}

const CART_LINES_REMOVE = /* GraphQL */ `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message }
    }
  }
`;

export async function removeCartLine(cartId: string, lineId: string) {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({
      query: CART_LINES_REMOVE,
      variables: { cartId, lineIds: [lineId] },
    }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  const er = json.data?.cartLinesRemove?.userErrors;
  if (er?.length) throw new Error(er.map((e: any) => e.message).join("; "));
  return json.data?.cartLinesRemove?.cart;
}
