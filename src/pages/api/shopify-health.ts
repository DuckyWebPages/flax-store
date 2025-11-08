// FILE: src/pages/api/shopify-health.ts
import type { APIRoute } from "astro";
import { shopifyQuery } from "@/lib/shopify";

export const GET: APIRoute = async () => {
  const domain = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN || null;
  const token  = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN || "";
  const haveDomain = !!domain;
  const haveToken  = !!token;

  try {
    // Tiny, safe query
    const data = await shopifyQuery<{ shop: { name: string } }>(/* GraphQL */`
      query { shop { name } }
    `);
    return new Response(JSON.stringify({
      ok: true,
      haveDomain,
      haveToken,
      domain,
      tokenLen: token.length,
      shopName: data.shop?.name ?? null,
    }), { headers: { "content-type": "application/json" }});
  } catch (err: any) {
    return new Response(JSON.stringify({
      ok: false,
      haveDomain,
      haveToken,
      domain,
      tokenLen: token.length,
      error: err?.message ?? String(err),
    }), { headers: { "content-type": "application/json" }});
  }
};
