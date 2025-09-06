// Map your cart's item IDs -> Stripe Price IDs
// LEFT side (keys) must match your data-sku in the add-to-cart buttons exactly.
export const PRICE_MAP: Record<string, string> = {
  'fhl-single': 'price_1RwprFEFshq3zxZhtRRrXOjE',// <-- replace with your real Stripe Price ID
  'fhl-bundle': 'price_1RwriPEFshq3zxZhMz3MO2IL', // <-- replace with your real Stripe Price ID
  'ancient-single': 'price_1RwtyoEFshq3zxZhljPpaF3j',// add more as needed...
  'ancient-bundle': 'price_1S4EcgEFshq3zxZhPou8GVyX',// add more as needed...
};
