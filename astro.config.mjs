import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Technické stránky, které nemají být v sitemap.xml (mají zároveň <meta name="robots" content="noindex, nofollow">).
const SITEMAP_EXCLUDED_PATHS = ['/dekujeme/'];

export default defineConfig({
  // Změna: odstraněno www, aby to odpovídalo realitě v prohlížeči
  site: 'https://cukrarstviblahutovi.cz',
  // Jednotný formát URL s koncovým lomítkem (/dorty/svatebni/) – shodně s adresami v sitemap.xml,
  // s <link rel="canonical"> a s tím, jak Netlify servíruje adresářové stránky (dist/dorty/svatebni/index.html).
  // Verze bez lomítka Netlify automaticky přesměruje 301 na verzi s lomítkem.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    react(),
    tailwind(),
    sitemap({
      filter: (page) => !SITEMAP_EXCLUDED_PATHS.includes(new URL(page).pathname),
    }),
  ],
});
