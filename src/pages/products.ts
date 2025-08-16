// src/data/products.ts
export type Product = {
  id: string;
  name: string;
  price: number;            // display only (Stripe handles real price)
  image: string;            // e.g., "/images/flaxlignan-single-2025.jpg"
  description: string;      // plain text or Markdown-friendly text
  stripePaymentLink?: string; // Stripe Checkout link (test_ for sandbox, no test_ for live)
};

export const products: Product[] = [
  {
    id: "Flax-singlejar",
    name: "Flax Hull Lignans (5.3oz jar)",
    price: 39.00,
    image: "/images/flaxlignan-single-2025.jpg",
    description: `Strengthen your immune system from within with the concentrated superfood extract Flax Hull Lignans.

These are the “Original” Flax Hull Lignans used in trials worldwide and especially to help immune system challenged children in 3rd world countries.

Lignans are extracted through the “MCP Process” which guarantees no chemicals used during the extraction process.

Flax Hull Lignans support multiple body systems, especially brain, prostate, digestive and breast tissue. They are very high in anti-oxidants, with an ORAC value of 19,600!
They are tiny particles found in the shell of flax seed, extracted and concentrated.

FHL is 8% oil and fat, and 55% of that fat is ALA (Alpha-Linolenic Acid). If a person were to consume 2.5g (3/4 tsp) daily of FHL, they would be consuming approximately 110mg ALA (the daily recommended amount for women; slightly less than for men).

There is 2.1g of dietary fiber and 1.4g of protein in each scoop of Flax Hull Lignans.

There are no chemicals used in extracting the lignans from the shell and therefore, no chemicals in our Flax Hull Lignans! (Note: ALL liquid forms of Flax Hull Lignans use chemical extraction and should be avoided.)

One 5.3oz jar is a one-month supply for adults, two-month supply for children.`,
    // Use a Stripe TEST link while developing (starts with /test_). Replace with live before launch.
    stripePaymentLink: "https://buy.stripe.com/test_REPLACE_ME_1"
  },

  // 👉 Add additional products below, in the order you want them to appear.
];


