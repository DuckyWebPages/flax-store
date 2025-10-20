// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless'; // ✅ use the serverless adapter
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  output: 'server',         // ✅ required for server/SSR on Vercel
  adapter: vercel(),        // ✅ serverless runtime
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 🚫 keep Tailwind out of Vite plugins here (we're using the @tailwindcss/vite package already)
  },
});
