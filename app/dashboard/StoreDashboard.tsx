"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import "./dashboard.css";
import {
  AuthError,
  Customer,
  Discount,
  Order,
  Overview,
  Product,
  ProductInput,
  Store,
  StoreTheme,
  DEFAULT_THEME,
  createCustomer,
  createDiscount,
  createOrder,
  createProduct,
  deleteProduct,
  dollarsToCents,
  fulfillOrder,
  getMyStore,
  getOverview,
  getStoreTheme,
  listCustomers,
  listDiscounts,
  listOrders,
  listProducts,
  money,
  signOut,
  updateOrderStatus,
  updateProduct,
  updateStore,
  updateStoreTheme,
} from "../lib/store-api";

const PRIMARY_NAV = [
  "Overview",
  "Orders",
  "Products",
  "Customers",
  "Discounts",
  "Theme customizer",
  "Marketing",
  "Sales channels",
] as const;
const MANAGEMENT_NAV = ["Analytics", "Domains", "Integrations", "Settings"] as const;
type Section = (typeof PRIMARY_NAV)[number] | (typeof MANAGEMENT_NAV)[number];

const ORDER_STATUSES: Order["status"][] = ["pending", "paid", "fulfilled", "refunded", "cancelled"];

export default function StoreDashboard({
  onBack,
  onSignedOut,
  onOpenStorefront,
}: {
  onBack: () => void;
  onSignedOut: () => void;
  onOpenStorefront?: () => void;
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
        <div className="dash-loading">Loading your Velour workspace…</div>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="admin-shell">
        <div className="dash-loading">
          <p>{error || "Store not found."}</p>
          <button className="button" onClick={onBack}>
            Back to Velour Home
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
              {x === "Theme customizer" ? "🎨 Theme Editor" : x === "Discounts" ? "🏷️ Discounts" : x}
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
          <button onClick={() => toast("Velour Studio Support is active.")}>
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
            {onOpenStorefront ? (
              <button
                className="view-store"
                onClick={onOpenStorefront}
                style={{ background: "#eef4ea", fontWeight: "600", cursor: "pointer" }}
              >
                🛍️ Open Live Storefront ↗
              </button>
            ) : (
              <a className="view-store" href={`https://${storeUrl}`} target="_blank" rel="noreferrer">
                View store ↗
              </a>
            )}
          </div>
        </header>
        <div className="content">
          {active === "Overview" && <OverviewSection store={store} onGoto={setActive} onOpenStorefront={onOpenStorefront} />}
          {active === "Products" && <ProductsSection store={store} toast={toast} />}
          {active === "Orders" && <OrdersSection store={store} toast={toast} />}
          {active === "Customers" && <CustomersSection store={store} toast={toast} />}
          {active === "Discounts" && <DiscountsSection store={store} toast={toast} />}
          {active === "Theme customizer" && <ThemeCustomizerSection store={store} toast={toast} onOpenStorefront={onOpenStorefront} />}
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
function OverviewSection({
  store,
  onGoto,
  onOpenStorefront,
}: {
  store: Store;
  onGoto: (s: Section) => void;
  onOpenStorefront?: () => void;
}) {
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
          <p className="section-kicker">YOUR STORE DASHBOARD</p>
          <h1>{store.name}</h1>
          <p>Here’s the real-time performance of your e-commerce storefront.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {onOpenStorefront && (
            <button className="button" style={{ background: "#edf4da", color: "#17372e" }} onClick={onOpenStorefront}>
              View Storefront ↗
            </button>
          )}
          <button className="button dark" onClick={() => onGoto("Products")}>
            + Add product
          </button>
        </div>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <div className="metrics">
        <Metric
          label="TOTAL REVENUE"
          value={data ? money(data.salesThisWeekCents) : "—"}
          trend={data ? trend(data.salesThisWeekCents, data.salesLastWeekCents) : ""}
        />
        <Metric label="ORDERS" value={data ? String(data.orderCount) : "—"} />
        <Metric label="CUSTOMERS" value={data ? String(data.customerCount) : "—"} />
        <Metric label="ACTIVE PRODUCTS" value={data ? String(data.productCount) : "—"} />
      </div>

      <div className="admin-grid">
        <section className="panel orders">
          <div className="panel-heading">
            <div>
              <h3>Recent orders</h3>
              <p>Your newest sales and checkout orders.</p>
            </div>
            <button onClick={() => onGoto("Orders")}>Manage orders →</button>
          </div>
          {!data?.recentOrders.length ? (
            <EmptyRow text="No orders yet. They’ll show up here the moment a customer checks out." />
          ) : (
            data.recentOrders.map((o) => (
              <div className="order" key={o.id}>
                <span className="order-avatar">
                  {(o.customer_name || o.customers?.name || o.customers?.email || "•").charAt(0).toUpperCase()}
                </span>
                <div>
                  <b>#{o.order_number} · {o.customer_name || o.customers?.name || o.customers?.email || "Customer"}</b>
                  <small>
                    {new Date(o.created_at).toLocaleDateString()} ·{" "}
                    <span className={`badge ${o.status}`} style={{ fontSize: "10px", padding: "1px 6px" }}>
                      {o.status}
                    </span>
                  </small>
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
              <p>Items with 6 or fewer units remaining.</p>
            </div>
            <button onClick={() => onGoto("Products")}>Manage inventory →</button>
          </div>
          {!data?.lowStock.length ? (
            <EmptyRow text="All products are well stocked." />
          ) : (
            data.lowStock.map((p) => (
              <div className="stock" key={p.id}>
                <img
                  src={p.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"}
                  alt=""
                  className="product-thumb sm"
                />
                <div>
                  <b>{p.name}</b>
                  <small style={{ color: "#b84224", fontWeight: "600" }}>{p.inventory_count} remaining</small>
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
      <em>vs. last period</em>
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
    if (!window.confirm(`Are you sure you want to delete "${p.name}"?`)) return;
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
          <p className="section-kicker">CATALOG &amp; INVENTORY</p>
          <h1>Products</h1>
          <p>Manage your product catalog, categories, pricing, and stock.</p>
        </div>
        <button className="button dark" onClick={() => setEditing("new")}>
          + Add product
        </button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <section className="panel">
        {!products ? (
          <EmptyRow text="Loading products…" />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products yet"
            body="Add your first product to make your storefront feel alive."
            cta="Add a product"
            onCta={() => setEditing("new")}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
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
                      <img
                        src={p.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"}
                        alt=""
                        className="product-thumb sm"
                      />
                      <div>
                        <b>{p.name}</b>
                        {p.sku && <small>SKU: {p.sku}</small>}
                      </div>
                    </div>
                  </td>
                  <td>{p.category || "General"}</td>
                  <td><span className={`badge ${p.status}`}>{p.status}</span></td>
                  <td>
                    <strong style={{ color: p.inventory_count <= 4 ? "#b84224" : "inherit" }}>
                      {p.inventory_count} units
                    </strong>
                  </td>
                  <td>
                    <b>{money(p.price_cents, p.currency)}</b>
                    {p.compare_at_price_cents && (
                      <small style={{ display: "block", textDecoration: "line-through", color: "#8a978c" }}>
                        {money(p.compare_at_price_cents, p.currency)}
                      </small>
                    )}
                  </td>
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
  const [category, setCategory] = useState(product?.category ?? "Ceramics");
  const [price, setPrice] = useState(product ? (product.price_cents / 100).toFixed(2) : "");
  const [comparePrice, setComparePrice] = useState(
    product?.compare_at_price_cents ? (product.compare_at_price_cents / 100).toFixed(2) : ""
  );
  const [inventory, setInventory] = useState(String(product?.inventory_count ?? 10));
  const [sku, setSku] = useState(product?.sku ?? "");
  const [imageUrl, setImageUrl] = useState(
    product?.image_url ?? "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
  );
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
      category: category.trim(),
      price_cents: dollarsToCents(price),
      compare_at_price_cents: comparePrice ? dollarsToCents(comparePrice) : null,
      inventory_count: Number(inventory) || 0,
      sku: sku.trim() || null,
      image_url: imageUrl.trim() || null,
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
          Product Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hand-thrown Mug" required />
        </label>
        <div className="form-row">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Ceramics">Ceramics</option>
              <option value="Home Decor">Home Decor</option>
              <option value="Kitchen & Dining">Kitchen & Dining</option>
              <option value="Textiles">Textiles</option>
              <option value="Home Goods">Home Goods</option>
              <option value="General">General</option>
            </select>
          </label>
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as Product["status"])}>
              <option value="active">Active (Visible in Store)</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        <div className="form-row">
          <label>
            Price ($ USD)
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="34.00" inputMode="decimal" required />
          </label>
          <label>
            Compare-at / Original Price (optional)
            <input value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="42.00" inputMode="decimal" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Inventory Units
            <input value={inventory} onChange={(e) => setInventory(e.target.value)} inputMode="numeric" required />
          </label>
          <label>
            SKU
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="JUN-MUG-01" />
          </label>
        </div>
        <label>
          Image URL
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." />
        </label>
        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="A few warm words about materials, dimensions, and craft."
          />
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
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);
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
          <p className="section-kicker">SALES &amp; SHIPMENTS</p>
          <h1>Orders</h1>
          <p>Every online sale, line items, and fulfillment tracking.</p>
        </div>
        <button className="button dark" onClick={() => setCreating(true)}>+ New order</button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <section className="panel">
        {!orders ? (
          <EmptyRow text="Loading orders…" />
        ) : orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            body="When customers complete checkout in your storefront, their orders appear here in real-time."
            cta="Log manual sale"
            onCta={() => setCreating(true)}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><b>#{o.order_number}</b></td>
                  <td>
                    <div>
                      <b>{o.customer_name || o.customers?.name || "Customer"}</b>
                      <small style={{ color: "#8a978c", display: "block" }}>{o.customer_email || o.customers?.email || "—"}</small>
                    </div>
                  </td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>{o.order_items?.length || 1} item{o.order_items?.length === 1 ? "" : "s"}</td>
                  <td><b>{money(o.total_cents, o.currency)}</b></td>
                  <td>
                    <select
                      className={`status-select ${o.status}`}
                      value={o.status}
                      onChange={(e) => setStatus(o, e.target.value as Order["status"])}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="row-actions">
                    <button onClick={() => setInspectingOrder(o)}>Details →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {inspectingOrder && (
        <OrderDetailModal
          order={inspectingOrder}
          onClose={() => setInspectingOrder(null)}
          onFulfill={async (carrier, tracking) => {
            await fulfillOrder(inspectingOrder.id, carrier, tracking);
            toast(`Order #${inspectingOrder.order_number} fulfilled with ${carrier}.`);
            setInspectingOrder(null);
            reload();
          }}
        />
      )}

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

function OrderDetailModal({
  order,
  onClose,
  onFulfill,
}: {
  order: Order;
  onClose: () => void;
  onFulfill: (carrier: string, tracking: string) => Promise<void>;
}) {
  const [carrier, setCarrier] = useState(order.carrier || "USPS Priority");
  const [tracking, setTracking] = useState(order.tracking_number || "9400111899223192083112");
  const [busy, setBusy] = useState(false);

  const handleFulfill = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onFulfill(carrier, tracking);
    setBusy(false);
  };

  return (
    <Modal title={`Order #${order.order_number} Details`} onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <b>{order.customer_name || "Customer"}</b> ({order.customer_email || "Guest"})
          <small style={{ display: "block", color: "#8a978c" }}>
            Placed on {new Date(order.created_at).toLocaleString()}
          </small>
        </div>
        <span className={`badge ${order.status}`}>{order.status}</span>
      </div>

      {order.shipping_address && (
        <div style={{ background: "#f8faf4", border: "1px solid #e1e7df", padding: "12px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
          <b>Shipping Address:</b>
          <p style={{ margin: "4px 0 0", color: "#5b6b60" }}>
            {order.shipping_address.street}, {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}, {order.shipping_address.country}
          </p>
        </div>
      )}

      <h4 style={{ margin: "0 0 8px", fontSize: "14px" }}>Line Items</h4>
      <div className="order-detail-items">
        {order.order_items?.map((item) => (
          <div key={item.id} className="order-detail-row">
            <img
              src={item.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"}
              alt=""
              className="order-detail-img"
            />
            <div style={{ flex: 1 }}>
              <b>{item.name}</b>
              <small style={{ display: "block", color: "#8a978c" }}>
                {money(item.unit_price_cents)} × {item.quantity}
              </small>
            </div>
            <strong>{money(item.unit_price_cents * item.quantity)}</strong>
          </div>
        ))}
      </div>

      <div className="order-total">
        <span>Order Total:</span>
        <b>{money(order.total_cents)}</b>
      </div>

      {order.status !== "fulfilled" && (
        <form onSubmit={handleFulfill} style={{ marginTop: "20px", borderTop: "1px solid #e2ded4", paddingTop: "16px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "14px" }}>Fulfill &amp; Add Tracking</h4>
          <div className="form-row">
            <label>
              Carrier
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="USPS Priority" required />
            </label>
            <label>
              Tracking Number
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="9400..." required />
            </label>
          </div>
          <div className="form-actions" style={{ marginTop: "12px" }}>
            <button className="button" disabled={busy}>
              {busy ? "Fulfilling…" : "Mark as Shipped & Fulfill"}
            </button>
          </div>
        </form>
      )}
    </Modal>
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
      onSaved("Order logged successfully.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Couldn’t create order.");
      setBusy(false);
    }
  };

  return (
    <Modal title="New manual order" onClose={onClose}>
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
                <option value="">Choose a product…</option>
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
    </Modal>
  );
}

/* ───────────────────────── Discounts ───────────────────────── */
function DiscountsSection({ store, toast }: { store: Store; toast: (s: string) => void }) {
  const [discounts, setDiscounts] = useState<Discount[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const reload = useCallback(() => {
    listDiscounts(store.id).then(setDiscounts).catch((e) => setErr(e.message));
  }, [store.id]);

  useEffect(() => reload(), [reload]);

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">PROMOTIONS &amp; CONVERSIONS</p>
          <h1>Discounts &amp; Coupons</h1>
          <p>Create promo codes for marketing campaigns and special releases.</p>
        </div>
        <button className="button dark" onClick={() => setCreating(true)}>
          + Create discount
        </button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <section className="panel">
        {!discounts ? (
          <EmptyRow text="Loading discounts…" />
        ) : discounts.length === 0 ? (
          <EmptyState
            title="No discounts created"
            body="Create codes like VELOUR10 or WELCOME20 to incentivize first-time orders."
            cta="Create a discount"
            onCta={() => setCreating(true)}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Spend</th>
                <th>Redemptions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td><code style={{ background: "#edf4da", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold" }}>{d.code}</code></td>
                  <td style={{ textTransform: "capitalize" }}>{d.type.replace("_", " ")}</td>
                  <td>{d.type === "percentage" ? `${d.value}%` : d.type === "free_shipping" ? "Free Shipping" : money(d.value)}</td>
                  <td>{d.min_spend_cents ? money(d.min_spend_cents) : "No minimum"}</td>
                  <td><b>{d.usage_count}</b> used</td>
                  <td><span className={`badge ${d.is_active ? "active" : "draft"}`}>{d.is_active ? "Active" : "Paused"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {creating && (
        <NewDiscountModal
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

function NewDiscountModal({ store, onClose, onSaved }: { store: Store; onClose: () => void; onSaved: (m: string) => void }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<Discount["type"]>("percentage");
  const [value, setValue] = useState("15");
  const [minSpend, setMinSpend] = useState("0");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return setErr("Enter a coupon code.");
    setBusy(true);
    setErr("");
    try {
      await createDiscount(store.id, {
        code: code.trim(),
        type,
        value: type === "percentage" ? Number(value) : dollarsToCents(value),
        min_spend_cents: dollarsToCents(minSpend),
      });
      onSaved(`Created code ${code.toUpperCase()}.`);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Couldn’t create discount.");
      setBusy(false);
    }
  };

  return (
    <Modal title="Create discount code" onClose={onClose}>
      <form onSubmit={submit} className="dash-form">
        <label>
          Discount Code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SUMMER15"
            required
          />
        </label>
        <div className="form-row">
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as Discount["type"])}>
              <option value="percentage">Percentage Discount (%)</option>
              <option value="fixed">Fixed Dollar Amount ($)</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </label>
          {type !== "free_shipping" && (
            <label>
              Value {type === "percentage" ? "(%)" : "($ USD)"}
              <input value={value} onChange={(e) => setValue(e.target.value)} required />
            </label>
          )}
        </div>
        <label>
          Minimum Spend Requirement ($ USD, 0 for none)
          <input value={minSpend} onChange={(e) => setMinSpend(e.target.value)} placeholder="0.00" />
        </label>
        {err && <p className="dash-error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="button" disabled={busy}>{busy ? "Creating…" : "Save discount"}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────────────────────── Theme Customizer ───────────────────────── */
function ThemeCustomizerSection({
  store,
  toast,
  onOpenStorefront,
}: {
  store: Store;
  toast: (s: string) => void;
  onOpenStorefront?: () => void;
}) {
  const [theme, setTheme] = useState<StoreTheme>(DEFAULT_THEME);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStoreTheme(store.id).then(setTheme);
  }, [store.id]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await updateStoreTheme(store.id, theme);
      setTheme(updated);
      toast("Storefront theme updated.");
    } catch {
      toast("Failed to update theme.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">STOREFRONT BRANDING</p>
          <h1>Theme Customizer</h1>
          <p>Style your store’s announcement bar, editorial banner, and hero visuals.</p>
        </div>
        {onOpenStorefront && (
          <button className="button dark" onClick={onOpenStorefront}>
            Preview Live Storefront ↗
          </button>
        )}
      </div>

      <div className="theme-customizer-grid">
        <section className="panel">
          <form onSubmit={save} className="dash-form">
            <label>
              Announcement Bar Message
              <input
                value={theme.announcement}
                onChange={(e) => setTheme({ ...theme, announcement: e.target.value })}
                placeholder="Free shipping over $75..."
              />
            </label>

            <label>
              Hero Headline
              <input
                value={theme.banner_headline}
                onChange={(e) => setTheme({ ...theme, banner_headline: e.target.value })}
                placeholder="Objects for a slower home."
              />
            </label>

            <label>
              Hero Subtitle / Description
              <textarea
                rows={3}
                value={theme.banner_subhead}
                onChange={(e) => setTheme({ ...theme, banner_subhead: e.target.value })}
                placeholder="Handcrafted ceramics, stone-washed textiles..."
              />
            </label>

            <label>
              Hero Banner Image URL
              <input
                value={theme.hero_image}
                onChange={(e) => setTheme({ ...theme, hero_image: e.target.value })}
              />
            </label>

            <div className="form-row">
              <label>
                Free Shipping Threshold ($ USD)
                <input
                  type="number"
                  value={theme.free_shipping_threshold_cents / 100}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      free_shipping_threshold_cents: Number(e.target.value) * 100,
                    })
                  }
                />
              </label>
              <label>
                Theme Style Aesthetic
                <select
                  value={theme.theme_style}
                  onChange={(e) => setTheme({ ...theme, theme_style: e.target.value as any })}
                >
                  <option value="warm-paper">Warm Paper &amp; Ceramic</option>
                  <option value="midnight-luxury">Midnight Forest Luxury</option>
                  <option value="modern-olive">Modern Olive Studio</option>
                </select>
              </label>
            </div>

            <div className="form-actions" style={{ marginTop: "14px" }}>
              <button className="button" disabled={busy}>
                {busy ? "Saving Changes…" : "Publish Theme Updates"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Live Preview Simulation</h3>
          <div className="theme-preview-card">
            <div className="theme-preview-banner">{theme.announcement || "Announcement message preview"}</div>
            <img src={theme.hero_image} alt="" className="theme-preview-hero" />
            <h4 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "18px", margin: 0, color: "#17372e" }}>
              {theme.banner_headline}
            </h4>
            <p style={{ fontSize: "12px", color: "#5b6b60", margin: 0 }}>
              {theme.banner_subhead}
            </p>
          </div>
        </section>
      </div>
    </>
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
          <p className="section-kicker">CUSTOMER CRM</p>
          <h1>Customers</h1>
          <p>Your community of buyers and collectors.</p>
        </div>
        <button className="button dark" onClick={() => setAdding(true)}>+ Add customer</button>
      </div>

      {err && <p className="dash-error">{err}</p>}

      <section className="panel">
        {!customers ? (
          <EmptyRow text="Loading customers…" />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" body="Customers are recorded automatically when orders are placed." cta="Add a customer" onCta={() => setAdding(true)} />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Total Spent</th>
                <th>Orders</th>
                <th>Customer Since</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="cell-title">
                      <span className="order-avatar">{(c.name || c.email).charAt(0).toUpperCase()}</span>
                      <b>{c.name || "Customer"}</b>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td><b>{money(c.total_spent_cents || 0)}</b></td>
                  <td>{c.orders_count || 1} order{c.orders_count === 1 ? "" : "s"}</td>
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
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setErr("An email is required.");
    setBusy(true);
    setErr("");
    try {
      await createCustomer(store.id, { email: email.trim(), name: name.trim() || null, phone: phone.trim() || null });
      onSaved("Customer record saved.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Couldn’t add customer.");
      setBusy(false);
    }
  };

  return (
    <Modal title="Add customer profile" onClose={onClose}>
      <form onSubmit={submit} className="dash-form">
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lena Rivers" /></label>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lena@example.com" required /></label>
        <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 019-2834" /></label>
        {err && <p className="dash-error">{err}</p>}
        <div className="form-actions">
          <button type="button" className="ghost" onClick={onClose}>Cancel</button>
          <button className="button" disabled={busy}>{busy ? "Adding…" : "Save profile"}</button>
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
          <p className="section-kicker">COMMERCE INTELLIGENCE</p>
          <h1>Analytics &amp; Sales</h1>
          <p>Key revenue metrics and 7-day performance tracking.</p>
        </div>
      </div>
      <div className="metrics">
        <Metric label="TOTAL REVENUE" value={money(totalRevenue)} />
        <Metric label="PAID ORDERS" value={String(paid.length)} />
        <Metric label="AVG ORDER VALUE" value={money(avgOrder)} />
        <Metric label="CONVERSION RATE" value="3.8%" />
      </div>
      <section className="panel sales">
        <div className="panel-heading">
          <div>
            <h3>Sales over time</h3>
            <p>Last 7 days revenue breakdown</p>
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
          <p className="section-kicker">GROWTH ENGINE</p>
          <h1>Marketing</h1>
          <p>Reach your customer list and share your store link.</p>
        </div>
      </div>
      <div className="admin-grid">
        <section className="panel nudge">
          <span>✦</span>
          <div>
            <h3>Email customer broadcast</h3>
            <p>{customers?.length ? `You have ${customers.length} customer${customers.length === 1 ? "" : "s"} subscribed to your store.` : "Collect customer orders first to broadcast announcements."}</p>
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
          <div className="panel-heading"><div><h3>Share your storefront</h3><p>Your live store address, ready to post.</p></div></div>
          <div className="share-link">
            <code>https://{store.handle}.velour.live</code>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`https://${store.handle}.velour.live`);
                toast("Storefront link copied.");
              }}
            >
              Copy link
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

/* ───────────────────────── Sales Channels ───────────────────────── */
function SalesChannelsSection({ storeUrl }: { storeUrl: string }) {
  const channels = [
    { name: "Online Storefront", detail: storeUrl, status: "Live" },
    { name: "Point of Sale (POS)", detail: "In-person iPad studio checkout", status: "Active" },
    { name: "Instagram Shopping", detail: "Product sync with Instagram tags", status: "Connected" },
    { name: "TikTok Shop", detail: "Sell in-feed via TikTok catalog", status: "Available" },
  ];
  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">OMNICHANNEL</p>
          <h1>Sales channels</h1>
          <p>All the surfaces where customers can purchase your goods.</p>
        </div>
      </div>
      <section className="panel">
        <table className="data-table">
          <tbody>
            {channels.map((c) => (
              <tr key={c.name}>
                <td><b>{c.name}</b></td>
                <td>{c.detail}</td>
                <td><span className={`badge ${c.status === "Live" || c.status === "Active" ? "active" : "draft"}`}>{c.status}</span></td>
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
          <p className="section-kicker">CUSTOM DOMAINS</p>
          <h1>Domains</h1>
          <p>Connect your custom web domain with automatic SSL encryption.</p>
        </div>
      </div>
      <section className="panel">
        <div className="domain-row">
          <div>
            <b>{storeUrl}</b>
            <small>Your free Velour high-performance CDN address · Active</small>
          </div>
          <span className="badge active">Primary</span>
        </div>
        <div className="domain-connect">
          <label>
            Connect a custom domain
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="shop.juniperstudio.com" />
          </label>
          <button className="button" onClick={() => toast(custom ? `DNS records generated for ${custom}.` : "Enter a domain.")}>
            Connect domain
          </button>
        </div>
      </section>
    </>
  );
}

/* ───────────────────────── Integrations ───────────────────────── */
function IntegrationsSection({ toast }: { toast: (s: string) => void }) {
  const items = [
    { name: "Stripe", detail: "Accept Apple Pay, Google Pay, and credit cards", status: "Connected" },
    { name: "Resend", detail: "Deliver transactional order receipts and tracking emails", status: "Ready" },
    { name: "Shippo / EasyPost", detail: "Generate discounted shipping labels with 1 click", status: "Ready" },
  ];
  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">ECOSYSTEM</p>
          <h1>Integrations</h1>
          <p>Payment gateways, shipping carriers, and notification tools.</p>
        </div>
      </div>
      <section className="panel">
        <table className="data-table">
          <tbody>
            {items.map((i) => (
              <tr key={i.name}>
                <td><b>{i.name}</b></td>
                <td>{i.detail}</td>
                <td className="row-actions"><button onClick={() => toast(`${i.name} configured.`)}>Configure</button></td>
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
  const [tagline, setTagline] = useState(store.tagline || "Objects for a slower home");
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
      const updated = await updateStore(store.id, { name: name.trim(), handle: cleanHandle, tagline: tagline.trim() });
      if (updated) onUpdated(updated);
      setHandle(cleanHandle);
      toast("Settings saved.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Couldn’t save settings.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="welcome">
        <div>
          <p className="section-kicker">CONFIGURATION</p>
          <h1>Store Settings</h1>
          <p>Your store’s brand name, handle URL, and owner credentials.</p>
        </div>
      </div>
      <section className="panel">
        <form onSubmit={save} className="dash-form settings">
          <label>
            Store Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Store Tagline
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Objects for a slower home" />
          </label>
          <label>
            Store URL Handle
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
        <div className="panel-heading"><div><h3>Account &amp; Session</h3><p>Signed in as store administrator.</p></div></div>
        <button className="ghost danger" onClick={onSignOut}>Sign out of Velour</button>
      </section>
    </>
  );
}

/* ───────────────────────── Shared UI ───────────────────────── */
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
