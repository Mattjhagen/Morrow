# Velour dashboard — real, data-backed build

This drop replaces the hardcoded mock dashboard with a working one wired to
Supabase, scoped to the signed-in store. It also fixes the expired-token bug
(the data layer now refreshes the session automatically).

## Files in this package

```
supabase/migrations/20260813160000_commerce_core.sql   # products, customers, orders, order_items + RLS
app/lib/store-api.ts                                    # data layer (auth refresh + CRUD + metrics)
app/dashboard/StoreDashboard.tsx                        # the real dashboard (all sections)
app/dashboard/dashboard.css                             # styles for the new interactive pieces
```

Copy them into the repo at those exact paths.

## Step 1 — run the migration

Run `supabase/migrations/20260813160000_commerce_core.sql` against the live
project (`xzdnffkebpxofkqdxqzh`): Supabase Dashboard → SQL Editor → paste → Run.
It's idempotent. You should then see `products`, `orders`, `order_items`, and
`customers` in the Table Editor. (Locally: `supabase db push`.)

## Step 2 — wire it into `app/page.tsx`

The dashboard is self-contained: it loads the signed-in store itself. You only
need to render it where the old mock `Dashboard` was shown.

1. Add the import near the top of `app/page.tsx`:

   ```tsx
   import StoreDashboard from "./dashboard/StoreDashboard";
   ```

2. Find where the mock dashboard renders (the block that runs when
   `screen === "dashboard"`, currently `<Dashboard onBack=... toast=... notice=... />`)
   and replace that render with:

   ```tsx
   <StoreDashboard
     onBack={() => setScreen("home")}
     onSignedOut={() => setScreen("home")}
   />
   ```

3. Delete the now-unused mock `Dashboard` and its `Metric` helper from
   `page.tsx` (optional cleanup — leaving them won't break anything).
   Keep `MiniDashboard` if it's used on the marketing landing page.

That's it. No other files change.

## Step 3 — verify

`pnpm dev` (or your build), sign in, create/open a store, then:

- **Products** → Add product → it persists and appears in the table and in
  "Low in stock" on Overview.
- **Orders** → New order → pick a product → it saves; change the status inline.
- **Customers** → Add customer.
- **Overview / Analytics** now show real numbers computed from your data
  (they start at $0 / empty, which is correct — no more fake $1,284).
- **Settings** → rename the store or change its `.velour.live` handle.

## Notes

- The data layer reads the session from `localStorage`, preferring
  `velour.supabase.session` and falling back to `morrow.supabase.session`, so it
  works on either the rebranded or original build. If your sign-in code uses a
  different key, update `SESSION_KEY` at the top of `app/lib/store-api.ts`.
- Env vars used (already set in your Vercel project):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Marketing / Sales channels / Integrations are real, store-aware pages with the
  data layer in place; the external hookups (Stripe checkout, Resend sends) are
  the natural next step and are marked "coming soon" in-UI rather than faked.
- Recommended follow-up: move the sign-in flow in `page.tsx` to use this same
  `store-api` session helpers so token refresh is consistent everywhere.
```
