"use client";

/**
 * Velour data layer.
 *
 * One place for talking to Supabase from the browser. Unlike the original
 * inline fetches, this transparently refreshes an expired access token using
 * the stored refresh token, so a merchant who comes back an hour later no
 * longer hits "we couldn't create your store / load your data".
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;
// The sign-in flow writes the session here. We read the canonical key first
// and fall back to the older "morrow.*" key so this works whether the app is
// on the rebranded (velour) or original (morrow) build.
const SESSION_KEY = "velour.supabase.session";
const SESSION_KEY_FALLBACKS = ["morrow.supabase.session"];

export type Session = {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email?: string };
};

export type Store = {
  id: string;
  owner_id: string;
  name: string;
  handle: string;
  created_at: string;
};

export type Product = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  sku: string | null;
  inventory_count: number;
  status: "active" | "draft" | "archived";
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  unit_price_cents: number;
  quantity: number;
};

export type Order = {
  id: string;
  store_id: string;
  order_number: number;
  customer_id: string | null;
  customer_name: string | null;
  status: "pending" | "paid" | "fulfilled" | "refunded" | "cancelled";
  currency: string;
  subtotal_cents: number;
  total_cents: number;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  customers?: { name: string | null; email: string } | null;
};

export type Customer = {
  id: string;
  store_id: string;
  email: string;
  name: string | null;
  created_at: string;
};

export type Overview = {
  salesThisWeekCents: number;
  salesLastWeekCents: number;
  orderCount: number;
  customerCount: number;
  productCount: number;
  recentOrders: Order[];
  lowStock: Product[];
};

// ── session ───────────────────────────────────────────────────────────────
export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  for (const key of [SESSION_KEY, ...SESSION_KEY_FALLBACKS]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Session;
    } catch {
      /* keep trying */
    }
  }
  return null;
}

export function saveSession(session: Session | null) {
  if (typeof window === "undefined") return;
  const keys = [SESSION_KEY, ...SESSION_KEY_FALLBACKS];
  if (session) {
    // Write the canonical key and mirror to any fallback that already exists
    // so the sign-in code and dashboard never read a stale token.
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    for (const key of SESSION_KEY_FALLBACKS) {
      if (window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, JSON.stringify(session));
      }
    }
  } else {
    for (const key of keys) window.localStorage.removeItem(key);
  }
}

export function signOut() {
  saveSession(null);
}

async function refreshSession(): Promise<Session | null> {
  const current = loadSession();
  if (!current?.refresh_token) {
    saveSession(null);
    return null;
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: current.refresh_token }),
  });
  if (!res.ok) {
    saveSession(null);
    return null;
  }
  const data = await res.json();
  const next: Session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? current.refresh_token,
    user: data.user ?? current.user,
  };
  saveSession(next);
  return next;
}

// ── low-level REST ──────────────────────────────────────────────────────────
async function authedFetch(
  path: string,
  init: RequestInit,
  allowRetry = true,
): Promise<Response> {
  const session = loadSession();
  if (!session) throw new AuthError("Your session has ended. Please sign in again.");
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      ...(init.headers || {}),
    },
  });
  if (res.status === 401 && allowRetry) {
    const refreshed = await refreshSession();
    if (refreshed) return authedFetch(path, init, false);
    throw new AuthError("Your session has ended. Please sign in again.");
  }
  return res;
}

export class AuthError extends Error {}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await authedFetch(`/rest/v1${path}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const writeHeaders = { "Content-Type": "application/json", Prefer: "return=representation" };

// ── stores ──────────────────────────────────────────────────────────────────
export async function getMyStore(): Promise<Store | null> {
  const rows = await rest<Store[]>(`/stores?select=*&order=created_at.asc&limit=1`);
  return rows?.[0] ?? null;
}

export async function updateStore(id: string, patch: Partial<Pick<Store, "name" | "handle">>) {
  const rows = await rest<Store[]>(`/stores?id=eq.${id}`, {
    method: "PATCH",
    headers: writeHeaders,
    body: JSON.stringify(patch),
  });
  return rows?.[0];
}

// ── products ──────────────────────────────────────────────────────────────────
export async function listProducts(storeId: string): Promise<Product[]> {
  return rest<Product[]>(
    `/products?store_id=eq.${storeId}&select=*&order=created_at.desc`,
  );
}

export type ProductInput = {
  name: string;
  description?: string | null;
  price_cents: number;
  inventory_count?: number;
  sku?: string | null;
  image_url?: string | null;
  status?: Product["status"];
};

export async function createProduct(storeId: string, input: ProductInput): Promise<Product> {
  const rows = await rest<Product[]>(`/products`, {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({ store_id: storeId, ...input }),
  });
  return rows[0];
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  const rows = await rest<Product[]>(`/products?id=eq.${id}`, {
    method: "PATCH",
    headers: writeHeaders,
    body: JSON.stringify(patch),
  });
  return rows[0];
}

export async function deleteProduct(id: string): Promise<void> {
  await rest(`/products?id=eq.${id}`, { method: "DELETE" });
}

// ── customers ─────────────────────────────────────────────────────────────────
export async function listCustomers(storeId: string): Promise<Customer[]> {
  return rest<Customer[]>(
    `/customers?store_id=eq.${storeId}&select=*&order=created_at.desc`,
  );
}

export async function createCustomer(
  storeId: string,
  input: { email: string; name?: string | null },
): Promise<Customer> {
  const rows = await rest<Customer[]>(`/customers`, {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({ store_id: storeId, ...input }),
  });
  return rows[0];
}

// ── orders ────────────────────────────────────────────────────────────────────
export async function listOrders(storeId: string): Promise<Order[]> {
  return rest<Order[]>(
    `/orders?store_id=eq.${storeId}&select=*,order_items(*),customers(name,email)&order=created_at.desc`,
  );
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<Order> {
  const rows = await rest<Order[]>(`/orders?id=eq.${id}`, {
    method: "PATCH",
    headers: writeHeaders,
    body: JSON.stringify({ status }),
  });
  return rows[0];
}

/** Create an order with line items (used by manual entry and, later, checkout). */
export async function createOrder(
  storeId: string,
  input: {
    customerName?: string | null;
    customerId?: string | null;
    status?: Order["status"];
    items: { product_id?: string | null; name: string; unit_price_cents: number; quantity: number }[];
  },
): Promise<Order> {
  const subtotal = input.items.reduce((sum, i) => sum + i.unit_price_cents * i.quantity, 0);
  const orderRows = await rest<Order[]>(`/orders`, {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      store_id: storeId,
      customer_id: input.customerId ?? null,
      customer_name: input.customerName ?? null,
      status: input.status ?? "paid",
      subtotal_cents: subtotal,
      total_cents: subtotal,
    }),
  });
  const order = orderRows[0];
  if (input.items.length) {
    await rest(`/order_items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.items.map((i) => ({ ...i, order_id: order.id }))),
    });
  }
  return order;
}

// ── overview metrics ──────────────────────────────────────────────────────────
export async function getOverview(storeId: string): Promise<Overview> {
  const [orders, products, customers] = await Promise.all([
    listOrders(storeId),
    listProducts(storeId),
    listCustomers(storeId),
  ]);
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const paid = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
  const inWindow = (o: Order, start: number, end: number) => {
    const t = new Date(o.created_at).getTime();
    return t >= start && t < end;
  };
  const salesThisWeekCents = paid
    .filter((o) => inWindow(o, now - week, now))
    .reduce((s, o) => s + o.total_cents, 0);
  const salesLastWeekCents = paid
    .filter((o) => inWindow(o, now - 2 * week, now - week))
    .reduce((s, o) => s + o.total_cents, 0);
  return {
    salesThisWeekCents,
    salesLastWeekCents,
    orderCount: orders.length,
    customerCount: customers.length,
    productCount: products.length,
    recentOrders: orders.slice(0, 5),
    lowStock: products
      .filter((p) => p.status === "active" && p.inventory_count <= 5)
      .slice(0, 5),
  };
}

// ── formatting helpers ──────────────────────────────────────────────────────
export function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((cents || 0) / 100);
}

export function dollarsToCents(value: string): number {
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
