-- Run in the AuraMax Supabase SQL Editor once. This stores shared LookBook uploads.
create table if not exists public.auramax_gallery_items (id uuid primary key default gen_random_uuid(),category text not null,title text not null,description text not null,image_url text,is_published boolean not null default true,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.auramax_gallery_items enable row level security;
drop policy if exists "Published AuraMax gallery items are public" on public.auramax_gallery_items;
drop policy if exists "AuraMax admins manage gallery items" on public.auramax_gallery_items;
create policy "Published AuraMax gallery items are public" on public.auramax_gallery_items for select using (is_published = true);
create policy "AuraMax admins manage gallery items" on public.auramax_gallery_items for all to authenticated using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@anonzou.com') with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@anonzou.com');
insert into storage.buckets (id,name,public) values ('auramax-gallery','auramax-gallery',true) on conflict (id) do nothing;
drop policy if exists "Public AuraMax gallery image access" on storage.objects;
drop policy if exists "AuraMax admins upload gallery images" on storage.objects;
create policy "Public AuraMax gallery image access" on storage.objects for select using (bucket_id = 'auramax-gallery');
create policy "AuraMax admins upload gallery images" on storage.objects for insert to authenticated with check (bucket_id = 'auramax-gallery' and lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@anonzou.com');
drop policy if exists "AuraMax admins update gallery images" on storage.objects;
drop policy if exists "AuraMax admins delete gallery images" on storage.objects;
create policy "AuraMax admins update gallery images" on storage.objects for update to authenticated using (bucket_id = 'auramax-gallery' and lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@anonzou.com');
create policy "AuraMax admins delete gallery images" on storage.objects for delete to authenticated using (bucket_id = 'auramax-gallery' and lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@anonzou.com');
