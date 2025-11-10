/* FILE: src/pages/api/shopify-health.ts */
import type { APIRoute } from "astro";
export const GET: APIRoute = async () => {
  const domain =
    import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN ||
    import.meta.env.PUBLIC_SHOPIFY_DOMAIN;
  const token =
    import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
    import.meta.env.PUBLIC_SHOPIFY_TOKEN;
  return new Response(
    JSON.stringify({
      haveDomain: Boolean(domain),
      haveToken: Boolean(token),
      domain,
      tokenLen: token?.length ?? 0,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
};
