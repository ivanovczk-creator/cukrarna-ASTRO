import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Základní URL pro generování sitemapy a absolutních odkazů
  site: 'https://www.cukrarstviblahutovi.cz',
  
  integrations: [
    react(), 
    tailwind(),
    sitemap()
  ],

  // Optimalizace obrázků - zajistí správné zpracování assetů
  image: {
    domains: ['www.cukrarstviblahutovi.cz'],
  },

  // Vynucení výstupu do statických souborů (vhodné pro Netlify/GitHub Pages)
  output: 'static'
});
