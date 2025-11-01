import type { APIRoute } from "astro";
import { getInventory } from "@/lib/db"; // from our updated helper

// List the SKUs you care about
const SKUS = [
  "fhl-single",
  "aftershot",
  "aftershot-3pak",
  "ancient-single",
  "ocean-cleanse-single",
  "essiac-tea",
  "ningxia-nitro",
  "methylene-blue",
  "lavender-15ml",
  "thieves-15ml",
  "peppermint-15ml",
  "orange-15ml",
  "grapefruit-15ml",
  "tea-tree-15ml",
  "sacred-frankincense-5ml",
  "panaway-5ml",
  "idaho-blue-spruce-5ml",
   "dandelion-tea",
   "hibiscus-tea",
   "BLM",
   "Sulfurzyme",

];

export const get: APIRoute = async () => {
  const map = await getInventory(SKUS);
  // Shape it for UI: if backorder=true, show "infinite"
  const out: Record<string, number | string> = {};
  for (const sku of SKUS) {
    const row = map[sku];
    if (!row) continue;
    out[sku] = row.backorder ? "infinite" : row.stock;
  }
  return new Response(JSON.stringify(out, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
