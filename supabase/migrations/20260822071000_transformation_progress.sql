create table if not exists public.auramax_transformation_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_days smallint[] not null default '{}'::smallint[],
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.auramax_transformation_progress enable row level security;

grant select, insert, update, delete on public.auramax_transformation_progress to authenticated;

drop policy if exists "Users manage their own transformation progress" on public.auramax_transformation_progress;

create policy "Users manage their own transformation progress"
  on public.auramax_transformation_progress
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
