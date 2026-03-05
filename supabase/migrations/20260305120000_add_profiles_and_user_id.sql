-- v0.2: profiles table, user_id on transcripts, RLS policies

------------------------------------------------------------
-- profiles
------------------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  display_name          text,
  avatar_url            text,
  preferred_languages   text[] not null default '{en}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

------------------------------------------------------------
-- auto-create profile on user signup
------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- add user_id to transcripts
------------------------------------------------------------
alter table public.transcripts
  add column user_id uuid references auth.users (id) on delete set null;

create index transcripts_user_id_idx on public.transcripts (user_id);

------------------------------------------------------------
-- RLS: authenticated users can insert transcripts
------------------------------------------------------------
create policy "Authenticated users can insert transcripts"
  on public.transcripts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own transcripts"
  on public.transcripts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
