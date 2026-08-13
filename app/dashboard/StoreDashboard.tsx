"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import "./dashboard.css";
import {
  AuthError,
  Customer,
  Order,
  Overview,
  Product,
  ProductInput,
  Store,
  createCustomer,
  createOrder,
  createProduct,
  deleteProduct,
  dollarsToCents,
  getMyStore,
  getOverview,
  listCustomers,
  listOrders,
  listProducts,
  money,
  signOut,
  updateOrderStatus,
  updateProduct,
  updateStore,
} from "../lib/store-api";

const PRIMARY_NAV = ["Overview", "Orders", "Products", "Customers", "Marketing", "Sales channels"] as const;
const MANAGEMENT_NAV = ["Analytics", "Domains", "Integrations", "Settings"] as const;
type Section = (typeof PRIMARY_NAV)[number] | (typeof MANAGEMENT_NAV)[number];

const ORDER_STATUSES: Order["status"][] = ["pending", "paid", "fulfilled", "refunded", "cancelled"];

export default function StoreDashboard({
  onBack,
  onSignedOut,
}: {
  onBack: () => void;
  onSignedOut: () => void;
}) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<Section>("Overview");
  const [notice, setNotice] = useState("");

  const toast = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2600);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getMyStore();
        if (cancelled) return;
        if (!s) {
          setError("We couldn't find your store. Try signing in again.");
        } else {
          setStore(s);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof AuthError) {
          signOut();
          onSignedOut();
          return;
        }
        setError(e instanceof Error ? e.message : "Something went wrong loading your store.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onSignedOut]);

  const handleSignOut = () => {
    signOut();
    onSignedOut();
  };

  if (loading) {
    return (
      <main className="admin-shell">
        <div className="dash-loading">Loading your workspace…</div>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="admin-shell">
        <div className="dash-loading">
          <p>{error || "Store not found."}</p>
          <button className="button" onClick={onBack}>
            Back to Velour
          </button>
        </div>
      </main>
    );
  }

  const initial = store.name.trim().charAt(0).toUpperCase() || "V";
  const storeUrl = `${store.handle}.velour.live`;

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <button className="brand" onClick={onBack}>
          <span className="brand-mark">v</span>velour
        </button>
        <div className="store-switch">
          <span className="store-dot">{initial}</span>
          <div>
            <b>{store.name}</b>
            <small>{storeUrl}</small>
          </div>
          <span>⌄</span>
        </div>
        <div className="side-nav">
          {PRIMARY_NAV.map((x) => (
            <button className={active === x ? "selected" : ""} key={x} onClick={() => setActive(x)}>
              {x}
            </button>
          ))}
          <hr />
          {MANAGEMENT_NAV.map((x) => (
            <button className={active === x ? "selected" : ""} key={x} onClick={() => setActive(x)}>
              {x}
            </button>
          ))}
        </div>
        <div className="side-bottom">
          <button onClick={() => toast("Your Velour guide is here to help.")}>
            ? &nbsp; Help &amp; guides
          </button>
          <button className="profile" onClick={handleSignOut}>
            <span>{initial}</span>
            <b>Sign out</b>
            <i>⌄</i>
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-top">
          <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          <div>
            <a className="view-store" href={`https://${storeUrl}`} target="_blank" rel="noreferrer">
              View store ↗
            </a>
          </div>
        </header>
        <div className="content">
          {active === "Overview" && <OverviewSection store={store} onGoto={setActive} />}
          {active === "Products" && <ProductsSection store={store} toast={toast} />}
          {active === "Orders" && <OrdersSection store={store} toast={toast} />}
          {active === "Customers" && <CustomersSection store={store} toast={toast} />}
          {active === "Analytics" && <AnalyticsSection store={store} />}
          {active === "Marketing" && <MarketingSection store={store} toast={toast} />}
          {active === "Sales channels" && <SalesChannelsSection storeUrl={storeUrl} />}
          {active === "Domains" && <DomainsSection storeUrl={storeUrl} toast={toast} />}
          {active === "Integrations" && <IntegrationsSection toast={toast} />}
          {active === "Settings" && (
            <SettingsSection store={store} onUpdated={setStore} onSignOut={handleSignOut} toast={toast} />
          )}
        </div>
      </section>
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}

/* ───────────────────────── Overview ───────────────────────── */
function OverviewSection({ store, onGoto }: { store: Store; onGoto: (s: Section) => void }) {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getOverview(store.id).then(setData).catch((e) => setErr(e.message));
  }, [store.id]);

  const trend = (now: number, prev: number) => {
    if (prev <= 0) return now > 0 ? "+100%" : "0%";
    const pct = Math.round(((now - prev) / prev) * 100);
    return `${pct >= 0 ? "↗" : "↘"} ${Math.abs(pct)}%`;
  };

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">YOUR DAILY OVERVIEW</p>
          <h1>{store.name}</h1>
          <p>Here’s the lovely stuff happening with your shop.</p>
        </div>
        <button className="button dark" onClick={() => onGoto("Products")}>
          + Add product
        </button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <div className="metrics">
        <Metric label="SALES THIS WEEK" value={data ? money(data.salesThisWeekCents) : "—"} trend={data ? trend(data.salesThisWeekCents, data.salesLastWeekCents) : ""} />
        <Metric label="ORDERS" value={data ? String(data.orderCount) : "—"} />
        <Metric label="CUSTOMERS" value={data ? String(data.customerCount) : "—"} />
        <Metric label="PRODUCTS" value={data ? String(data.productCount) : "—"} />
      </div>

      <div className="admin-grid">
        <section className="panel orders">
          <div className="panel-heading">
            <div>
              <h3>Recent orders</h3>
              <p>Your newest sales, all in one place.</p>
            </div>
            <button onClick={() => onGoto("Orders")}>View all →</button>
          </div>
          {!data?.recentOrders.length ? (
            <EmptyRow text="No orders yet. They’ll show up here the moment you make your first sale." />
          ) : (
            data.recentOrders.map((o) => (
              <div className="order" key={o.id}>
                <span className="order-avatar">
                  {(o.customer_name || o.customers?.name || o.customers?.email || "•").charAt(0).toUpperCase()}
                </span>
                <div>
                  <b>#{o.order_number} · {o.customer_name || o.customers?.name || o.customers?.email || "Guest"}</b>
                  <small>{new Date(o.created_at).toLocaleDateString()}</small>
                </div>
                <strong>{money(o.total_cents, o.currency)}</strong>
              </div>
            ))
          )}
        </section>

        <section className="panel products">
          <div className="panel-heading">
            <div>
              <h3>Low in stock</h3>
              <p>Keep an eye on these favorites.</p>
            </div>
            <button onClick={() => onGoto("Products")}>Manage →</button>
          </div>
          {!data?.lowStock.length ? (
            <EmptyRow text="Nothing running low. Add products to track inventory here." />
          ) : (
            data.lowStock.map((p) => (
              <div className="stock" key={p.id}>
                <span className="product-thumb" />
                <div>
                  <b>{p.name}</b>
                  <small>{p.inventory_count} left</small>
                </div>
                <span className="pill">{money(p.price_cents, p.currency)}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="metric">
      <small>{label}</small>
      <b>{value}</b>
      {trend ? <span>{trend}</span> : <span className="muted">—</span>}
      <em>vs. last week</em>
    </div>
  );
}

/* ───────────────────────── Products ───────────────────────── */
function ProductsSection({ store, toast }: { store: Store; toast: (s: string) => void }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [err, setErr] = useState("");

  const reload = useCallback(() => {
    listProducts(store.id).then(setProducts).catch((e) => setErr(e.message));
  }, [store.id]);

  useEffect(() => reload(), [reload]);

  const remove = async (p: Product) => {
    try {
      await deleteProduct(p.id);
      toast(`Removed “${p.name}”.`);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn’t remove product.");
    }
  };

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">CATALOG</p>
          <h1>Products</h1>
          <p>Everything you sell, in one calm place.</p>
        </div>
        <button className="button dark" onClick={() => setEditing("new")}>
          + Add product
        </button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <section className="panel">
        {!products ? (
          <EmptyRow text="Loading…" />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products yet"
            body="Add your first product to make your storefront feel like yours."
            cta="Add a product"
            onCta={() => setEditing("new")}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Status</th>
                <th>Inventory</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-title">
                      <span className="product-thumb sm" />
                      <div>
                        <b>{p.name}</b>
                        {p.sku && <small>SKU {p.sku}</small>}
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                  <td>{p.inventory_count}</td>
                  <td>{money(p.price_cents, p.currency)}</td>
                  <td className="row-actions">
                    <button onClick={() => setEditing(p)}>Edit</button>
                    <button className="danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {editing && (
        <ProductModal
          store={store}
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            toast(msg);
            reload();
          }}
        />
      )}
    </>
  );
}

function ProductModal({
  store,
  product,
  onClose,
  onSaved,
}: {
  store: Store;
  product: Product | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? (product.price_cents / 100).toFixed(2) : "");
  const [inventory, setInventory] = useState(String(product?.inventory_count ?? 0));
  const [sku, setSku] = useState(product?.sku ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<Product["status"]>(product?.status ?? "active");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Give your product a name.");
    setBusy(true);
    setErr("");
    const input: ProductInput = {
      name: name.trim(),
      price_cents: dollarsToCents(price),
      inventory_count: Number(inventory) || 0,
      sku: sku.trim() || null,
      description: description.trim() || null,
      status,
    };
    try {
      if (product) {
        await updateProduct(product.id, input);
        onSaved(`Updated “${input.name}”.`);
      } else {
        await createProduct(store.id, input);
        onSaved(`Added “${input.name}”.`);
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Couldn’t save product.");
      setBusy(false);
    }
  };

  return (
    <Modal title={product ? "Edit product" : "New product"} onClose={onClose}>
      <form onSubmit={submit} className="dash-form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cloud Mug, Oat" required />
        </label>
        <div className="form-row">
          <label>
            Price (USD)
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="24.00" inputMode="decimal" />
          </label>
          <label>
            Inventory
            <input value={inventory} onChange={(e) => setInventory(e.target.value)} inputMode="numeric" />
          </label>
        </div>
        <div className="form-row">
          <label>
            SKU
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="CM-OAT-01" />
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as Product["status"])}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="A few warm words about it." />
        </label>
        {err && <p className="dash-error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="button" disabled={busy}>{busy ? "Saving…" : product ? "Save changes" : "Add product"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────────────────────── Orders ───────────────────────── */
function OrdersSection({ store, toast }: { store: Store; toast: (s: string) => void }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const reload = useCallback(() => {
    listOrders(store.id).then(setOrders).catch((e) => setErr(e.message));
  }, [store.id]);

  useEffect(() => reload(), [reload]);

  const setStatus = async (o: Order, status: Order["status"]) => {
    try {
      await updateOrderStatus(o.id, status);
      toast(`Order #${o.order_number} → ${status}.`);
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn’t update order.");
    }
  };

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">SALES</p>
          <h1>Orders</h1>
          <p>Every sale, from first hello to fulfilled.</p>
        </div>
        <button className="button dark" onClick={() => setCreating(true)}>+ New order</button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <section className="panel">
        {!orders ? (
          <EmptyRow text="Loading…" />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            body="When a customer checks out — or you log a sale manually — it’ll appear here."
            cta="Log an order"
            onCta={() => setCreating(true)}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><b>#{o.order_number}</b></td>
                  <td>{o.customer_name || o.customers?.name || o.customers?.email || "Guest"}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>{money(o.total_cents, o.currency)}</td>
                  <td>
                    <select className={`status-select ${o.status}`} value={o.status} onChange={(e) => setStatus(o, e.target.value as Order["status"])}>
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {creating && (
        <NewOrderModal
          store={store}
          onClose={() => setCreating(false)}
          onSaved={(msg) => {
            setCreating(false);
            toast(msg);
            reload();
          }}
        />
      )}
    </>
  );
}

function NewOrderModal({ store, onClose, onSaved }: { store: Store; onClose: () => void; onSaved: (m: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState<{ product_id: string; quantity: number }[]>([{ product_id: "", quantity: 1 }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    listProducts(store.id).then((p) => setProducts(p.filter((x) => x.status !== "archived")));
  }, [store.id]);

  const total = lines.reduce((sum, l) => {
    const p = products.find((x) => x.id === l.product_id);
    return sum + (p ? p.price_cents * l.quantity : 0);
  }, 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const items = lines
      .map((l) => {
        const p = products.find((x) => x.id === l.product_id);
        return p ? { product_id: p.id, name: p.name, unit_price_cents: p.price_cents, quantity: l.quantity } : null;
      })
      .filter(Boolean) as { product_id: string; name: string; unit_price_cents: number; quantity: number }[];
    if (!items.length) return setErr("Add at least one product to the order.");
    setBusy(true);
    setErr("");
    try {
      await createOrder(store.id, { customerName: customerName.trim() || null, status: "paid", items });
      onSaved("Order created.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Couldn’t create order.");
      setBusy(false);
    }
  };

  return (
    <Modal title="New order" onClose={onClose}>
      {products.length === 0 ? (
        <p className="dash-hint">Add a product first — orders are built from your catalog.</p>
      ) : (
        <form onSubmit={submit} className="dash-form">
          <label>
            Customer name (optional)
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Lena Rivers" />
          </label>
          {lines.map((line, i) => (
            <div className="form-row" key={i}>
              <label>
                Product
                <select
                  value={line.product_id}
                  onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, product_id: e.target.value } : l)))}
                >
                  <option value="">Choose…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {money(p.price_cents)}</option>
                  ))}
                </select>
              </label>
              <label className="qty">
                Qty
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, quantity: Math.max(1, Number(e.target.value)) } : l)))}
                />
              </label>
            </div>
          ))}
          <button type="button" className="ghost small" onClick={() => setLines((ls) => [...ls, { product_id: "", quantity: 1 }])}>
            + Add line
          </button>
          <div className="order-total">Total <b>{money(total)}</b></div>
          {err && <p className="dash-error">{err}</p>}
          <div className="form-actions">
            <button type="button" className="ghost" onClick={onClose}>Cancel</button>
            <button className="button" disabled={busy}>{busy ? "Creating…" : "Create order"}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ───────────────────────── Customers ───────────────────────── */
function CustomersSection({ store, toast }: { store: Store; toast: (s: string) => void }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  const reload = useCallback(() => {
    listCustomers(store.id).then(setCustomers).catch((e) => setErr(e.message));
  }, [store.id]);

  useEffect(() => reload(), [reload]);

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">PEOPLE</p>
          <h1>Customers</h1>
          <p>The humans who love what you make.</p>
        </div>
        <button className="button dark" onClick={() => setAdding(true)}>+ Add customer</button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <section className="panel">
        {!customers ? (
          <EmptyRow text="Loading…" />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" body="Add customers, or they’ll be created automatically as orders come in." cta="Add a customer" onCta={() => setAdding(true)} />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Since</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><div className="cell-title"><span className="order-avatar">{(c.name || c.email).charAt(0).toUpperCase()}</span><b>{c.name || "—"}</b></div></td>
                  <td>{c.email}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {adding && (
        <AddCustomerModal
          store={store}
          onClose={() => setAdding(false)}
          onSaved={(m) => {
            setAdding(false);
            toast(m);
            reload();
          }}
        />
      )}
    </>
  );
}

function AddCustomerModal({ store, onClose, onSaved }: { store: Store; onClose: () => void; onSaved: (m: string) => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setErr("An email is required.");
    setBusy(true);
    setErr("");
    try {
      await createCustomer(store.id, { email: email.trim(), name: name.trim() || null });
      onSaved("Customer added.");
    } catch (e2) {
      setErr(e2 instanceof Error && e2.message.includes("duplicate") ? "That customer already exists." : e2 instanceof Error ? e2.message : "Couldn’t add customer.");
      setBusy(false);
    }
  };

  return (
    <Modal title="Add customer" onClose={onClose}>
      <form onSubmit={submit} className="dash-form">
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lena Rivers" /></label>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lena@example.com" required /></label>
        {err && <p className="dash-error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="button" disabled={busy}>{busy ? "Adding…" : "Add customer"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────────────────────── Analytics ───────────────────────── */
function AnalyticsSection({ store }: { store: Store }) {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    listOrders(store.id).then(setOrders).catch(() => setOrders([]));
  }, [store.id]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const paid = (orders || []).filter((o) => o.status === "paid" || o.status === "fulfilled");
  const byDay = days.map((d) => {
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const cents = paid
      .filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= d.getTime() && t < next.getTime();
      })
      .reduce((s, o) => s + o.total_cents, 0);
    return { d, cents };
  });
  const max = Math.max(1, ...byDay.map((b) => b.cents));
  const totalRevenue = paid.reduce((s, o) => s + o.total_cents, 0);
  const avgOrder = paid.length ? Math.round(totalRevenue / paid.length) : 0;

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">INSIGHTS</p>
          <h1>Analytics</h1>
          <p>How your shop is doing — in plain language.</p>
        </div>
      </div>
      <div className="metrics">
        <Metric label="TOTAL REVENUE" value={money(totalRevenue)} />
        <Metric label="PAID ORDERS" value={String(paid.length)} />
        <Metric label="AVG ORDER VALUE" value={money(avgOrder)} />
        <Metric label="ALL ORDERS" value={String((orders || []).length)} />
      </div>
      <section className="panel sales">
        <div className="panel-heading">
          <div>
            <h3>Sales over time</h3>
            <p>Last 7 days</p>
          </div>
        </div>
        <div className="bar-chart">
          {byDay.map((b, i) => (
            <div className="bar-col" key={i}>
              <div className="bar" style={{ height: `${Math.round((b.cents / max) * 100)}%` }} title={money(b.cents)} />
              <small>{b.d.toLocaleDateString("en-US", { weekday: "short" })}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ───────────────────────── Marketing ───────────────────────── */
function MarketingSection({ store, toast }: { store: Store; toast: (s: string) => void }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  useEffect(() => {
    listCustomers(store.id).then(setCustomers).catch(() => setCustomers([]));
  }, [store.id]);

  const emails = (customers || []).map((c) => c.email).join(", ");

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">GROW</p>
          <h1>Marketing</h1>
          <p>Gentle nudges that turn browsers into buyers.</p>
        </div>
      </div>
      <div className="admin-grid">
        <section className="panel nudge">
          <span>✦</span>
          <div>
            <h3>Email your customers</h3>
            <p>{customers?.length ? `You have ${customers.length} customer${customers.length === 1 ? "" : "s"} ready to hear from you.` : "Collect customers first, then send your first announcement."}</p>
            <button
              disabled={!customers?.length}
              onClick={() => {
                navigator.clipboard?.writeText(emails);
                toast("Customer emails copied to clipboard.");
              }}
            >
              Copy customer emails →
            </button>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h3>Share your store</h3><p>Your storefront link, ready to post.</p></div></div>
          <div className="share-link">
            <code>https://{store.handle}.velour.live</code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`https://${store.handle}.velour.live`);
                toast("Store link copied.");
              }}
            >
              Copy
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

/* ───────────────────────── Sales channels ───────────────────────── */
function SalesChannelsSection({ storeUrl }: { storeUrl: string }) {
  const channels = [
    { name: "Online store", detail: storeUrl, status: "Live" },
    { name: "Point of sale", detail: "Sell in person", status: "Soon" },
    { name: "Instagram", detail: "Tag products in posts", status: "Soon" },
    { name: "TikTok Shop", detail: "Sell in-feed", status: "Soon" },
  ];
  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">REACH</p>
          <h1>Sales channels</h1>
          <p>Every place your shop can meet customers.</p>
        </div>
      </div>
      <section className="panel">
        <table className="data-table">
          <tbody>
            {channels.map((c) => (
              <tr key={c.name}>
                <td><b>{c.name}</b></td>
                <td>{c.detail}</td>
                <td><span className={`badge ${c.status === "Live" ? "active" : "draft"}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

/* ───────────────────────── Domains ───────────────────────── */
function DomainsSection({ storeUrl, toast }: { storeUrl: string; toast: (s: string) => void }) {
  const [custom, setCustom] = useState("");
  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">ADDRESS</p>
          <h1>Domains</h1>
          <p>Where people find you.</p>
        </div>
      </div>
      <section className="panel">
        <div className="domain-row">
          <div>
            <b>{storeUrl}</b>
            <small>Your free Velour address · Active</small>
          </div>
          <span className="badge active">Primary</span>
        </div>
        <div className="domain-connect">
          <label>
            Connect a custom domain
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="shop.yourbrand.com" />
          </label>
          <button className="button" onClick={() => toast(custom ? `We’ll help you point ${custom} here. (Coming soon)` : "Enter a domain to connect.")}>
            Connect
          </button>
        </div>
      </section>
    </>
  );
}

/* ───────────────────────── Integrations ───────────────────────── */
function IntegrationsSection({ toast }: { toast: (s: string) => void }) {
  const items = [
    { name: "Stripe", detail: "Accept payments at checkout", cta: "Connect" },
    { name: "Resend", detail: "Send order + marketing emails", cta: "Connect" },
    { name: "Shippo", detail: "Print shipping labels", cta: "Connect" },
  ];
  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">CONNECT</p>
          <h1>Integrations</h1>
          <p>Plug in the tools you already love.</p>
        </div>
      </div>
      <section className="panel">
        <table className="data-table">
          <tbody>
            {items.map((i) => (
              <tr key={i.name}>
                <td><b>{i.name}</b></td>
                <td>{i.detail}</td>
                <td className="row-actions"><button onClick={() => toast(`${i.name} connection coming soon.`)}>{i.cta}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

/* ───────────────────────── Settings ───────────────────────── */
function SettingsSection({
  store,
  onUpdated,
  onSignOut,
  toast,
}: {
  store: Store;
  onUpdated: (s: Store) => void;
  onSignOut: () => void;
  toast: (s: string) => void;
}) {
  const [name, setName] = useState(store.name);
  const [handle, setHandle] = useState(store.handle);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const cleanHandle = handle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
    if (cleanHandle.length < 3) {
      setErr("Store link needs at least three letters or numbers.");
      setBusy(false);
      return;
    }
    try {
      const updated = await updateStore(store.id, { name: name.trim(), handle: cleanHandle });
      if (updated) onUpdated(updated);
      setHandle(cleanHandle);
      toast("Settings saved.");
    } catch (e2) {
      setErr(e2 instanceof Error && e2.message.includes("duplicate") ? "That store link is taken." : e2 instanceof Error ? e2.message : "Couldn’t save settings.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">MANAGE</p>
          <h1>Settings</h1>
          <p>Your store’s name, address, and account.</p>
        </div>
      </div>
      <section className="panel">
        <form onSubmit={save} className="dash-form settings">
          <label>
            Store name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Store link
            <div className="handle-input">
              <input value={handle} onChange={(e) => setHandle(e.target.value)} />
              <span>.velour.live</span>
            </div>
          </label>
          {err && <p className="dash-error">{err}</p>}
          <div className="form-actions">
            <button className="button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h3>Account</h3><p>Signed in as {store.owner_id ? "the store owner" : "you"}.</p></div></div>
        <button className="ghost danger" onClick={onSignOut}>Sign out</button>
      </section>
    </>
  );
}

/* ───────────────────────── shared UI ───────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="dash-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h3>{title}</h3>
          <button className="dash-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="empty-row">{text}</div>;
}

function EmptyState({ title, body, cta, onCta }: { title: string; body: string; cta: string; onCta: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">✦</div>
      <b>{title}</b>
      <p>{body}</p>
      <button className="button" onClick={onCta}>{cta} →</button>
    </div>
  );
}
