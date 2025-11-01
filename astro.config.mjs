// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';   // ✅ root import (not /serverless)
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // 👇 lock the dev server port
  server: { port: 4325, strictPort: true },

  output: 'server',          // SSR on Vercel
  adapter: vercel(),         // ✅ Vercel adapter
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // no extra vite plugins here
  },
});
