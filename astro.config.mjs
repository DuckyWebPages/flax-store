// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel/serverless'; // needed for /api/checkout

export default defineConfig({
  output: 'server',      // API routes require server output
  adapter: vercel(),
  integrations: [react()],
});
