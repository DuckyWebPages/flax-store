// src/lib/priceMap.ts
// Map *your* cart SKUs to Stripe Price IDs (NOT product IDs).
// Use Test prices with your test key locally; use Live prices with your live key in prod.
export const PRICE_MAP: Record<string, string> = {
  'fhl-single': 'price_1RwprFEFshq3zxZhtRRrXOjE',// <-- replace with your real Stripe Price ID
  'fhl-bundle': 'price_1RwriPEFshq3zxZhMz3MO2IL', // <-- replace with your real Stripe Price ID
  'ancient-single': 'price_1RwtyoEFshq3zxZhljPpaF3j',// add more as needed...
  'ancient-bundle': 'price_1S4EcgEFshq3zxZhPou8GVyX',// add more as needed...
};
