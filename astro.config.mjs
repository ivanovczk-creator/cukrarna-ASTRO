import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// Nyní bezpečně integrujeme Tailwind přímo do sestavení webu
export default defineConfig({
  integrations: [
    react(), 
    tailwind()
  ],
});
