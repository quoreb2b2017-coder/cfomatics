-- CFOmatics first-party cookie consent + site analytics (GDPR retention ~180 days).
-- Run in Supabase SQL Editor after schema.sql. Safe to re-run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- consent_events — lightweight consent audit for GDPR admin
-- ---------------------------------------------------------------------------
create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  choice text not null check (choice in ('accept_all', 'reject_all', 'custom')),
  necessary boolean not null default true,
  analytics boolean not null default false,
  marketing boolean not null default false,
  consent_version integer not null default 1,
  session_id text,
  path text,
  pseudonymized_ip text,
  consent_status text,
  country text,
  created_at timestamptz not null default now()
);

create index if not exists idx_consent_events_created
  on public.consent_events (created_at desc);
create index if not exists idx_consent_events_choice
  on public.consent_events (choice);
create index if not exists idx_consent_events_session
  on public.consent_events (session_id);

alter table public.consent_events
  add column if not exists session_id text,
  add column if not exists path text,
  add column if not exists pseudonymized_ip text,
  add column if not exists consent_status text,
  add column if not exists country text;

alter table public.consent_events enable row level security;

drop policy if exists "consent_events_admin_select" on public.consent_events;
create policy "consent_events_admin_select" on public.consent_events
  for select using (public.is_admin());

-- Inserts go through service-role API only (no public insert policy)

-- ---------------------------------------------------------------------------
-- site_analytics_events — page_view / consent / custom
-- ---------------------------------------------------------------------------
create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('page_view', 'consent', 'custom')),
  session_id text not null,
  path text,
  referrer text,
  user_agent text,
  consent_snapshot jsonb not null default '{}'::jsonb,
  marketing_meta jsonb not null default '{}'::jsonb,
  custom_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_analytics_created
  on public.site_analytics_events (created_at desc);
create index if not exists idx_site_analytics_kind_created
  on public.site_analytics_events (kind, created_at desc);
create index if not exists idx_site_analytics_session
  on public.site_analytics_events (session_id);
create index if not exists idx_site_analytics_path
  on public.site_analytics_events (path);

alter table public.site_analytics_events enable row level security;

drop policy if exists "site_analytics_events_admin_select" on public.site_analytics_events;
create policy "site_analytics_events_admin_select" on public.site_analytics_events
  for select using (public.is_admin());

-- Inserts go through service-role API only

-- Retention cleanup helper (~180 days). Schedule via pg_cron or Vercel cron if desired.
create or replace function public.cleanup_site_analytics_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.site_analytics_events
  where created_at < now() - interval '180 days';
  get diagnostics deleted_count = row_count;

  delete from public.consent_events
  where created_at < now() - interval '180 days';

  return deleted_count;
end;
$$;
