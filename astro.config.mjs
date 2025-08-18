// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(), // serverless on Vercel (Node runtime)
  server: { port: 4321 }, // optional local dev convenience
});
