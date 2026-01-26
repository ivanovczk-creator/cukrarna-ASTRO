import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // Necháme jen react, tailwind vyhodíme, aby to neházelo chybu
  integrations: [react()],
});
