// src/data/products.js

/** @typedef {{
 *   id: string;
 *   name: string;
 *   description: string;
 *   longDescription?: string;
 *   price: number;         // display only; real price comes from Shopify
 *   image: string;         // /public/images path (case-sensitive on Vercel)
 *   shopifyHandle: string; // Shopify product.handle (slug)
 *   storefrontVariantId?: string; // gid://shopify/ProductVariant/... (optional if single variant)
 * }} Product */

/** @type {Product[]} */
export const products = [
  {
    id: "flax-single",
    name: "Flax Hull Lignans",
    description:
      "Original MCP-processed flax hull lignans (no chemical extraction). One jar lasts ~30 days...",
    price: 39.0,
    image: "/images/flaxlignan-single-2025.jpg",
    shopifyHandle: "flax-hull-lignans",
    // storefrontVariantId: "gid://shopify/ProductVariant/1234567890" // optional
  },
  {
    id: "flax-3pack",
    name: "Flax Hull Lignan (3 jar bundle)",
    description: "Save with 3 jars at $37.50 each...",
    price: 112.5,
    image: "/images/flaxlignans-3jars-2025.jpg",
    shopifyHandle: "flax-hull-lignans-3-pack"
  },
  {
    id: "flax-subscription",
    name: "Flax Hull Lignan Monthly Subscription",
    description: "Automatic monthly supply.",
    price: 37.0,
    image: "/images/12jars0001.jpg",
    shopifyHandle: "flax-hull-lignans-subscription" // Hide this until you install a Shopify subscriptions app.
  },
  {
    id: "ancient-single",
    name: "FHL Flax Hull Lignans (Ancient Seeds & Grains Certified)",
    description: "Ancient Seeds & Grains certified line.",
    price: 45.0,
    image: "/images/ancientseeds-sideshot-1jar-2025.jpg",
    shopifyHandle: "ancient-seeds-and-grains-certified-flax-hull-lignans"
  },
  {
    id: "ancient-3pack",
    name: "FHL Flax Hull Lignans — 3 Jar Bundle (Ancient)",
    description: "Save when you purchase three jars.",
    price: 132.0,
    image: "/images/ancientseeds-3jars-2025.jpg",
    shopifyHandle: "ancient-seeds-and-grains-certified-3-pack"
  },
  {
    id: "aftershot-single",
    name: "Aftershot Micronized Zeolite — Natural Chelation & Detoxifier",
    description: "Micronized zeolite + humic/fulvic acids.",
    price: 19.99,
    image: "/images/aftershot-single-2025.jpg",
    shopifyHandle: "aftershot-micronized-zeolite"
  },
  {
    id: "aftershot-3pack",
    name: "Aftershot 3-Pack — Natural Chelation & Detoxifier",
    description: "Three-bottle value bundle.",
    price: 49.99,
    image: "/images/Aftershot3.png",
    shopifyHandle: "aftershot-3-pack"
  },
  {
    id: "ocean-cleanse",
    name: "Ocean Cleanse — Detoxification & Radiation Removal (90 capsules)",
    description: "Concentrated brown seaweed extract.",
    price: 34.95,
    image: "/images/ocean-cleanse-single-2025.jpg",
    shopifyHandle: "ocean-cleanse"
  },
  {
    id: "essiac",
    name: "Essiac Tea (Eight-Herb, True Recipe)",
    description: "Eight-herb recipe from the Brusch lineage.",
    longDescription: "…",
    price: 40.5,
    image: "/images/ESSIAC3.png",
    shopifyHandle: "essiac-tea-eight-herb"
  }
];
