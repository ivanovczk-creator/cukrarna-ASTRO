/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Neutrální tmavá: výchozí Tailwind `zinc` (zinc-900 = #18181b), texty obsahu #1f1f1f.
        // Teplé krémové pozadí stránek (karty zůstávají bílé).
        cream: {
          DEFAULT: '#faf7f2',
          100: '#f4efe6',
          200: '#ebe4d6',
          300: '#ddd4c0',
        },
        // Tlumená starorůžová pro panely (hlavička, patička, nadpisové bloky).
        // Na 300/400 vždy tmavý text #1f1f1f; na 100 tmavý text nebo berry-700.
        blush: {
          100: '#f6e3e0',
          200: '#ecc6c2',
          300: '#d49a96',
          400: '#c9827e',
        },
        // Sytá malinově červená pro CTA a aktivní prvky (600 = bílý text, 700 = hover/text na světlém).
        berry: {
          600: '#b83b46',
          700: '#992d37',
        },
      },
    },
  },
  plugins: [],
};
