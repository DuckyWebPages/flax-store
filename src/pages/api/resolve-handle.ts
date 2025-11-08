// FILE: src/pages/api/resolve-handle.ts
import type { APIRoute } from "astro";
import { resolveVariantIdByHandle } from "@/lib/shopify.server";

export const GET: APIRoute = async ({ url }) => {
  const handle = String(url.searchParams.get("handle") || "").trim();
  if (!handle) return new Response(JSON.stringify({ ok:false, error:"Missing handle" }), { status:400 });
  try {
    const variantId = await resolveVariantIdByHandle(handle);
    return new Response(JSON.stringify({ ok:true, handle, variantId }), { status:200 });
  } catch (e:any) {
    return new Response(JSON.stringify({ ok:false, handle, error:String(e?.message||e) }), { status:404 });
  }
};
