# FEFU Admissions Website

Static website for an independent consultancy focused only on FEFU General Medicine for Indian students. Its owner-confirmed support spans application and admission guidance, invitation-letter coordination, visa application and document help, travel arrangements, coordination for FEFU-provided accommodation, arrival and on-ground help, forex guidance, and post-arrival university settlement. Do not imply official FEFU appointment or representation, or promise admission, visa issuance, room assignment, travel availability, exchange rates, academic results, or licensing outcomes. Disclose one consultancy fee in a written agreement and identify FEFU and third-party charges separately.

## Project

- `index.html` — homepage and admission information
- `styles.css` and the section stylesheets — site styling and responsive layouts
- Root JavaScript files and `components/` — navigation, forms, animation, and page interactions
- `blogs/`, `blog.html`, and `blog-post.html` — student information articles
- `assets/`, `icon/`, and `hostel-animation/` — site imagery and icons

The site is served as static files. A small Node build step copies public files into `dist/` and generates the Pagefind search index for the blog articles.

## Local preview

Requires Node.js and npm.

```sh
npm ci
npm run build
npm start
```

Open `http://localhost:8080` in a browser.

The build creates the Pagefind full-text index used by the blog search. Vercel runs the same build before deploying.

## Checks

```sh
npm test
npm run seo
```

`npm test` checks the gallery's remote Supabase image URLs. `npm run seo` checks page metadata and links in the sitemap against the live site, so it needs network access and may not pass for a page before that page has been published.

GitHub Actions runs `npm test` for pull requests and pushes to `main`. Production is served by Vercel from the GitHub repository.
