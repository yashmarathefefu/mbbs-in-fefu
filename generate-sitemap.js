const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://mbbsabroads.com';
const FIXED_PAGES = ['index.html', 'blog.html', 'gallery.html', 'editorial-policy.html', 'privacy.html', 'terms.html'];

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function firstMatch(html, pattern) {
    return (html.match(pattern) || [])[1] || '';
}

function xmlEscape(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const blogPages = fs.readdirSync(path.join(ROOT, 'blogs'))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => `blogs/${file}`);

const entries = [...FIXED_PAGES, ...blogPages].map((file) => {
    const html = read(file);
    const canonical = firstMatch(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i);
    const modified = firstMatch(html, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i);
    const stats = fs.statSync(path.join(ROOT, file));
    const fallbackDate = stats.mtime.toISOString().slice(0, 10);
    return { file, url: canonical || `${SITE}/${file === 'index.html' ? '' : file}`, modified: modified || fallbackDate };
});

const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.flatMap(({ url, modified }) => [
        '    <url>',
        `        <loc>${xmlEscape(url)}</loc>`,
        `        <lastmod>${modified}</lastmod>`,
        '    </url>'
    ]),
    '</urlset>',
    ''
];

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), lines.join('\n'));
console.log(`Generated sitemap.xml with ${entries.length} canonical URLs.`);
