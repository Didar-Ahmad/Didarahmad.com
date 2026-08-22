-- Payment records are written only by trusted Edge Functions. Browser users can
-- read their own records to display their current access state.
create table if not exists public.auramax_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text unique,
  plan_code text not null default 'personal_30_day',
  amount integer not null check (amount > 0),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  access_days integer not null default 30 check (access_days > 0),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.auramax_premium_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_code text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.auramax_payment_orders enable row level security;
alter table public.auramax_premium_access enable row level security;

create policy "Users can read their own AuraMax payment orders"
  on public.auramax_payment_orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own AuraMax premium access"
  on public.auramax_premium_access for select
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists auramax_payment_orders_user_id_idx
  on public.auramax_payment_orders(user_id, created_at desc);
