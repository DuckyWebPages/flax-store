// src/data/products.ts
export type Product = {
  id: string;
  name: string;
  price: number;           // display only (Stripe handles real price)
  image: string;           // e.g., "/images/flax-16oz.jpg"
  description: string;
  stripePaymentLink?: string; // paste Stripe Payment Link here
};

export const products: Product[] = [
  {
    id: "flax-16oz",
    name: "Flax Lignan Powder (16 oz)",
    price: 39.99,
    image: "/images/flax-16oz.jpg",
    description: "Cold-milled flax hull lignans to support immune health.",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_ME_1"
  },
  {
    id: "flax-caps",
    name: "Flax Lignan Capsules (120 ct)",
    price: 34.99,
    image: "/images/flax-capsules.jpg",
    description: "Convenient capsules with standardized lignan content.",
    stripePaymentLink: "https://buy.stripe.com/REPLACE_ME_2"
  }
];

