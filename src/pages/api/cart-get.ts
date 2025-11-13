// FILE: src/pages/api/cart-get.ts
import type { APIRoute } from "astro";
import {
  readCartIdFromCookie,
  getCartById,
} from "@/lib/shopify.server";

export const GET: APIRoute = async ({ request }) => {
  try {
    const cookie = request.headers.get("cookie");
    const cartId = readCartIdFromCookie(cookie);

    // 🛑 No cart yet — return empty cart instead of calling Shopify with null
    if (!cartId) {
      return new Response(
        JSON.stringify({ ok: true, cart: null }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const cart = await getCartById(cartId);

    return new Response(
      JSON.stringify({ ok: true, cart }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e: any) {
    console.error("[api/cart-get] error", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
