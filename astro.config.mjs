// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless'; // Node runtime (Stripe-friendly)

export default defineConfig({
  output: 'server',   // required for API routes like /api/checkout
  adapter: vercel(),
  // integrations: [], // keep/add any integrations you use
});
