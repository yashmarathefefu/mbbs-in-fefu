const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BLOG_DIR = path.join(ROOT, 'blogs');
const BLOG_FILE = path.join(ROOT, 'blog.html');

function text(html, pattern) {
    return ((html.match(pattern) || [])[1] || '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function categoryFor(file) {
    if (/fmge|nmc|valid-in-india|neet|next/.test(file)) return { key: 'fmge', label: 'NMC / FMGE', icon: 'file-check-2', cover: 'is-safety' };
    if (/\b(vs|versus)\b/.test(file)) return { key: 'comparisons', label: 'Comparison', icon: 'git-compare', cover: 'is-admissions' };
    if (/safe|hostel|campus-life/.test(file)) return { key: 'safety', label: 'Safety & Campus', icon: 'shield-check', cover: 'is-safety' };
    if (/fee|cost|budget/.test(file)) return { key: 'fees', label: 'Fees & Eligibility', icon: 'badge-indian-rupee', cover: 'is-fees' };
    if (/admission|document|deadline|timeline|entrance|visa|scholarship/.test(file)) return { key: 'admissions', label: 'FEFU Admission', icon: 'file-check-2', cover: 'is-admissions' };
    return { key: 'fefu-guide', label: 'FEFU Guide', icon: 'book-open-check', cover: 'is-fefu' };
}

const articles = fs.readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.html'))
    .map((file) => {
        const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
        const title = text(html, /<title>([\s\S]*?)<\/title>/i).replace(/\s*\|\s*MBBS Abroads.*$/i, '');
        const description = text(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)/i);
        const canonical = text(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']*)/i);
        const published = text(html, /"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i) || '2026-01-01';
        const visible = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
        const minutes = Math.max(4, Math.ceil(visible.trim().split(/\s+/).length / 200));
        return { file, title, description, canonical, published, minutes, category: categoryFor(file) };
    })
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));

const cards = articles.map(({ file, title, description, published, minutes, category }) => {
    const date = new Date(`${published}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    return `                    <a href="blogs/${file}" class="blog-card-link" data-category="${category.key}" aria-label="Read ${escapeHtml(title)}">
                        <article class="blog-card">
                            <div class="blog-card-cover ${category.cover}">
                                <span class="blog-card-kicker"><i data-lucide="${category.icon}"></i> ${category.label}</span>
                            </div>
                            <div class="blog-card-content">
                                <div class="blog-card-meta">
                                    <span><i data-lucide="calendar"></i> ${date}</span>
                                    <span><i data-lucide="clock-3"></i> ${minutes} min read</span>
                                </div>
                                <h2 class="blog-title">${escapeHtml(title)}</h2>
                                <p class="blog-excerpt">${escapeHtml(description)}</p>
                                <div class="blog-footer">
                                    <span class="blog-tag">${category.label}</span>
                                    <div class="read-more">Read More <i data-lucide="arrow-right" style="width:16px;height:16px;"></i></div>
                                </div>
                            </div>
                        </article>
                    </a>`;
}).join('\n\n');

let blog = fs.readFileSync(BLOG_FILE, 'utf8');
const gridStart = blog.indexOf('                <div class="blog-grid" id="blogGrid">');
const noResultsStart = blog.indexOf('                <!-- No Results State -->');
if (gridStart < 0 || noResultsStart < 0) throw new Error('Could not locate blog grid markers.');
const gridOpenEnd = blog.indexOf('\n', gridStart) + 1;
blog = blog.slice(0, gridOpenEnd) + cards + '\n                </div>\n\n' + blog.slice(noResultsStart);

const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'MBBS Abroads Blog',
    url: 'https://mbbsabroads.com/blog.html',
    description: 'Evidence-led FEFU and MBBS in Russia guides for Indian students and families.',
    mainEntity: {
        '@type': 'ItemList',
        itemListElement: articles.map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: article.canonical,
            name: article.title
        }))
    }
};

const scripts = [...blog.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)];
const collectionScript = scripts.find((match) => match[0].includes('CollectionPage'));
if (!collectionScript) throw new Error('Could not locate CollectionPage schema.');
const schemaMarkup = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 4)}\n    </script>`;
blog = blog.slice(0, collectionScript.index) + schemaMarkup + blog.slice(collectionScript.index + collectionScript[0].length);

fs.writeFileSync(BLOG_FILE, blog);
console.log(`Generated blog index with ${articles.length} article cards.`);
