-- A create request can ask PostgREST to return the new row immediately. The
-- owner must be able to read that row while the owner-membership trigger is
-- completing, without widening access beyond the authenticated owner.
drop policy if exists "Members can view their stores" on public.stores;

create policy "Owners and members can view their stores"
  on public.stores for select to authenticated
  using (
    (select auth.uid()) = owner_id
    or private.is_store_member(id)
  );
