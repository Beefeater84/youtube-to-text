-- Tags and many-to-many relationship with channels

------------------------------------------------------------
-- tags
------------------------------------------------------------
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  slug        text unique not null,
  created_at  timestamptz not null default now()
);

create index tags_slug_idx on public.tags (slug);

alter table public.tags enable row level security;

create policy "Public read access"
  on public.tags for select
  using (true);

------------------------------------------------------------
-- channel_tags (junction table)
------------------------------------------------------------
create table public.channel_tags (
  channel_id  uuid not null references public.channels (id) on delete cascade,
  tag_id      uuid not null references public.tags (id) on delete cascade,
  primary key (channel_id, tag_id)
);

create index channel_tags_tag_id_idx on public.channel_tags (tag_id);

alter table public.channel_tags enable row level security;

create policy "Public read access"
  on public.channel_tags for select
  using (true);
