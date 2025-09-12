import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, now: Date.now() }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
