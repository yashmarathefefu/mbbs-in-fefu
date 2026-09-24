const fs = require('fs');
const path = require('path');

const SITE = 'https://mbbsabroads.com';
const ROOT = __dirname;
const BLOG_DIR = path.join(ROOT, 'blogs');

const htmlFiles = [
    'index.html',
    'blog.html',
    'gallery.html',
    'privacy.html',
    'terms.html',
    ...fs.readdirSync(BLOG_DIR)
        .filter((file) => file.endsWith('.html'))
        .map((file) => `blogs/${file}`)
];

const errors = [];
const warnings = [];
const checkedUrls = new Map();

function read(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function cleanText(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function collectUrls(value, urls = []) {
    if (!value) return urls;
    if (typeof value === 'string') {
        if (/^https?:\/\//i.test(value)) urls.push(value);
        return urls;
    }
    if (Array.isArray(value)) {
        value.forEach((item) => collectUrls(item, urls));
        return urls;
    }
    if (typeof value === 'object') {
        Object.values(value).forEach((item) => collectUrls(item, urls));
    }
    return urls;
}

async function checkUrl(url) {
    if (checkedUrls.has(url)) return checkedUrls.get(url);

    const result = { url, ok: false, status: 0, error: '' };
    try {
        let response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: AbortSignal.timeout(12000)
        });

        if ([403, 405, 500].includes(response.status)) {
            response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                signal: AbortSignal.timeout(12000)
            });
        }

        result.status = response.status;
        result.ok = response.status >= 200 && response.status < 400;
    } catch (error) {
        result.error = error.message;
    }

    checkedUrls.set(url, result);
    return result;
}

async function checkSitemap() {
    const sitemap = read('sitemap.xml');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const seen = new Set();

    for (const loc of locs) {
        if (seen.has(loc)) errors.push(`Duplicate sitemap URL: ${loc}`);
        seen.add(loc);

        if (loc.endsWith('/index.html')) {
            errors.push(`Sitemap should not list duplicate homepage URL: ${loc}`);
        }

        const result = await checkUrl(loc);
        if (!result.ok) {
            errors.push(`Sitemap URL is not reachable: ${result.status || result.error} ${loc}`);
        }
    }
}

async function checkHtmlFile(file) {
    const html = read(file);
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || '';
    const description = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
    const canonical = (html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i) || [])[1] || '';
    const robots = (html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i) || [])[1] || '';
    const noindex = /\bnoindex\b/i.test(robots);
    const h1Count = [...html.matchAll(/<h1\b[^>]*>/gi)].length;
    const words = cleanText(html).split(/\s+/).filter(Boolean).length;

    if (!title) errors.push(`${file}: missing <title>`);
    if (title.length > 65) warnings.push(`${file}: title is long (${title.length} chars)`);
    if (!description) errors.push(`${file}: missing meta description`);
    if (description.length > 165) warnings.push(`${file}: meta description is long (${description.length} chars)`);
    if (!canonical) errors.push(`${file}: missing canonical URL`);
    if (h1Count !== 1) errors.push(`${file}: expected exactly one H1, found ${h1Count}`);
    if (!noindex && words < 300) warnings.push(`${file}: low visible word count (${words})`);

    const jsonBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (let index = 0; index < jsonBlocks.length; index += 1) {
        let data;
        try {
            data = JSON.parse(jsonBlocks[index][1].trim());
        } catch (error) {
            errors.push(`${file}: invalid JSON-LD block ${index + 1}: ${error.message}`);
            continue;
        }

        for (const url of collectUrls(data)) {
            if (!url.startsWith(SITE)) continue;
            const result = await checkUrl(url);
            if (!result.ok) {
                errors.push(`${file}: structured data URL is not reachable: ${result.status || result.error} ${url}`);
            }
        }
    }

    const externalAnchors = [...html.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi)]
        .map((match) => match[1])
        .filter((url) => !url.startsWith(SITE));

    for (const url of externalAnchors) {
        const result = await checkUrl(url);
        if (result.status >= 400 && result.status !== 402) {
            errors.push(`${file}: broken external link: ${result.status} ${url}`);
        } else if (!result.ok) {
            warnings.push(`${file}: external link could not be verified: ${result.error} ${url}`);
        }
    }
}

(async () => {
    await checkSitemap();
    for (const file of htmlFiles) {
        await checkHtmlFile(file);
    }

    console.log(`SEO check scanned ${htmlFiles.length} HTML files and ${checkedUrls.size} unique URLs.`);

    if (warnings.length) {
        console.log('\nWarnings:');
        warnings.forEach((warning) => console.log(`- ${warning}`));
    }

    if (errors.length) {
        console.error('\nErrors:');
        errors.forEach((error) => console.error(`- ${error}`));
        process.exit(1);
    }

    console.log('No blocking SEO errors found.');
})();
