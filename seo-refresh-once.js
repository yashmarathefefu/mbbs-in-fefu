const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BLOG_DIR = path.join(ROOT, 'blogs');
const TODAY = new Date().toISOString().slice(0, 10);
const IMAGE = 'https://mbbsabroads.com/assets/fefu_academic_lab.png';
const AUTHOR = '{"@type":"Organization","name":"MBBS Abroads Editorial Team","url":"https://mbbsabroads.com/editorial-policy.html"}';

const disclosure = `
                <aside class="editorial-disclosure" aria-label="Editorial information">
                    <strong>Published by the <a href="../editorial-policy.html" rel="author">MBBS Abroads Editorial Team</a>.</strong>
                    This consultancy guide is not an official FEFU or NMC page. Verify intake-specific fees, deadlines, eligibility, and documents with the relevant official source before acting.
                </aside>`;

const topicHub = `
                <nav class="fefu-topic-hub" aria-label="FEFU 2026 topic guide">
                    <h2>FEFU MBBS 2026 topic guide</h2>
                    <p>Use the focused guide that matches your decision instead of relying on one general overview.</p>
                    <div class="fefu-topic-links">
                        <a href="mbbs-in-russia-fefu-2026.html">Complete overview</a>
                        <a href="fefu-mbbs-admission-process-2026.html">Admission process</a>
                        <a href="fefu-mbbs-documents-required-indian-students-2026.html">Documents checklist</a>
                        <a href="fefu-mbbs-fees-hostel-admission-eligibility-guide-2026.html">Fees and eligibility</a>
                        <a href="fefu-mbbs-syllabus-subjects-year-wise-2026.html">Year-wise syllabus</a>
                        <a href="fefu-mbbs-2026-intake-deadline-application-timeline.html">Intake timeline</a>
                        <a href="fefu-hostel-campus-life-indian-students-2026.html">Hostel and campus life</a>
                    </div>
                </nav>`;

function metaContent(html, property) {
    const pattern = new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']*)`, 'i');
    return (html.match(pattern) || [])[1] || '';
}

function addSocialMeta(html) {
    if (!/property=["']og:image["']/i.test(html)) {
        html = html.replace(/(<meta\s+property=["']og:url["'][^>]*>)/i, `$1\n    <meta property="og:image" content="${IMAGE}">`);
    }
    if (!/property=["']og:image:alt["']/i.test(html)) {
        html = html.replace(/(<meta\s+property=["']og:image["'][^>]*>)/i, '$1\n    <meta property="og:image:alt" content="FEFU medical education guide">');
    }
    const title = metaContent(html, 'og:title');
    const description = metaContent(html, 'og:description');
    if (!/name=["']twitter:title["']/i.test(html) && title) {
        html = html.replace(/(<meta\s+name=["']twitter:card["'][^>]*>)/i, `$1\n    <meta name="twitter:title" content="${title}">`);
    }
    if (!/name=["']twitter:description["']/i.test(html) && description) {
        html = html.replace(/(<meta\s+name=["']twitter:title["'][^>]*>)/i, `$1\n    <meta name="twitter:description" content="${description}">`);
    }
    if (!/name=["']twitter:image["']/i.test(html)) {
        html = html.replace(/(<meta\s+name=["']twitter:(?:description|card)["'][^>]*>)(?![\s\S]*name=["']twitter:image["'])/i, `$1\n    <meta name="twitter:image" content="${IMAGE}">`);
    }
    return html;
}

function normalizeSchema(html) {
    html = html.replace(/"dateModified"\s*:\s*"\d{4}-\d{2}-\d{2}"/g, `"dateModified": "${TODAY}"`);
    html = html.replace(/"author"\s*:\s*\{\s*"@type"\s*:\s*"Organization"\s*,\s*"name"\s*:\s*"[^"]+"(?:\s*,\s*"url"\s*:\s*"[^"]+")?\s*\}/g, `"author": ${AUTHOR}`);
    return html;
}

function normalizeVisibleAuthor(html) {
    const authorPattern = /(<span[^>]*>\s*<i[^>]*data-lucide=["']user["'][^>]*><\/i>)[\s\S]*?(<\/span>)/i;
    if (authorPattern.test(html)) {
        return html.replace(authorPattern, '$1 <a class="editorial-author-link" href="../editorial-policy.html" rel="author">MBBS Abroads Editorial Team</a>$2');
    }
    return html.replace(/(<div class="post-meta"[^>]*>)/i, '$1\n                    <span><i data-lucide="user" style="width:16px;height:16px;"></i> <a class="editorial-author-link" href="../editorial-policy.html" rel="author">MBBS Abroads Editorial Team</a></span>');
}

function addTrustBlocks(html) {
    if (!html.includes('class="editorial-disclosure"')) {
        html = html.replace(/(<div class="post-content"[^>]*>)/i, `$1${disclosure}`);
    }
    if (!html.includes('class="fefu-topic-hub"')) {
        html = html.replace(/(<div class="post-content"[^>]*>[\s\S]*?<\/aside>)/i, `$1${topicHub}`);
    }
    return html;
}

function addFooterPolicy(html) {
    if (/footer[\s\S]*editorial-policy\.html/i.test(html)) return html;
    return html.replace(/(<footer class="footer"[\s\S]*?<div class="container">[\s\S]*?<p[^>]*>[^<]*(?:MBBS Abroads|FEFU Medical Intake)[^<]*<\/p>)/i,
        '$1\n            <p class="footer-policy-links"><a href="../editorial-policy.html">Editorial policy</a> &middot; <a href="../privacy.html">Privacy</a> &middot; <a href="../terms.html">Terms</a></p>');
}

function addImageDecoding(html) {
    return html.replace(/<img\b(?![^>]*\bdecoding=)([^>]*)>/gi, '<img decoding="async"$1>');
}

function reframeUnverifiedReview(html, file) {
    if (file !== 'is-fefu-mbbs-worth-it-4th-year-review-2026.html') return html;
    const replacements = [
        [/<title>[\s\S]*?<\/title>/i, '<title>Is FEFU MBBS Worth It? 4th-Year Decision Checklist 2026</title>'],
        [/<meta name="description" content="[^"]*">/i, '<meta name="description" content="Evaluate whether FEFU MBBS is worth it using a fourth-year decision checklist covering campus life, clinical training, Russian, licensing preparation, and costs.">'],
        [/<meta property="og:title" content="[^"]*">/i, '<meta property="og:title" content="Is FEFU MBBS Worth It? 4th-Year Decision Checklist 2026">'],
        [/<meta property="og:description" content="[^"]*">/i, '<meta property="og:description" content="A practical decision framework for evaluating FEFU before the clinical years, without presenting an unverified student testimonial.">'],
        [/<meta name="twitter:title" content="[^"]*">/i, '<meta name="twitter:title" content="Is FEFU MBBS Worth It? 4th-Year Decision Checklist">'],
        [/<meta name="twitter:description" content="[^"]*">/i, '<meta name="twitter:description" content="A practical framework for evaluating FEFU campus life, clinical training, Russian, licensing preparation, and costs.">'],
        [/"headline"\s*:\s*"[^"]*"/i, '"headline": "Is FEFU MBBS Worth It? 4th-Year Decision Checklist 2026"'],
        [/"description"\s*:\s*"A straight-talking FEFU MBBS review[^"]*"/i, '"description": "A practical decision framework covering the questions a student should answer before reaching the clinical years at FEFU."'],
        [/<span id="post-category" class="post-category">[\s\S]*?<\/span>/i, '<span id="post-category" class="post-category">Decision Checklist</span>'],
        [/<h1 id="post-title" class="post-title">[\s\S]*?<\/h1>/i, '<h1 id="post-title" class="post-title">Is FEFU MBBS Worth It? A 4th-Year Decision Checklist for 2026</h1>'],
        [/<p>If you are in Class 12[\s\S]*?not a brochure\.<\/p>/i, '<p>If you are in Class 12 or you just finished NEET, you have probably heard the same loop: <span class="text-highlight">limited government seats, high private-college fees, and endless study-abroad advertising</span>. This guide does not pretend to be a named student testimonial. It uses the questions a student should be able to answer before reaching the fourth year of General Medicine.</p>'],
        [/<p>For me, yes[\s\S]*?<\/p>/i, '<p>FEFU can be worth considering if you can handle <span class="text-highlight">structure, cold weather, independent study, and gradual Russian-language learning</span>. It is not a shortcut around licensing requirements, and the correct comparison must include the full six-year budget rather than tuition alone.</p>'],
        [/<p>If you only want the headline:[\s\S]*?<\/p>/i, '<p>The practical fit test is simple: the campus and on-site medical infrastructure may appeal to a focused student, while someone seeking a central-city lifestyle, a very large Indian peer group, or zero Russian effort during clinical training should compare alternatives carefully.</p>'],
        [/<p>Our simulation rooms[\s\S]*?<\/p>/i, '<p>Before enrollment, ask for current evidence of how simulation rooms are used, which clinical facilities serve international students, and what access begins in each year. Campus access controls can support safety, but they do not replace ordinary personal precautions or intake-specific hostel confirmation.</p>'],
        [/<p><strong>Be honest about Russian\.<\/strong>[\s\S]*?<\/p>/i, '<p><strong>Be realistic about Russian.</strong> An English-medium academic track does not mean every patient will speak English. Ask how Russian is taught, when patient-facing activity begins, and what language competence is expected during clinical rotations. Starting early is safer than treating language as a final-year problem.</p>'],
        [/<p>What works in our batch:[\s\S]*?<\/p>/i, '<p>A sensible study plan uses university teaching as the base while mapping relevant Indian licensing competencies from the first year. Do not assume the university curriculum alone automatically prepares every student for a separate licensing examination.</p>'],
        [/<h3>What I Actually Spend On \(Beyond Tuition\)<\/h3>/i, '<h3>What to Budget for Beyond Tuition</h3>'],
        [/<li><strong>Food:<\/strong>[\s\S]*?<\/li>/i, '<li><strong>Food:</strong> compare campus-cafe prices with a realistic grocery and cooking budget, subject to the facilities available in the assigned residence.</li>'],
        [/<p>FEFU has been worth it for me if you are the kind of student who:<\/p>/i, '<p>FEFU is more likely to fit a student who:</p>'],
        [/<p>I am not going to tell you FEFU is perfect[\s\S]*?<\/p>/i, '<p>No medical school is a perfect fit. A <span class="text-highlight">serious Class 12 or NEET student</span> can place FEFU on a shortlist only after confirming the current English-track documentation, full budget, clinical sequence, licensing implications, and signed university terms.</p>']
    ];
    for (const [pattern, replacement] of replacements) html = html.replace(pattern, replacement);
    return html;
}

for (const file of fs.readdirSync(BLOG_DIR).filter((name) => name.endsWith('.html'))) {
    const fullPath = path.join(BLOG_DIR, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    html = addSocialMeta(html);
    html = normalizeSchema(html);
    html = normalizeVisibleAuthor(html);
    html = addTrustBlocks(html);
    html = addFooterPolicy(html);
    html = addImageDecoding(html);
    html = reframeUnverifiedReview(html, file);
    fs.writeFileSync(fullPath, html);
    console.log(`Refreshed ${file}`);
}
