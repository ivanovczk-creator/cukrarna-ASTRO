import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Změna: odstraněno www, aby to odpovídalo realitě v prohlížeči
  site: 'https://cukrarstviblahutovi.cz', 
  integrations: [
    react(), 
    tailwind(),
    sitemap()
  ],
});
