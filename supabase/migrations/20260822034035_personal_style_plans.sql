create table if not exists public.auramax_personal_style_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  face_shape text not null default 'Not selected',
  body_type text not null default 'Not selected',
  skin_tone text not null default 'Medium / wheatish',
  plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auramax_personal_style_plans enable row level security;

grant select, insert, update, delete on public.auramax_personal_style_plans to authenticated;

drop policy if exists "Users manage their own personal style plan" on public.auramax_personal_style_plans;
create policy "Users manage their own personal style plan"
on public.auramax_personal_style_plans
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
