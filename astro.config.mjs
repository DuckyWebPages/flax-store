import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  adapter: vercel(),
  integrations: [react()],              // ✅ re-enable React/TSX
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)), // ✅ alias stays
      },
    },
  },
});
