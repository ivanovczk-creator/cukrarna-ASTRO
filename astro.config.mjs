import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap'; // 1. Musíme přidat tento import

export default defineConfig({
  // 2. TENTO ŘÁDEK JE KLÍČOVÝ - bez něj sitemapa nevznikne
  site: 'https://www.cukrarstviblahutovi.cz', 
  integrations: [
    react(), 
    tailwind(),
    sitemap() // 3. Přidáme sitemapu do seznamu integrací
  ],
});
