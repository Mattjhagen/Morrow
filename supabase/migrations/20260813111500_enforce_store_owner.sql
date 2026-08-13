-- Keep store ownership anchored to the authenticated database caller, rather
-- than trusting a browser-provided owner id. This also makes a stale local UI
-- session unable to create a store for another account.
create or replace function private.enforce_store_owner()
returns trigger
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'A signed-in user is required to create a store';
  end if;

  new.owner_id := (select auth.uid());
  return new;
end;
$$;

revoke all on function private.enforce_store_owner() from public;

drop trigger if exists before_store_created on public.stores;
create trigger before_store_created
  before insert on public.stores
  for each row execute procedure private.enforce_store_owner();
