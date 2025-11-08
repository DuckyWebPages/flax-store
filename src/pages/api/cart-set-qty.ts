// FILE: src/pages/api/cart-set-qty.ts
import type { APIRoute } from "astro";
import { readCartIdFromCookie, updateLineQuantity, getCartById } from "@/lib/shopify.server";

export const POST: APIRoute = async ({ request }) => {
  try {
    const cartId = readCartIdFromCookie(request.headers.get("cookie"));
    if (!cartId) {
      return new Response(JSON.stringify({ ok: false, error: "No cart." }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }
    const { lineId, quantity } = await request.json();
    if (!lineId) throw new Error("Missing lineId");
    const qty = Math.max(1, Number(quantity || 1));

    await updateLineQuantity(cartId, lineId, qty);
    const cart = await getCartById(cartId);

    return new Response(JSON.stringify({ ok: true, cart }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
