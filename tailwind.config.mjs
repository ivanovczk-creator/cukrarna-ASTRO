/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a192f',
          800: '#112240',
        },
        gold: {
          500: '#d4af37',
          600: '#b8860b',
        }
      },
    },
  },
  plugins: [],
};
