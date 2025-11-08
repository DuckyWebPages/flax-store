// FILE: src/pages/api/cart-get.ts
import type { APIRoute } from "astro";
import { readCartIdFromCookie, getCartById } from "@/lib/shopify.server";

// Return the user's Shopify cart (if any) using the HttpOnly cookie.
// No body is needed. Just call with GET.
export const GET: APIRoute = async ({ request }) => {
  try {
    const cartId = readCartIdFromCookie(request.headers.get("cookie"));
    if (!cartId) {
      // No cart yet is not an error; return ok:true, cart:null
      return new Response(JSON.stringify({ ok: true, cart: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const cart = await getCartById(cartId);
    // cart will already have `lines.nodes[...]` shape from our helper's query
    return new Response(JSON.stringify({ ok: true, cart }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
