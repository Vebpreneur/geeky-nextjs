-- AI-native publishing: initial database model.
create extension if not exists pgcrypto;

create table if not exists public.publishing_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(title) between 5 and 220),
  article_type text not null check (article_type in ('article','guide','review','comparison','toplist','tutorial','landing')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  excerpt text not null default '',
  content_blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(content_blocks) = 'array'),
  seo jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  category text,
  tags text[] not null default '{}',
  hero_image_url text,
  locale text not null default 'sv',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists publishing_articles_status_date_idx on public.publishing_articles (status, published_at desc);
create index if not exists publishing_articles_category_idx on public.publishing_articles (category, status);
create index if not exists publishing_articles_search_idx on public.publishing_articles using gin (to_tsvector('simple', title || ' ' || excerpt));

create table if not exists public.publishing_events (
  id bigint generated always as identity primary key,
  article_id uuid references public.publishing_articles(id) on delete set null,
  action text not null,
  request_id text,
  created_at timestamptz not null default now()
);

alter table public.publishing_articles enable row level security;
alter table public.publishing_events enable row level security;
-- No browser/client write policies; server uses a private service-role credential.
-- Public read access is served through the Next.js server, restricted to published records.
