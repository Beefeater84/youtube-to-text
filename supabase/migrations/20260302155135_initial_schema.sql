-- Initial schema for youtube-to-text v0.1
-- Tables: channels, transcripts
-- Public read access via RLS

-- Helper: auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

------------------------------------------------------------
-- channels
------------------------------------------------------------
create table public.channels (
  id              uuid primary key default gen_random_uuid(),
  youtube_id      text unique not null,
  title           text not null,
  description     text,
  thumbnail_url   text,
  slug            text unique not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index channels_slug_idx on public.channels (slug);

create trigger channels_updated_at
  before update on public.channels
  for each row execute function public.set_updated_at();

alter table public.channels enable row level security;

create policy "Public read access"
  on public.channels for select
  using (true);

------------------------------------------------------------
-- transcripts
------------------------------------------------------------
create table public.transcripts (
  id                uuid primary key default gen_random_uuid(),
  channel_id        uuid not null references public.channels (id) on delete cascade,
  youtube_video_id  text unique not null,
  title             text not null,
  description       text,
  thumbnail_url     text,
  slug              text unique not null,
  language          text not null default 'en',
  duration_seconds  integer,
  markdown_url      text,
  status            text not null default 'pending'
                    check (status in ('pending', 'queued', 'processing', 'done', 'failed')),
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index transcripts_slug_idx       on public.transcripts (slug);
create index transcripts_channel_id_idx on public.transcripts (channel_id);
create index transcripts_status_idx     on public.transcripts (status);

create trigger transcripts_updated_at
  before update on public.transcripts
  for each row execute function public.set_updated_at();

alter table public.transcripts enable row level security;

create policy "Public read access"
  on public.transcripts for select
  using (true);
