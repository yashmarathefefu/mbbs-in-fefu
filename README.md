# FEFU Admissions Website

Static website for an FEFU-only consultancy that helps students pursuing General Medicine (commonly called MBBS) in Russia. The service supports the application process, required paperwork, and visa documents. Do not imply that the consultancy can guarantee admission or visa approval.

## Project

- `index.html` — homepage and admission information
- `styles.css` and the section stylesheets — site styling and responsive layouts
- Root JavaScript files and `components/` — navigation, forms, animation, and page interactions
- `blogs/`, `blog.html`, and `blog-post.html` — student information articles
- `assets/`, `icon/`, and `hostel-animation/` — site imagery and icons

The site is served as static files; there is no frontend build step.

## Local preview

Requires Node.js and npm.

```sh
npm ci
npm start
```

Open `http://localhost:8080` in a browser.

## Checks

```sh
npm test
npm run seo
```

`npm test` checks the gallery's remote Supabase image URLs. `npm run seo` checks page metadata and links in the sitemap against the live site, so it needs network access and may not pass for a page before that page has been published.

GitHub Actions runs `npm test` for pull requests and pushes to `main`. Production is served by Vercel from the GitHub repository.
