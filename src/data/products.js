// src/data/products.js

export const products = [
  {
    name: "Flax Oil Capsules",
    description: "Cold-pressed flax oil capsules rich in lignans to support immune health and balanced hormones.",
    price: 29.99,
    image: "/images/flax-oil-capsules.jpg", // place this image in your /public/images folder
    stripePaymentLink: "https://buy.stripe.com/test_3cI28r2r80ZU3o01aC7EQ00" // replace with your real Stripe link
  },
  {
    name: "Lignan Powder",
    description: "Organic flax lignan powder, rich in antioxidants to support cellular health.",
    price: 19.99,
    image: "/images/lignan-powder.jpg", // place this image in your /public/images folder
    stripePaymentLink: "https://buy.stripe.com/test_67890"
  },
  {
    name: "Flax Health Bundle",
    description: "Bundle of flax capsules + lignan powder for comprehensive immune and hormone support.",
    price: 44.99,
    image: "/images/flax-bundle.jpg", // place this image in your /public/images folder
    stripePaymentLink: "https://buy.stripe.com/test_ABCDE"
  }
];
