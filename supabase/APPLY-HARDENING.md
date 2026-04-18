## Apply Supabase Hardening

Use this after reviewing [form-submissions-hardening.sql](/E:/final%20website/supabase/form-submissions-hardening.sql:1).

1. Open your Supabase project.
2. Go to `SQL Editor`.
3. Create a new query.
4. Paste the contents of `form-submissions-hardening.sql`.
5. Run it once.

What it changes:
- normalizes Indian phone numbers before insert
- validates name, email, and message length
- rate-limits repeated submissions from the same visitor or number
- blocks junk inserts before they hit `form_submissions`

How to test:
- submit a valid contact form
- submit with an invalid phone and confirm the friendly error appears
- try repeated rapid submissions and confirm rate limiting appears

If your `form_submissions` table uses different column names, adjust the SQL before running it.
