// FILE: src/pages/api/cart-set-qty.ts
import type { APIRoute } from "astro";
import {
  readCartIdFromCookie,
  updateLineQuantity,
  getCartById,
} from "@/lib/shopify.server";
import { getVariantInventoryByHandle } from "@/lib/shopify-inventory";

export const POST: APIRoute = async ({ request }) => {
  try {
    const cartId = readCartIdFromCookie(request.headers.get("cookie"));
    if (!cartId) {
      return new Response(JSON.stringify({ ok: false, error: "No cart." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { lineId, quantity, handle, variantId } = await request.json();
    if (!lineId) throw new Error("Missing lineId");

    const raw = Number(quantity ?? 1);
    const qty = Number.isFinite(raw) ? raw : 1;

    // --- 🗑 Remove line when qty <= 0 ---
    if (qty <= 0) {
      await updateLineQuantity(cartId, lineId, 0);
      const cart = await getCartById(cartId);
      return new Response(
        JSON.stringify({ ok: true, cart, message: null }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    // --- 🟡 Inventory check for positive quantities ---
    let message: string | null = null;
    if (handle) {
      try {
        const variants = await getVariantInventoryByHandle(handle);

        // pick the correct variant if we know its ID, otherwise fall back to the first
        const variant =
          (variantId &&
            variants.find((v: any) => v.id === variantId)) ||
          variants[0];

        if (variant && typeof variant.quantityAvailable === "number") {
          const available = variant.quantityAvailable;
          console.log(
            "[cart-set-qty] stock check",
            handle,
            "variant",
            variant.id,
            "available=",
            available,
            "requested=",
            qty,
          );
          if (qty > available) {
            // Clamp to max stock
            await updateLineQuantity(cartId, lineId, available);
            const cart = await getCartById(cartId);
            message =
              "This product is almost out of stock. You can’t add more than we currently have, but more is on the way!";
            return new Response(
              JSON.stringify({ ok: true, cart, message }),
              {
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                },
              },
            );
          }
        }
      } catch (err) {
        console.warn("[cart-set-qty] inventory check failed", err);
      }
    }

    // --- Normal flow if stock OK ---
    await updateLineQuantity(cartId, lineId, qty);
    const cart = await getCartById(cartId);

    return new Response(
      JSON.stringify({ ok: true, cart, message }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
