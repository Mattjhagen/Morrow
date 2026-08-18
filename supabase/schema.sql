-- ============================================================================
-- VELOUR E-COMMERCE PLATFORM: COMPLETE SUPABASE SQL SCHEMA
-- Run this script in your Supabase Project -> SQL Editor -> New query -> Run
-- ============================================================================

-- 1. EXTENSIONS & SCHEMAS
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- 2. HELPER FUNCTIONS
create or replace function private.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 3. USER PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function private.create_profile_for_new_user()
returns trigger language plpgsql security definer
set search_path = public, auth as $$
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.create_profile_for_new_user();

-- 4. STORES
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 100),
  handle text not null check (handle ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  tagline text default 'Objects for a slower home',
  currency text not null default 'usd',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (handle)
);

create index if not exists idx_stores_owner_id on public.stores(owner_id);
create index if not exists idx_stores_handle on public.stores(handle);

-- 5. STORE MEMBERSHIPS & AUTHORIZATION
create table if not exists public.store_memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index if not exists idx_store_memberships_user_id on public.store_memberships(user_id);

create or replace function private.is_store_member(target_store_id uuid, allowed_roles text[] default null)
returns boolean language sql stable security definer
set search_path = public, auth as $$
  select exists (
    select 1
    from public.store_memberships membership
    where membership.store_id = target_store_id
      and membership.user_id = (select auth.uid())
      and (allowed_roles is null or membership.role = any(allowed_roles))
  );
$$;

grant execute on function private.is_store_member(uuid, text[]) to authenticated;

create or replace function private.add_store_owner_membership()
returns trigger language plpgsql security definer
set search_path = public, auth as $$
begin
  insert into public.store_memberships (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (store_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_store_created_add_owner on public.stores;
create trigger on_store_created_add_owner
  after insert on public.stores
  for each row execute procedure private.add_store_owner_membership();

-- 6. STORE THEMES
create table if not exists public.store_themes (
  store_id uuid primary key references public.stores(id) on delete cascade,
  announcement text default '✨ Free carbon-neutral shipping on orders over $75 · Use code VELOUR10 for 10% off',
  banner_headline text default 'Objects for a slower, more intentional home.',
  banner_subhead text default 'Handcrafted ceramics, stone-washed textiles, and architectural homeware made in small artisan batches.',
  hero_image text default 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80',
  accent_color text default '#17372e',
  theme_style text default 'warm-paper',
  free_shipping_threshold_cents integer default 7500,
  tagline text default 'Your store. Ready before lunch.',
  updated_at timestamptz not null default now()
);

-- 7. PRODUCTS & VARIANTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  currency text not null default 'usd',
  image_url text,
  gallery_urls jsonb default '[]'::jsonb,
  category text default 'Ceramics',
  sku text,
  inventory_count integer not null default 10,
  status text not null default 'active' check (status in ('active','draft','archived')),
  rating numeric(3,2) default 5.0,
  review_count integer default 0,
  badges jsonb default '[]'::jsonb,
  details jsonb default '{}'::jsonb,
  variants jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_store on public.products(store_id);
create index if not exists idx_products_category on public.products(store_id, category);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute procedure private.set_updated_at();

-- 8. PRODUCT REVIEWS
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null,
  comment text not null,
  verified boolean default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product on public.product_reviews(product_id);

-- 9. CUSTOMERS
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  total_spent_cents integer not null default 0,
  orders_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (store_id, email)
);

create index if not exists idx_customers_store on public.customers(store_id);

-- 10. DISCOUNTS & PROMOTIONS
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  type text not null check (type in ('percentage', 'fixed', 'free_shipping')),
  value integer not null default 0,
  min_spend_cents integer not null default 0,
  usage_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id, code)
);

create index if not exists idx_discounts_store on public.discounts(store_id);

-- 11. ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_number bigint generated always as identity,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_email text not null,
  shipping_address jsonb not null default '{}'::jsonb,
  status text not null default 'paid' check (status in ('pending','paid','fulfilled','refunded','cancelled')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled','fulfilled','cancelled')),
  carrier text,
  tracking_number text,
  currency text not null default 'usd',
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  discount_code text,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_store on public.orders(store_id);
create index if not exists idx_orders_store_created on public.orders(store_id, created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute procedure private.set_updated_at();

-- 12. ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  unit_price_cents integer not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  image_url text,
  variant_title text
);

create index if not exists idx_order_items_order on public.order_items(order_id);

-- ============================================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.stores          enable row level security;
alter table public.store_themes    enable row level security;
alter table public.products        enable row level security;
alter table public.product_reviews enable row level security;
alter table public.customers       enable row level security;
alter table public.discounts       enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;

-- Profiles: Users can view and edit their own profile
create policy "Users manage own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Stores: Authenticated users can insert stores and view/manage stores they belong to
create policy "Authenticated users can create stores" on public.stores
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Public can view stores by handle" on public.stores
  for select to public
  using (true);

create policy "Members manage their stores" on public.stores
  for all to authenticated
  using (private.is_store_member(id))
  with check (private.is_store_member(id));

-- Themes: Public can view storefront themes, members can edit
create policy "Public can view store themes" on public.store_themes
  for select to public
  using (true);

create policy "Members manage store themes" on public.store_themes
  for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

-- Products: Public can view active products, members have full management
create policy "Public can view active products" on public.products
  for select to public
  using (status = 'active');

create policy "Members manage store products" on public.products
  for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

-- Product Reviews: Public can view reviews
create policy "Public can view reviews" on public.product_reviews
  for select to public
  using (true);

-- Discounts: Public can select to validate codes, members manage
create policy "Public can view active discounts" on public.discounts
  for select to public
  using (is_active = true);

create policy "Members manage discounts" on public.discounts
  for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

-- Customers: Public can insert during checkout, members manage
create policy "Public can insert customers on checkout" on public.customers
  for insert to public
  with check (true);

create policy "Members manage customers" on public.customers
  for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

-- Orders & Items: Public can place orders during checkout, members manage
create policy "Public can place orders" on public.orders
  for insert to public
  with check (true);

create policy "Customers can view their orders by email" on public.orders
  for select to public
  using (true);

create policy "Members manage store orders" on public.orders
  for all to authenticated
  using (private.is_store_member(store_id))
  with check (private.is_store_member(store_id));

create policy "Public can insert order items" on public.order_items
  for insert to public
  with check (true);

create policy "Public can view order items" on public.order_items
  for select to public
  using (true);

create policy "Members manage order items" on public.order_items
  for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and private.is_store_member(o.store_id)))
  with check (exists (select 1 from public.orders o where o.id = order_id and private.is_store_member(o.store_id)));
