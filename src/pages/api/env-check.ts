// FILE: src/pages/api/env-check.ts
import type { APIRoute } from "astro";
export const GET: APIRoute = async () => {
  const d = import.meta.env.PUBLIC_SHOPIFY_DOMAIN?.trim();
  const t = import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN?.trim();
  return new Response(JSON.stringify({
    haveDomain: Boolean(d),
    haveToken: Boolean(t),
    domain: d || null,                 // temp: remove later
    tokenLen: t ? t.length : 0         // temp: remove later
  }), { status: 200 });
};
