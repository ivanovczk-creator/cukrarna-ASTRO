# Cukrářství Blahutovi

Professional Astro.js website for a traditional Czech bakery "Cukrářství Blahutovi".

## Features

- Modern, responsive design with Tailwind CSS
- Premium bakery style with Dark Blue (#1e3a8a), Gold (#d4af37), and Cream color scheme
- Product sections for cakes (Dorty) and pastries (Zákusky) with pricing
- Product management via Decap CMS (Netlify CMS)
- B2B partner section for business clients (restaurants, hotels, cafes)
  - Customizable benefits and features
  - Call-to-action button linking to reservation form
- Store locations with Google Maps integration (4 locations: Píšť, Karviná, Ostrava, Petřvald)
- Advanced reservation form with React
- Date validation (minimum 3 days in advance)
- Store-specific closed days blocking:
  - Petřvald: Closed on Monday
  - Karviná & Ostrava: Closed on Sunday
  - Píšť: Closed on Saturday & Sunday
- Form submission via Formspree

## Project Structure

```text
/
├── public/
│   ├── admin/
│   │   ├── index.html       # Decap CMS admin interface
│   │   └── config.yml       # CMS configuration
│   ├── img/
│   │   ├── dorty/           # Cake product images
│   │   └── zakusky/         # Pastry product images
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── ReservationForm.tsx  # React reservation form
│   ├── data/
│   │   ├── products.json    # Product data (managed by CMS)
│   │   └── b2b.json         # B2B section content (managed by CMS)
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

## Setup

1. Install dependencies:
```sh
npm install
```

2. Configure Formspree:
   - Go to [formspree.io](https://formspree.io) and create a free account
   - Create a new form and copy your form ID
   - Open `src/components/ReservationForm.tsx`
   - Replace `'your-form-id'` in the fetch URL with your actual Formspree form ID:
   ```tsx
   const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
   ```

3. Configure Decap CMS (Optional - for content management):
   - Deploy your site to a Git-based hosting service (GitHub, GitLab, Bitbucket)
   - Enable Netlify Identity or another authentication provider
   - Access the CMS at `/admin` after deployment
   - Via CMS you can manage:
     - **Products (Dorty & Zákusky)**: Name, description, price, image
     - **B2B Section**: Title, subtitle, description, benefits list, CTA button text

4. Replace placeholder images:
   - Add your actual product images to `public/img/dorty/` and `public/img/zakusky/`
   - Or keep the placeholder SVG images as-is
   - Images can also be uploaded via the CMS admin interface

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
