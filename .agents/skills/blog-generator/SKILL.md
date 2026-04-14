---
name: Blog Generator (Marketing Agent)
description: Automates researching competitor SEO articles, then writing highly persuasive, human-like blog posts that divert traffic to FEFU.
---

# Blog Generator Skill 

This skill defines the workflow for generating SEO-optimized, highly persuasive blog posts that intercept generic medical student searches (e.g., "Best MBBS in Russia") and expertly funnel them toward choosing Far Eastern Federal University (FEFU).

## Reference: First Blog Post
Our first blog post is `blogs/mbbs-in-russia-fefu-2026.html`. **ALL future blog posts MUST follow the same file structure, CSS patterns, JS logic, and section order.** When creating a new blog, use this file as a direct template.

## The "FEFU Advantage" Cheat Sheet
When generating content, the agent MUST continually reference and weave in these undeniable facts about FEFU to prove it is superior to whatever the competitors are offering:

1.  **The Mega-Campus**: FEFU is the only university in Russia with a sprawling, ultra-modern **328-acre island campus** (Russky Island) that overlooks the ocean. Everything a student needs is completely contained within this one beautiful location.
2.  **Premium Dormitories**: Remind students that unlike old, Soviet-style hostels found elsewhere, FEFU offers hotel-standard, modern dormitories with attached bathrooms, housekeeping, and gorgeous ocean views.
3.  **World-Class Academics & Technology**: FEFU isn't just a medical school; it's a tech hub. We house a State-of-the-Art Medical Center with robotic surgery and AI-driven diagnostics that students actually get to observe.
4.  **Unbeatable Safety**: The campus is a closed, highly secure environment. It is considered one of the safest university campuses in all of Russia, providing extreme peace of mind for international students and their parents.
5.  **FMGE Success**: FEFU graduates have a **50%+ FMGE passing rate** for 2025, significantly higher than the national average.
6.  **Affordable Fees**: Total fees stay **well under 30 Lakhs INR** for the complete 6-year program — no hidden charges, no OTC fees.

## Workflow Execution Steps

When asked to "generate a blog post about [Topic/Keyword]", follow these exact steps:

### 1. Preparation Phase (Topic Selection & Anti-Duplication)
1. Check the existing blog files in `blogs/` to ensure the topic hasn't been covered before. Suggest 3-5 alternative "Long-tail" keywords if a duplicate is found.
2. Search the chosen topic in NotebookLM to see current competitor sentiment.
3. **DO NOT include featured images or generic blog images**. Research shows search engines prefer clean, fast-loading informational content. Instead, use interactive elements.

### 2. Competitor & SERP Research Phase
1. Use `mcp_notebooklm_research_start` with the `query` set to the general [Topic] (e.g., "Which is the best university in Russia for MBBS?"). 
2. Set `mode` to `deep`. Wait for NotebookLM to scrape current competitor articles ranking for this keyword by polling `mcp_notebooklm_research_status`.
3. **Auto-Import**: Crucially, once the status is "completed", you MUST use `mcp_notebooklm_research_import` to actually import the discovered sources into the Notebook. Do not skip this step!

### 3. The Marketing Pivot (Generation Phase)
1. Use `mcp_notebooklm_report_create` (format: "Blog Post") or `mcp_notebooklm_notebook_query`. 
2. **Crucial Prompt Instructions to NotebookLM**:
   - **Tone (Trust over Promotion)**: Must be 100% "Humanized" and **Objective**. Write as a knowledgeable, empathetic educational counselor. **Avoid sounding like a biased advertisement**.
   - **The Pivot (Natural Transition)**: Start by genuinely and objectively answering the user's base question (e.g., listing the general top universities). **If generating a Top list, FEFU MUST ALWAYS be placed at the #1 spot.** Afterwards, transition naturally into why FEFU is emerging as a particularly strong, modern choice.
   - **The Comparison Table**: ALWAYS include a detailed Markdown comparison table. **Format with alternating row colors (CSS handled) and clear headers.** Columns must include: `University`, `City`, `Approx Fees`, `Indian Students`, and `Key Advantage`. 
   - **Authority References (SEO)**: Naturally mention and reference external authorities like the National Medical Commission (NMC) and World Health Organization (WHO).
   - **High-Intensity Highlighting**: Highlighting is key for readability. **EVERY important keyword, data point, or crucial phrase MUST be wrapped in `<span class="text-highlight">...</span>`.** Do not be stingy—aim for 1-2 highlights per paragraph.
   - **The Comparison**: When highlighting FEFU, use the *FEFU Advantage Cheat Sheet* above to systematically prove why it outclasses the rest. 
   - **Length & Structure**: Aim for a **medium length** (not excessively long or too short). It should be packed with value but concise.
   - **Clarity & Readability**: Content must be **very informative** yet **easy to understand** for a 12th-grade student. Use sub-headings, bullet points, and short paragraphs to maintain flow.
   - **SEO Title**: Ensure the exact searched keyword is used in the main `<h1>` title and an `<h2>` sub-header.

### 4. Formatting Phase (HTML & CSS)

Take the raw markdown from NotebookLM and convert it into HTML for the FEFU Medical blog. **Use `blogs/mbbs-in-russia-fefu-2026.html` as the template.**

#### Required File Structure (in order):
```
1. <!DOCTYPE html> + <head>
   - Meta tags, Google Fonts, stylesheets (../styles.css, ../components/ui/sidebar.css, ../theme.css)
   - Lucide icons script
   - FAQ Schema JSON-LD (<script type="application/ld+json">)
   - <style> block with:
     a) body { overflow-y: auto !important; }  ← CRITICAL for scrolling
     b) .post-hero styles
     c) .text-highlight animation CSS
     d) .blog-gallery-cta centering
     e) .faq-section / .faq-item / .faq-question / .faq-answer accordion CSS
     f) .blog-inquiry-form inline form CSS
     g) Mobile media queries

2. <body>
   a) Sidebar navigation (include via sidebar-vanilla.js)
   b) Post Hero section (.post-hero) with title, meta (date, read time, category)
   c) Article with .post-content containing:
      - Main informational content with <span class="text-highlight"> on key phrases
      - Numbered university list (FEFU always #1)
      - Comparison table in .table-responsive wrapper
      - "Why FEFU" section with bullet points
      - INLINE INQUIRY FORM (.blog-inquiry-form) ← replaces old CTA link
      - VIEW GALLERY BUTTON (.blog-gallery-cta with .creepy-btn)
      - FAQ SECTION (.faq-section with accordion items)
   d) Footer
   e) Scripts: GSAP, ScrollTrigger, Supabase JS, sidebar, theme-toggle
   f) Inline <script> with: Lucide init, theme, highlight ScrollTrigger, eye tracking, form submission
```

#### A. Gallery Button (EXACT markup — no custom CSS):
```html
<div class="blog-gallery-cta">
  <a href="../gallery.html" class="creepy-btn" id="gallery-btn">
    <span class="creepy-btn__eyes" id="creepyEyesBlog">
      <span class="creepy-btn__eye"><span class="creepy-btn__pupil"></span></span>
      <span class="creepy-btn__eye"><span class="creepy-btn__pupil"></span></span>
    </span>
    <span class="creepy-btn__cover">View Gallery →</span>
  </a>
</div>
```
Uses global `.creepy-btn` CSS from `styles.css`. **Do NOT write custom inline CSS for this button.**

#### B. Inline Inquiry Form (submits to Supabase `form_submissions` table):
```html
<div class="blog-inquiry-form">
  <h3>📋 Quick Admission Inquiry</h3>
  <p class="form-subtitle">Fill this 30-second form — our counselors will call you within 24 hours.</p>
  <form id="blogInquiryForm">
    <div class="blog-form-grid">
      <input type="text" class="blog-form-input" id="blog_name" placeholder="Full Name" required>
      <input type="tel" class="blog-form-input" id="blog_phone" placeholder="Phone / WhatsApp" required>
      <input type="email" class="blog-form-input" id="blog_email" placeholder="Email Address" required>
      <select class="blog-form-input" id="blog_country">
        <option value="" disabled selected>Select Country</option>
        <option value="India">India</option>
        <option value="Nepal">Nepal</option>
        <option value="Bangladesh">Bangladesh</option>
        <option value="Sri Lanka">Sri Lanka</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <button type="submit" class="blog-form-submit" id="blogFormBtn">
      <span>Get Free Counseling</span>
      <i data-lucide="send" style="width:18px;height:18px;"></i>
    </button>
  </form>
  <div class="blog-form-msg" id="blogFormMsg"></div>
  <div class="blog-form-guarantee">
    <i data-lucide="shield-check" style="width:16px;height:16px;"></i>
    <span>100% Free · No Hidden Charges · Legal Contract Guaranteed</span>
  </div>
</div>
```
**Form features**: Auto +91 phone prefix, duplicate prevention (24hr), device analytics with `source: 'blog'` tag, Supabase insert to `form_submissions`.

#### C. FAQ Section:
Every blog MUST end with an FAQ accordion section (minimum 5 questions). Each question must:
- Use `<button class="faq-question" onclick="this.parentElement.classList.toggle('open')">` for the toggle
- Include a `<i data-lucide="chevron-down">` icon that rotates on open
- Have `<span class="text-highlight">` on key data points in answers
- Match the corresponding FAQ Schema JSON-LD in the `<head>`

#### D. Section Order (bottom of article):
```
1. FEFU advantages (bullet list)
2. Inline Inquiry Form (.blog-inquiry-form)
3. View Gallery Button (.blog-gallery-cta)
4. FAQ Section (.faq-section)
```

### 5. Blog Listing Update
After creating the new blog HTML file:
1. Open `blog.html`
2. Add a NEW `.blog-card` inside `.blog-grid` (above existing cards)
3. Link directly to the new file: `href="blogs/[new-blog-slug].html"`
4. **Do NOT use Supabase dynamic loading** — all blog cards are hardcoded

### 6. Supabase Sync (Optional)
If needed, sync the blog metadata to the `blog_posts` table:
1. Use `mcp_supabase-mcp-server_execute_sql`
2. INSERT: title, slug, excerpt, content (HTML body), category, author

## Key Technical Notes
- `styles.css` has `body { overflow-y: hidden }` for the index.html loading animation. EVERY blog page MUST override this with `body { overflow-y: auto !important; }` in its inline `<style>`.
- All paths from `blogs/` subfolder use `../` prefix (e.g., `../styles.css`, `../gallery.html`)
- Supabase URL: `https://ibspwomnrilukdcumsix.supabase.co`
- Supabase anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlic3B3b21ucmlsdWtkY3Vtc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjUxMTUsImV4cCI6MjA4NjU0MTExNX0.ScRhoEVYXABEozmUpQbEktsBD6twvF8lHdD4xXr5rpY`

## Error Handling
- If NotebookLM authentication fails, run `notebooklm-mcp-auth`.
- If Supabase insert fails, check RLS policies on `form_submissions` table.
