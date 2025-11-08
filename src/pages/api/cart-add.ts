// FILE: src/pages/api/cart-add.ts
import type { APIRoute } from "astro";
import {
  addLineToCart,
  createCart,
  readCartIdFromCookie,
  resolveVariantIdByHandle,
  setCartIdCookie,
} from "@/lib/shopify.server";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const handle = String(body.handle || "").trim();
    const quantity = Math.max(1, Number(body.quantity || 1));

    if (!handle) {
      return new Response(JSON.stringify({ ok: false, error: "Missing 'handle'." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Resolve variant from handle
    const merchandiseId = await resolveVariantIdByHandle(handle);

    // Ensure cart
    let cartId = readCartIdFromCookie(request.headers.get("cookie"));
    let checkoutUrl: string | null = null;

    if (!cartId) {
      const created = await createCart();
      cartId = created.cartId;
      checkoutUrl = created.checkoutUrl;
    }

    // Add line
    const added = await addLineToCart({ cartId, merchandiseId, quantity });

    // Persist/refresh cookie
    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", setCartIdCookie(added.cartId));

    return new Response(
      JSON.stringify({
        ok: true,
        cartId: added.cartId,
        checkoutUrl: added.checkoutUrl || checkoutUrl,
        linesCount: added.linesCount,
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
