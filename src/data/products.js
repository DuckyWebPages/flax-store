// src/data/products.js

export const products = [
  // --- Flax Hull Lignans (Standard) ---
  {
    name: "Flax Hull Lignan (Single Jar)",
    description:
      "Original MCP-processed flax hull lignans (no chemical extraction). One jar lasts ~30 days (30 servings). Supports brain, prostate, digestive, and breast tissue; very high in antioxidants (ORAC 19,600). ~8% oil (≈55% ALA); ~110mg ALA per 2.5g serving; ~2.1g fiber and ~1.4g protein per scoop.",
    price: 39.00,
    image: "/images/flaxlignan-single-2025.jpg",
    stripePaymentLink: "https://buy.stripe.com/test_8x200j2r8aAugaM3iK7EQ01"
  },

  {
    name: "Flax Hull Lignan (3 jar bundle)",
    description:
      "Save with 3 jars at $37.50 each. One jar lasts ~30 days (30 servings). Extracted via the MCP Process (no chemicals). Supports brain, prostate, digestive and breast tissue; very high in antioxidants (ORAC 19,600). ~8% oil (≈55% ALA); ~110mg ALA per 2.5g serving; ~2.1g fiber and ~1.4g protein per scoop.",
    price: 112.50,
    image: "/images/flaxlignans-3jars-2025.jpg",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_fhl_3jar_bundle"
  },

  // --- Ancient Seeds & Grains Certified Line ---
  {
    name: "FHL Flax Hull Lignans (Ancient Seeds & Grains Certified)",
    description:
      "MCP-processed, highest-grade lignans from Ancient Seeds & Grains Certified flax (no GMO flax). A stricter standard than typical organic (which can allow up to 8% GMO cross-pollination).",
    price: 45.00,
    image: "/images/ancientseeds-sideshot-1jar-2025.jpg",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_fhl_ancient_single"
  },
  {
    name: "FHL Flax Hull Lignans (Ancient Seeds & Grains Certified) — 3 Jar Bundle",
    description:
      "Save when you purchase three jars (save $1 per jar). Ancient Seeds & Grains Certified (no GMOs). Manufacturer avoids GMO sources for commercial lignans too, but only this line is explicitly purchased as Non-GMO.",
    price: 132.00,
    image: "/images/ancientseeds-3jars-2025.jpg",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_fhl_ancient_3jar"
  },

  // --- Aftershot Zeolite ---
  {
    name: "Aftershot Micronized Zeolite — Natural Chelation & Detoxifier",
    description:
      "Micronized, cleansed zeolite paired with humic/fulvic acids for systemic detox support. Negatively charged, cage-like structure binds positively charged toxins (mercury first, then lead, etc.) and escorts them out via urine. Also captures free radicals within the cage.",
    price: 19.99,
    image: "/images/aftershot-single-2025.jpg",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_aftershot_single"
  },
  {
    name: "Aftershot 3-Pack — Natural Chelation & Detoxifier",
    description:
      "Three-bottle value bundle. Same micronized zeolite + humic/fulvic pairing designed for circulation (not just the gut). Binds toxic metals and residues; captures free radicals for safe elimination.",
    price: 49.99,
    image: "/images/Aftershot3.png",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_aftershot_3pack"
  },

  // --- Ocean Cleanse ---
  {
    name: "Ocean Cleanse — Detoxification & Radiation Removal (90 capsules)",
    description:
      "Concentrated brown seaweed extract (originally developed to help Chernobyl victims). May support immune function, thyroid health (organic iodine), healthy blood sugar and weight (fucoxanthin 10 mg/cap), cardiovascular health (laminarin), and binding of heavy metals/radioactive elements (alginate).",
    price: 34.95,
    image: "/images/ocean-cleanse-single-2025.jpg",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_ocean_cleanse"
  },

  // --- Essiac Tea (with expandable longDescription) ---
  {
    name: "Essiac Tea (Eight-Herb, True Recipe)",
    description:
      "The eight-herb recipe endorsed through Dr. Charles Brusch’s lineage (not the common four-herb version). Powdered organic herbs for a more potent brew.",
    longDescription: `
This is a very famous tea that is hard to find in the true recipe. Without knowing the history of Nurse Caisse and her success helping thousands, you can be duped into buying the wrong recipe. The widely touted “original, from Canada” is a 4-herb version—her early formula—not the improved 8-herb formula developed with Dr. Charles Brusch. Our Essiac comes directly from the family who received the recipe from Dr. Brusch—endorsed by Nurse Caisse.

Ingredients:
Blessed Thistle, Burdock Root, Kelp, Red Clover, Sheep Sorrel, Slippery Elm Bark, Turkish Rhubarb Root, Watercress.

Instructions (Aggressive Dose; makes ~1 gallon concentrate):
1) Bring 132 oz (1 gal + 4 oz for evaporation) of spring/distilled water to a boil; reduce to simmer.
2) Add 4 oz (113 g) of the powdered herb blend (weigh on a kitchen scale).
3) Simmer 10 min with lid mostly closed; stir occasionally.
4) Turn off heat, cover fully, and let sit 12 hours at room temp.
5) Stir vigorously to disperse herb particles (do NOT strain); funnel into clean containers. Refrigerate. Use within ~14 days. Shake well before pouring. Take on an empty stomach when possible.

Maintenance Dose (2-week supply):
• Boil 88 oz water; add 2.67 oz herbs (≈ rounded 1/2 cup if you must measure by volume).

Single-Quart Brew:
• Boil 36 oz water; add 1 oz herbs (≈ 1/4 cup by volume).

General Notes & FAQ (condensed):
• Not a drug; not FDA-approved for disease. Many use Essiac to support detox and immune resilience.
• Often taken alongside conventional or alternative therapies; consult your practitioner.
• Start slowly if you experience GI irritation/loose stools (detox sign for some).
• Use organic powdered herbs to maximize surface area/potency; do NOT strain.
• Store brewed tea refrigerated; brew fresh every ~2 weeks.
• We include dosing/brewing instructions with orders. Return policy: unopened within 30 days; damaged items replaced—contact customer service for RMA.`.trim(),
    price: 40.50,
    image: "/images/ESSIAC3.png",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_essiac_tea"
  }
];
