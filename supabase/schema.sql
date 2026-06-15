create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  plan text,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their subscription" on public.subscriptions;
create policy "Users can read their subscription"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

revoke insert, update, delete on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

create or replace function public.set_subscription_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_subscription_updated_at();

create table if not exists public.founder_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text unique,
  status text not null default 'reserved'
    check (status in ('reserved', 'paid', 'released')),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_active_founder_place_per_user
on public.founder_reservations (user_id)
where status in ('reserved', 'paid');

alter table public.founder_reservations enable row level security;
revoke all on public.founder_reservations from anon, authenticated;

create or replace function public.reserve_founder_access(target_user_id uuid)
returns table (reservation_id uuid, remaining integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  used_places integer;
  existing_reservation uuid;
  new_reservation uuid;
begin
  perform pg_advisory_xact_lock(80421991);

  update public.founder_reservations
  set status = 'released', updated_at = now()
  where status = 'reserved' and expires_at <= now();

  select id into existing_reservation
  from public.founder_reservations
  where user_id = target_user_id
    and status in ('reserved', 'paid')
  limit 1;

  select count(*)::integer into used_places
  from public.founder_reservations
  where status = 'paid'
     or (status = 'reserved' and expires_at > now());

  if existing_reservation is not null then
    return query select existing_reservation, greatest(0, 100 - used_places);
    return;
  end if;

  if used_places >= 100 then
    return;
  end if;

  insert into public.founder_reservations (user_id)
  values (target_user_id)
  returning id into new_reservation;

  return query select new_reservation, greatest(0, 99 - used_places);
end;
$$;

revoke all on function public.reserve_founder_access(uuid) from public, anon, authenticated;
grant execute on function public.reserve_founder_access(uuid) to service_role;

create table if not exists public.user_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_backups enable row level security;

drop policy if exists "PRO users can read their backup" on public.user_backups;
create policy "PRO users can read their backup"
on public.user_backups
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.subscriptions
    where subscriptions.user_id = auth.uid()
      and subscriptions.status in ('active', 'trialing')
  )
);

drop policy if exists "PRO users can create their backup" on public.user_backups;
create policy "PRO users can create their backup"
on public.user_backups
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.subscriptions
    where subscriptions.user_id = auth.uid()
      and subscriptions.status in ('active', 'trialing')
  )
);

drop policy if exists "PRO users can update their backup" on public.user_backups;
create policy "PRO users can update their backup"
on public.user_backups
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.subscriptions
    where subscriptions.user_id = auth.uid()
      and subscriptions.status in ('active', 'trialing')
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.subscriptions
    where subscriptions.user_id = auth.uid()
      and subscriptions.status in ('active', 'trialing')
  )
);

revoke all on public.user_backups from anon;
grant select, insert, update on public.user_backups to authenticated;

drop trigger if exists user_backups_updated_at on public.user_backups;
create trigger user_backups_updated_at
before update on public.user_backups
for each row execute function public.set_subscription_updated_at();
