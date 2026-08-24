-- AuraMax member reviews. Run through the Supabase SQL Editor before publishing reviews.
create table if not exists public.auramax_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(trim(body)) between 20 and 700),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.auramax_reviews enable row level security;
drop policy if exists "Published AuraMax reviews are public" on public.auramax_reviews;
drop policy if exists "Authenticated members add their own AuraMax review" on public.auramax_reviews;
create policy "Published AuraMax reviews are public" on public.auramax_reviews for select using (is_published = true);
create policy "Authenticated members add their own AuraMax review" on public.auramax_reviews for insert to authenticated with check (auth.uid() = user_id and is_published = true);
create index if not exists auramax_reviews_created_at_idx on public.auramax_reviews (created_at desc);
