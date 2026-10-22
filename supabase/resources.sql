-- Resources library + download leads.
-- Run once in the Supabase SQL Editor (safe to re-run).

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('whitepaper', 'report', 'case_study', 'webinar', 'guide')),
  vertical text not null,
  vertical_slug text not null,
  slug text not null unique,
  offered_by text not null default 'CFOmatics',
  author_name text,
  meta_title text,
  meta_description text,
  keywords text,
  overview text,
  inside_sections jsonb not null default '[]'::jsonb,
  pdf_path text,
  pdf_url text,
  cover_path text,
  cover_url text,
  form_config jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_category_idx on public.resources (category, status);
create index if not exists resources_vertical_slug_idx on public.resources (vertical_slug);

create table if not exists public.resource_downloads (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  email text not null,
  fields jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resource_downloads_resource_idx
  on public.resource_downloads (resource_id, created_at desc);

alter table public.resource_downloads
  add column if not exists profile_completed boolean not null default false;

-- Newsletter source columns. Skip when subscribers.sql has not been run yet.
do $$
begin
  if to_regclass('public.subscribers') is not null then
    alter table public.subscribers add column if not exists source_type text;
    alter table public.subscribers add column if not exists source_slug text;
    alter table public.subscribers add column if not exists source_title text;
  end if;
end $$;

alter table public.resources enable row level security;
alter table public.resource_downloads enable row level security;

drop policy if exists "resources_public_read" on public.resources;
create policy "resources_public_read" on public.resources
  for select using (status = 'published');

drop policy if exists "resources_admin_all" on public.resources;
create policy "resources_admin_all" on public.resources
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "resource_downloads_admin_all" on public.resource_downloads;
create policy "resource_downloads_admin_all" on public.resource_downloads
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do update set public = true;

drop policy if exists "resources_storage_public_read" on storage.objects;
create policy "resources_storage_public_read" on storage.objects
  for select using (bucket_id = 'resources');
