const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

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

function xmlUnescape(value) {
    return value.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

function previousSitemapDates() {
    const sitemapPath = path.join(ROOT, 'sitemap.xml');
    if (!fs.existsSync(sitemapPath)) return new Map();
    const xml = fs.readFileSync(sitemapPath, 'utf8');
    return new Map([...xml.matchAll(/<url>\s*<loc>([\s\S]*?)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>\s*<\/url>/gi)]
        .map((match) => [xmlUnescape(match[1]), match[2]]));
}

function isWorkingTreeModified(file) {
    try {
        return execFileSync('git', ['status', '--short', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim().length > 0;
    } catch {
        return false;
    }
}

const blogPages = fs.readdirSync(path.join(ROOT, 'blogs'))
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => `blogs/${file}`);

const oldDates = previousSitemapDates();
const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(new Date());

const entries = [...FIXED_PAGES, ...blogPages].map((file) => {
    const html = read(file);
    const canonical = firstMatch(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i);
    const modified = firstMatch(html, /"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i);
    const stats = fs.statSync(path.join(ROOT, file));
    const fallbackDate = stats.mtime.toISOString().slice(0, 10);
    const url = canonical || `${SITE}/${file === 'index.html' ? '' : file}`;
    const preservedDate = oldDates.get(url);
    const changedDate = isWorkingTreeModified(file) ? today : preservedDate;
    return { file, url, modified: modified || changedDate || fallbackDate };
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
