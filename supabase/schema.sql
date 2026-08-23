-- CFOmatics CMS schema.
-- Run this whole file once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------------------
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  dek text not null,
  body_json jsonb not null,
  topic_id uuid references public.topics (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  cover_image_url text,
  cover_image_alt text,
  cover_image_credit text,
  cover_image_credit_url text,
  meta_title text,
  meta_description text,
  read_time_minutes integer,
  author_name text not null default 'The CFOmatics Desk',
  source text not null default 'manual' check (source in ('ai', 'manual')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_published_at_idx
  on public.articles (status, published_at desc);
create index if not exists articles_topic_id_idx on public.articles (topic_id);

-- ---------------------------------------------------------------------------
-- generation_log — observability for the AI auto-publish cron
-- ---------------------------------------------------------------------------
create table if not exists public.generation_log (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  topic_searched text,
  status text not null check (status in ('success', 'failed')),
  article_id uuid references public.articles (id) on delete set null,
  error_message text
);

-- ---------------------------------------------------------------------------
-- admin_users — explicit allowlist of who may use /admin
-- After creating your login user in Authentication > Users, insert their
-- auth.users id here, e.g.:
--   insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger for articles
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.topics enable row level security;
alter table public.articles enable row level security;
alter table public.generation_log enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- topics: public read, admin write
drop policy if exists "topics_public_select" on public.topics;
create policy "topics_public_select" on public.topics
  for select using (true);

drop policy if exists "topics_admin_write" on public.topics;
create policy "topics_admin_write" on public.topics
  for all using (public.is_admin()) with check (public.is_admin());

-- articles: public read of published-only, admin full access
drop policy if exists "articles_public_select" on public.articles;
create policy "articles_public_select" on public.articles
  for select using (status = 'published' and published_at <= now());

drop policy if exists "articles_admin_all" on public.articles;
create policy "articles_admin_all" on public.articles
  for all using (public.is_admin()) with check (public.is_admin());

-- generation_log: admin only, no public policy
drop policy if exists "generation_log_admin_all" on public.generation_log;
create policy "generation_log_admin_all" on public.generation_log
  for all using (public.is_admin()) with check (public.is_admin());

-- admin_users: admin only, no public policy
drop policy if exists "admin_users_admin_all" on public.admin_users;
create policy "admin_users_admin_all" on public.admin_users
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed the 7 existing topic categories (no-op if already present)
-- ---------------------------------------------------------------------------
insert into public.topics (slug, name, description) values
  ('financial-reporting', 'Financial Reporting', 'Disclosure rules, standards, and the close.'),
  ('fpa', 'FP&A', 'Planning, forecasting, and analysis.'),
  ('treasury', 'Treasury', 'Cash, liquidity, and payments.'),
  ('risk-compliance', 'Risk & Compliance', 'Governance, controls, and regulation.'),
  ('tax', 'Tax', 'Corporate and cross-border tax.'),
  ('technology', 'Technology', 'Systems, automation, and AI in finance.'),
  ('leadership', 'Leadership', 'The CFO role and finance careers.')
on conflict (slug) do nothing;
