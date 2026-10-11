const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUTPUT = path.join(ROOT, 'dist');
const EXCLUDED_DIRECTORIES = new Set([
    '.agents',
    '.codex',
    '.cursor',
    '.git',
    '.github',
    'dist',
    'node_modules',
    'pagefind',
    'scratch'
]);
const EXCLUDED_FILES = new Set([
    '.gitignore',
    'CNAME',
    'README.md',
    'build-site.js',
    'fix_logos.py',
    'generate-blog-index.js',
    'generate-sitemap.js',
    'package-lock.json',
    'package.json',
    'seo-check.js',
    'seo-refresh-once.js',
    'test-links.js',
    'vercel.json'
]);

fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });

for (const name of fs.readdirSync(ROOT)) {
    if (EXCLUDED_DIRECTORIES.has(name) || EXCLUDED_FILES.has(name)) continue;

    fs.cpSync(path.join(ROOT, name), path.join(OUTPUT, name), {
        recursive: true,
        filter(source) {
            const relative = path.relative(ROOT, source);
            const topLevel = relative.split(path.sep)[0];
            return !EXCLUDED_DIRECTORIES.has(topLevel) && !EXCLUDED_FILES.has(relative);
        }
    });
}

console.log(`Prepared static website in ${path.relative(ROOT, OUTPUT)}.`);
