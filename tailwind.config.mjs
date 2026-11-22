/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Neutrální tmavá paleta: používáme výchozí Tailwind `zinc`
        //   zinc-900 = #18181b (hlavní tmavá: texty, hlavička, patička)
        //   zinc-800 = #27272a (jemnější tmavý tón)
        // Hlavní akcentní barva webu – žlutá z loga/Instagramu.
        // 500 = výplně a zvýraznění (na ní vždy tmavý text zinc-900),
        // 700 = žlutý text/odkazy na světlém pozadí (kontrast ≥ 6:1 na bílé).
        gold: {
          50: '#fff9e0',
          400: '#f6d155',
          500: '#f0c030',
          600: '#c99a12',
          700: '#7a5a00',
        }
      },
    },
  },
  plugins: [],
};
