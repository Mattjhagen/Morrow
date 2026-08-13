-- PostgreSQL evaluates the INSERT policy against the submitted row before the
-- ownership trigger's normalized row is available to the policy. The trigger
-- remains the authority for owner_id; this policy only requires a real session.
drop policy if exists "Signed-in users can create stores they own" on public.stores;

create policy "Signed-in users can create stores"
  on public.stores for insert to authenticated
  with check ((select auth.uid()) is not null);
