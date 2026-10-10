create table public.garage_bikes (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  motorcycle_id uuid references public.motorcycles(id) on delete set null,
  nickname text not null default '', make text not null, model text not null,
  year integer, variant text not null default '', market text not null default '',
  registration text not null default '', mileage_km numeric(12,3),
  photo_path text, archived_at timestamptz, import_key text,
  created_at timestamptz not null default now(),
  unique(owner_id,id), unique(owner_id,import_key),
  check (mileage_km is null or (mileage_km >= 0 and mileage_km != 'NaN'::numeric)),
  check (length(trim(make)) between 1 and 120 and length(trim(model)) between 1 and 120),
  check (length(nickname) <= 80 and length(variant) <= 120 and length(market) <= 120),
  check (length(registration) <= 40),
  check (year is null or year between 1885 and 2100)
);
alter table public.garage_bikes enable row level security;
revoke all on public.garage_bikes from anon;
grant select,insert,update,delete on public.garage_bikes to authenticated;
create policy garage_bikes_owner on public.garage_bikes for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
