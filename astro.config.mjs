// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel'; // <-- changed: no "/serverless"
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  output: 'server',
  adapter: vercel(), // let Vercel set the correct runtime (Node 22 via settings)
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  },
});

