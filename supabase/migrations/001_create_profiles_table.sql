-- Creates a basic profiles table to store user metadata and avatar URL
-- Run this in the Supabase SQL editor or via your migration tooling.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Optional: keep updated_at current on update
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql stable;

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- RLS: allow authenticated users to insert/update their own profile
alter table public.profiles enable row level security;

create policy "profiles_is_owner"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Storage note: Create a bucket named `avatars` (public) in the Supabase Storage UI.
-- You can make the bucket public or use signed URLs; the client code expects a public URL.
-- SQL to create a public bucket isn't available via SQL; create it in the Supabase dashboard:
-- Storage -> Buckets -> New bucket -> Name: avatars -> Public: true (optional)
