-- Subscriber list + related-article emails.
-- Run once in Supabase SQL Editor (safe to re-run).

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create unique index if not exists subscribers_email_lower_idx
  on public.subscribers (lower(email));

create table if not exists public.subscriber_interests (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers (id) on delete cascade,
  article_id uuid references public.articles (id) on delete set null,
  article_slug text,
  article_title text,
  topic_id uuid references public.topics (id) on delete set null,
  topic_slug text,
  topic_name text,
  source text not null default 'site',
  created_at timestamptz not null default now()
);

create unique index if not exists subscriber_interests_article_idx
  on public.subscriber_interests (subscriber_id, article_id)
  where article_id is not null;

create unique index if not exists subscriber_interests_topic_idx
  on public.subscriber_interests (subscriber_id, topic_id)
  where article_id is null and topic_id is not null;

create unique index if not exists subscriber_interests_general_idx
  on public.subscriber_interests (subscriber_id)
  where article_id is null and topic_id is null;

create index if not exists subscriber_interests_topic_id_idx
  on public.subscriber_interests (topic_id);

create table if not exists public.subscriber_notifications (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers (id) on delete cascade,
  article_id uuid not null references public.articles (id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique (subscriber_id, article_id)
);

alter table public.subscribers enable row level security;
alter table public.subscriber_interests enable row level security;
alter table public.subscriber_notifications enable row level security;

drop policy if exists "subscribers_admin_all" on public.subscribers;
create policy "subscribers_admin_all" on public.subscribers
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subscriber_interests_admin_all" on public.subscriber_interests;
create policy "subscriber_interests_admin_all" on public.subscriber_interests
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subscriber_notifications_admin_all" on public.subscriber_notifications;
create policy "subscriber_notifications_admin_all" on public.subscriber_notifications
  for all using (public.is_admin()) with check (public.is_admin());
