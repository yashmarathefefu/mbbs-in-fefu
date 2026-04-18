-- FEFU website lead hardening for `form_submissions`
-- Run this in Supabase SQL editor after checking the column names match your table.
-- This keeps anon inserts possible while adding validation and lightweight rate limiting.

begin;

create schema if not exists private;

create table if not exists private.form_submission_rate_limit (
    key text primary key,
    hits integer not null default 0,
    window_started_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);

create or replace function public.normalize_indian_phone(raw_phone text)
returns text
language plpgsql
immutable
as $$
declare
    digits text;
begin
    digits := regexp_replace(coalesce(raw_phone, ''), '\D', '', 'g');

    if length(digits) = 10 then
        return '+91 ' || substr(digits, 1, 5) || ' ' || substr(digits, 6, 5);
    end if;

    if length(digits) = 12 and left(digits, 2) = '91' then
        return '+91 ' || substr(digits, 3, 5) || ' ' || substr(digits, 8, 5);
    end if;

    return null;
end;
$$;

create or replace function public.validate_form_submission()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
    normalized_phone text;
    clean_name text;
    clean_email text;
    visitor_key text;
    bucket_key text;
    existing_key text;
begin
    clean_name := btrim(regexp_replace(coalesce(new.name, ''), '\s+', ' ', 'g'));
    clean_email := lower(btrim(coalesce(new.email, '')));
    normalized_phone := public.normalize_indian_phone(new.phone);

    if clean_name = '' or length(clean_name) < 2 or clean_name !~ '^[A-Za-z][A-Za-z .''-]{1,79}$' then
        raise exception 'Invalid name supplied';
    end if;

    if clean_email <> '' and clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        raise exception 'Invalid email supplied';
    end if;

    if normalized_phone is null then
        raise exception 'Invalid phone supplied';
    end if;

    if coalesce(length(new.message), 0) > 1200 then
        raise exception 'Message is too long';
    end if;

    new.name := clean_name;
    new.email := nullif(clean_email, '');
    new.phone := normalized_phone;
    new.country := nullif(btrim(coalesce(new.country, '')), '');
    new.message := nullif(btrim(coalesce(new.message, '')), '');

    visitor_key := coalesce(nullif(new.visitor_id, ''), normalized_phone);
    bucket_key := visitor_key || ':' || to_char(date_trunc('hour', now()), 'YYYYMMDDHH24');

    insert into private.form_submission_rate_limit as rl (key, hits, window_started_at, last_seen_at)
    values (bucket_key, 1, now(), now())
    on conflict (key) do update
        set hits = rl.hits + 1,
            last_seen_at = now();

    select key into existing_key
    from private.form_submission_rate_limit
    where key = bucket_key and hits > 5;

    if existing_key is not null then
        raise exception 'Too many submissions from this device or number. Please try again later.';
    end if;

    return new;
end;
$$;

drop trigger if exists trg_validate_form_submission on public.form_submissions;

create trigger trg_validate_form_submission
before insert on public.form_submissions
for each row
execute function public.validate_form_submission();

comment on function public.validate_form_submission() is
'Normalizes lead fields and blocks obviously invalid or spammy form submissions before insert.';

commit;
