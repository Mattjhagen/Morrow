-- Morrow production foundation: identities, merchant stores, and tenant isolation.
-- This migration deliberately contains no payment credentials, AI keys, or customer data.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 100),
  handle text not null check (handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (handle)
);

create table public.store_memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index idx_store_memberships_user_id on public.store_memberships(user_id);
create index idx_stores_owner_id on public.stores(owner_id);

-- Tenant authorization is centralised in a non-exposed schema. It is callable
-- only by signed-in users and always checks the caller's immutable auth identity.
create or replace function private.is_store_member(target_store_id uuid, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.store_memberships membership
    where membership.store_id = target_store_id
      and membership.user_id = (select auth.uid())
      and (allowed_roles is null or membership.role = any(allowed_roles))
  );
$$;

revoke all on function private.is_store_member(uuid, text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_store_member(uuid, text[]) to authenticated;

create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.create_profile_for_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.create_profile_for_new_user();

-- A merchant who creates a store becomes its owner automatically. No client can
-- insert a privileged membership for someone else's store.
create or replace function private.add_store_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.store_memberships (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (store_id, user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.add_store_owner_membership() from public;

create trigger on_store_created
  after insert on public.stores
  for each row execute procedure private.add_store_owner_membership();

create or replace function private.prevent_store_owner_change()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Store ownership cannot be changed through this operation';
  end if;
  return new;
end;
$$;

revoke all on function private.prevent_store_owner_change() from public;

create trigger on_store_owner_change
  before update on public.stores
  for each row execute procedure private.prevent_store_owner_change();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;

create policy "Profiles are visible only to their account holder"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Profiles can be updated only by their account holder"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Members can view their stores"
  on public.stores for select to authenticated
  using (private.is_store_member(id));

create policy "Signed-in users can create stores they own"
  on public.stores for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners and admins can update their stores"
  on public.stores for update to authenticated
  using (private.is_store_member(id, array['owner', 'admin']))
  with check (private.is_store_member(id, array['owner', 'admin']));

create policy "Members can view only their own membership records"
  on public.store_memberships for select to authenticated
  using (user_id = (select auth.uid()));

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.stores to authenticated;
grant select on public.store_memberships to authenticated;
