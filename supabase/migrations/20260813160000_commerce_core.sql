-- Velour commerce core: products, customers, orders, order_items.
-- Every row is scoped to a store and protected by the same membership check
-- (private.is_store_member) established in the foundation migration.
-- Safe / idempotent: re-runnable in the Supabase SQL editor.

-- ── updated_at helper ───────────────────────────────────────────────────────
create or replace function private.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── products ────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd',
  image_url text,
  sku text,
  inventory_count integer not null default 0,
  status text not null default 'active' check (status in ('active','draft','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_products_store on public.products(store_id);
drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute procedure private.set_updated_at();

-- ── customers ───────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz not null default now(),
  unique (store_id, email)
);
create index if not exists idx_customers_store on public.customers(store_id);

-- ── orders ──────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number bigint generated always as identity,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  status text not null default 'pending'
    check (status in ('pending','paid','fulfilled','refunded','cancelled')),
  currency text not null default 'usd',
  subtotal_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_store on public.orders(store_id);
create index if not exists idx_orders_store_created on public.orders(store_id, created_at desc);
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute procedure private.set_updated_at();

-- ── order_items ─────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  unit_price_cents integer not null default 0,
  quantity integer not null default 1 check (quantity > 0)
);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.products    enable row level security;
alter table public.customers   enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Members manage store products" on public.products;
create policy "Members manage store products" on public.products for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

drop policy if exists "Members manage store customers" on public.customers;
create policy "Members manage store customers" on public.customers for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

drop policy if exists "Members manage store orders" on public.orders;
create policy "Members manage store orders" on public.orders for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

drop policy if exists "Members manage store order items" on public.order_items;
create policy "Members manage store order items" on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_items.order_id and private.is_store_member(o.store_id)))
  with check (exists (select 1 from public.orders o
                 where o.id = order_items.order_id and private.is_store_member(o.store_id)));

grant select, insert, update, delete on public.products    to authenticated;
grant select, insert, update, delete on public.customers   to authenticated;
grant select, insert, update, delete on public.orders      to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

-- Make the new tables available to the REST API immediately.
notify pgrst, 'reload schema';
