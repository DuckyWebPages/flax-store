// FILE: src/pages/api/shopify-proxy.ts
import type { APIRoute } from "astro";

const DOMAIN = import.meta.env.PUBLIC_SHOPIFY_STORE_DOMAIN!;
const TOKEN =
  import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
  import.meta.env.PUBLIC_SHOPIFY_STOREFRONT_API_TOKEN;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const r = await fetch(`https://${DOMAIN}/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": String(TOKEN),
      },
      body: JSON.stringify(body),
    });
    const json = await r.json();
    return new Response(JSON.stringify(json), {
      headers: { "content-type": "application/json" },
      status: r.status,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
    });
  }
};
