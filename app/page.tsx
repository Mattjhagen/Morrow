"use client";

import { FormEvent, useEffect, useState } from "react";
import StoreDashboard from "./dashboard/StoreDashboard";
import StorefrontView from "./storefront/StorefrontView";
import {
  DEMO_STORES,
  Store,
  createStore as createStoreApi,
  getMyStore,
  initializeStorageIfNeeded,
} from "./lib/store-api";

export default function Home() {
  const [screen, setScreen] = useState<"landing" | "storefront" | "dashboard">("landing");
  const [activeStore, setActiveStore] = useState<Store>(DEMO_STORES[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  useEffect(() => {
    initializeStorageIfNeeded();

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const storeParam = urlParams.get("store");
      const viewParam = urlParams.get("view");

      // Check subdomain: e.g. "juniper.velour.live" -> "juniper"
      const hostname = window.location.hostname;
      const sub = hostname.includes(".velour.live")
        ? hostname.replace(".velour.live", "")
        : null;

      const targetHandle = storeParam || sub;

      if (targetHandle) {
        const found = DEMO_STORES.find(
          (s) => s.handle.toLowerCase() === targetHandle.toLowerCase()
        );
        if (found) {
          setActiveStore(found);
          if (viewParam !== "landing") {
            setScreen(viewParam === "dashboard" ? "dashboard" : "storefront");
          }
        }
      } else {
        getMyStore().then((s) => {
          if (s) setActiveStore(s);
        });
      }

      if (viewParam === "storefront") setScreen("storefront");
      if (viewParam === "dashboard") setScreen("dashboard");

      if (window.location.hash.includes("access_token=")) {
        setAccessOpen(true);
      }
    }
  }, []);

  // Screen View Controllers
  if (screen === "storefront") {
    return (
      <StorefrontView
        store={activeStore}
        onOpenDashboard={() => setScreen("dashboard")}
        onBackToLanding={() => setScreen("landing")}
      />
    );
  }

  if (screen === "dashboard") {
    return (
      <StoreDashboard
        initialStore={activeStore}
        onBack={() => setScreen("landing")}
        onSignedOut={() => setScreen("landing")}
        onOpenStorefront={() => setScreen("storefront")}
      />
    );
  }

  // Velour Platform Landing Page
  return (
    <main>
      {/* Topbar Navigation */}
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setScreen("landing")}
          aria-label="Velour home"
        >
          <span className="brand-mark">v</span>velour
        </button>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <nav className={menuOpen ? "nav open" : "nav"}>
          <a href="#demo-stores">Demo Stores</a>
          <a href="#why">Why Velour</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <button
            className="nav-login"
            onClick={() => setScreen("storefront")}
            style={{ fontWeight: "600", color: "#17372e" }}
          >
            🛍️ Live Storefront
          </button>
          <button className="nav-login" onClick={() => setAccessOpen(true)}>
            Log in
          </button>
          <button className="button small" onClick={() => setAccessOpen(true)}>
            Start free
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> Built for the day you decide to sell
          </div>
          <h1>
            Your store. <em>Ready before</em> lunch.
          </h1>
          <p>
            Meet the calmest way to sell online. Describe what you make, choose
            a feeling, and Velour creates the full Shopify-style storefront around you.
          </p>
          <div className="hero-actions">
            <button className="button" onClick={() => setScreen("storefront")}>
              Explore Live Storefront <b>→</b>
            </button>
            <button
              className="text-link"
              onClick={() => setAccessOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              Open Merchant Admin <b>↗</b>
            </button>
          </div>
          <div className="proof">
            <div className="faces">
              <i>J</i>
              <i>A</i>
              <i>M</i>
            </div>
            <span>
              Loved by independent makers &amp; luxury brands
              <br />
              <strong>from first drop to 10,000th order</strong>
            </span>
          </div>
        </div>

        <div
          className="hero-art"
          aria-label="A preview of a Velour storefront"
          onClick={() => setScreen("storefront")}
          style={{ cursor: "pointer" }}
          title="Click to explore live storefront"
        >
          <div className="glow glow-one" />
          <div className="glow glow-two" />
          <div className="store-card">
            <div className="store-top">
              <span className="mini-brand">{activeStore.name}</span>
              <span>☰</span>
            </div>
            <div className="store-image">
              <div className="ceramic one" />
              <div className="ceramic two" />
              <div className="leaf" />
            </div>
            <div className="store-bottom">
              <div>
                <small>NEW SEASON</small>
                <h3>Objects for a slower home.</h3>
                <button onClick={() => setScreen("storefront")}>Shop the collection →</button>
              </div>
              <span className="scroll-note">LIVE STORE PREVIEW</span>
            </div>
          </div>
          <div className="sparkle s1">✦</div>
          <div className="sparkle s2">✦</div>
          <div className="launch-note">
            <span className="check">✓</span>
            <div>
              <b>Your shop is live</b>
              <small>{activeStore.handle}.velour.live</small>
            </div>
          </div>
        </div>
      </section>

      {/* Signal Bar */}
      <section className="signal-bar">
        <span>Full Shopify-style catalog &amp; checkout.</span>
        <span>Stripe payments &amp; 1-click Express Pay.</span>
        <span>Everything your shop needs. Nothing it doesn’t.</span>
      </section>

      {/* Live Demo Store Showcase */}
      <section id="demo-stores" style={{ padding: "90px 8vw", background: "#f1efe8", borderBottom: "1px solid var(--line)" }}>
        <p className="section-kicker">CURATED LIVE SHOWCASE</p>
        <h2 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "44px", letterSpacing: "-0.04em", margin: "12px 0 16px" }}>
          Experience a <em>live store</em> in action.
        </h2>
        <p className="lead" style={{ margin: "0 0 40px" }}>
          Test the customer shopping bag, discount codes (like <code>VELOUR10</code>), multi-step checkout,
          or switch to the merchant admin to fulfill orders in real-time.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {DEMO_STORES.map((s) => (
            <div
              key={s.id}
              style={{
                background: "#fffcf4",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "0 8px 24px rgba(23, 55, 46, 0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="brand-mark" style={{ width: "32px", height: "32px", fontSize: "20px" }}>
                  {s.name.charAt(0).toLowerCase()}
                </span>
                <span style={{ font: "10px var(--sf-font-mono)", background: "#edf4da", color: "#2d5438", padding: "4px 8px", borderRadius: "99px", fontWeight: "bold" }}>
                  LIVE STORE
                </span>
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--sf-font-serif)", fontSize: "22px", margin: "0 0 6px" }}>
                  {s.name}
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
                  {s.tagline}
                </p>
                <code style={{ fontSize: "12px", color: "#567067", display: "block", marginTop: "8px" }}>
                  https://{s.handle}.velour.live
                </code>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "auto", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
                <button
                  className="button small"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setActiveStore(s);
                    setScreen("storefront");
                  }}
                >
                  Shop Storefront 🛍️
                </button>
                <button
                  className="ghost"
                  style={{ padding: "8px 14px", fontSize: "12px" }}
                  onClick={() => {
                    setActiveStore(s);
                    setScreen("dashboard");
                  }}
                >
                  Manage Admin ⚙️
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Velour Section */}
      <section id="why" className="intro">
        <p className="section-kicker">A DIFFERENT KIND OF COMMERCE TOOL</p>
        <h2>
          Less setup.
          <br />
          <em>More selling.</em>
        </h2>
        <p className="lead">
          Velour sweeps away the busywork between a good idea and a beautiful
          storefront. No tutorials. No 47-tab dashboard. Just a gentle path
          forward with native checkout and inventory tracking.
        </p>
      </section>

      {/* How it works Steps */}
      <section id="how" className="steps">
        <article>
          <span className="step-no">01</span>
          <div className="step-icon prompt">✦</div>
          <h3>Say what you’re making</h3>
          <p>
            A few words is enough. Our studio assistant turns your idea into a
            name, look, copy, and first storefront.
          </p>
          <button
            onClick={() => setAccessOpen(true)}
            style={{ background: "none", border: "none", color: "#24483a", fontWeight: "600", cursor: "pointer", padding: 0 }}
          >
            Try the store builder →
          </button>
        </article>
        <article>
          <span className="step-no">02</span>
          <div className="step-icon product-icon">
            <span />
          </div>
          <h3>Add your things</h3>
          <p>
            Drop in photos, compare-at sale prices, variants, and stock counts. Velour handles collections and the polished details.
          </p>
          <button
            onClick={() => setScreen("storefront")}
            style={{ background: "none", border: "none", color: "#24483a", fontWeight: "600", cursor: "pointer", padding: 0 }}
          >
            See catalog in action →
          </button>
        </article>
        <article>
          <span className="step-no">03</span>
          <div className="step-icon launch-icon">↗</div>
          <h3>Open the doors</h3>
          <p>
            Connect a domain when you’re ready—or use your free Velour link.
            Stripe-native checkout and tracking are built in.
          </p>
          <button
            onClick={() => setScreen("storefront")}
            style={{ background: "none", border: "none", color: "#24483a", fontWeight: "600", cursor: "pointer", padding: 0 }}
          >
            Explore checkout →
          </button>
        </article>
      </section>

      {/* Dashboard Promo Section */}
      <section className="dashboard-promo">
        <div className="promo-copy">
          <p className="section-kicker">QUIETLY POWERFUL</p>
          <h2>
            Everything important,
            <br />
            <em>right where you’d look.</em>
          </h2>
          <p>
            Orders, inventory, promo codes, customer CRM, and your next best
            move—organized in human language, never a maze.
          </p>
          <button className="button light" onClick={() => setScreen("dashboard")}>
            Open the Merchant Workspace <b>→</b>
          </button>
        </div>
        <div onClick={() => setScreen("dashboard")} style={{ cursor: "pointer" }} title="Click to open workspace">
          <MiniDashboard />
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <p className="section-kicker">ALL THE ESSENTIALS, SOFTLY ARRANGED</p>
        <div className="feature-grid">
          <div>
            <span>✦</span>
            <h3>Storefronts with taste</h3>
            <p>
              Change announcement bars, headlines, and colors with our visual Theme Editor—no design degree needed.
            </p>
          </div>
          <div>
            <span>◎</span>
            <h3>Payments that feel native</h3>
            <p>
              Fast, familiar checkout powered by Stripe. Accept Apple Pay, Shop Pay, and cards instantly.
            </p>
          </div>
          <div>
            <span>↗</span>
            <h3>Promotions &amp; Discounts</h3>
            <p>
              Create percentage codes, fixed discounts, and free shipping thresholds that drive high conversion.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div>
          <p className="section-kicker">ONE SIMPLE PLAN</p>
          <h2>
            Start small.
            <br />
            <em>Stay in flow.</em>
          </h2>
        </div>
        <div className="price-card">
          <p>THE STUDIO PLAN</p>
          <h3>
            $29 <small>/ month</small>
          </h3>
          <span>
            Everything you need to open, run, and grow a beautiful, high-converting e-commerce shop.
          </span>
          <ul>
            <li>Full Shopify-style catalog &amp; checkout</li>
            <li>Unlimited products, variants &amp; orders</li>
            <li>Discount codes &amp; promotional engine</li>
            <li>Stripe &amp; Apple Pay native checkout</li>
            <li>Custom domain connection &amp; SSL</li>
            <li>Real-time shipment tracking</li>
          </ul>
          <button className="button" onClick={() => setAccessOpen(true)}>
            Start my free 14 days <b>→</b>
          </button>
          <small className="fine">No credit card needed. Instant setup.</small>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <button className="brand" onClick={() => setScreen("landing")}>
          <span className="brand-mark">v</span>velour
        </button>
        <p>Make a living from what you love making.</p>
        <span>© {new Date().getFullYear()} Velour Commerce</span>
      </footer>

      {/* Access / Sign in Modal */}
      {accessOpen && (
        <VelourAccess
          onClose={() => setAccessOpen(false)}
          onReady={(newStore?: Store) => {
            if (newStore) setActiveStore(newStore);
            setAccessOpen(false);
            setScreen("dashboard");
          }}
          onQuickDemo={(demoStore?: Store) => {
            if (demoStore) setActiveStore(demoStore);
            setAccessOpen(false);
            setScreen("dashboard");
          }}
        />
      )}
    </main>
  );
}

function MiniDashboard() {
  return (
    <div className="mini-dash">
      <aside>
        <b>velour</b>
        <span className="active">Overview</span>
        <span>Orders</span>
        <span>Products</span>
        <span>Customers</span>
        <span>Discounts</span>
        <span>Theme</span>
        <hr />
        <span>Analytics</span>
        <span>Domains</span>
      </aside>
      <div className="mini-main">
        <div className="mini-header">
          <span>Good morning, Maya</span>
          <button>View store ↗</button>
        </div>
        <h3>Your shop at a glance</h3>
        <div className="stat-row">
          <div>
            <small>TOTAL REVENUE</small>
            <b>$2,480.00</b>
            <em>↗ 24%</em>
          </div>
          <div>
            <small>ORDERS</small>
            <b>48</b>
            <em>↗ 18%</em>
          </div>
        </div>
        <div className="chart">
          <small>Sales over time</small>
          <div className="bars">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="next">
          <span>✦</span>
          <div>
            <b>Your next gentle nudge</b>
            <p>Send promo code VELOUR10 to your 3 subscribers.</p>
          </div>
          <button>Draft email →</button>
        </div>
      </div>
    </div>
  );
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = "velour.supabase.session";

type VelourSession = {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email?: string };
};

function VelourAccess({
  onClose,
  onReady,
  onQuickDemo,
}: {
  onClose: () => void;
  onReady: (store?: Store) => void;
  onQuickDemo: (store?: Store) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [session, setSession] = useState<VelourSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as VelourSession) : null;
    } catch {
      return null;
    }
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    const accessToken = new URLSearchParams(window.location.hash.slice(1)).get(
      "access_token"
    );
    if (!accessToken) return;
    const verifiedAccessToken = accessToken;
    const refreshToken =
      new URLSearchParams(window.location.hash.slice(1)).get("refresh_token") ||
      undefined;
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.search
    );
    async function verifyMagicLink() {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: authHeaders(verifiedAccessToken),
      });
      if (!response.ok) throw new Error("Could not verify session");
      const user = (await response.json()) as VelourSession["user"];
      const next = {
        access_token: verifiedAccessToken,
        refresh_token: refreshToken,
        user,
      };
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      setMessage("You’re signed in. Give your store a name to begin.");
    }
    void verifyMagicLink().catch(() =>
      setMessage("That sign-in link has expired. Request a fresh one.")
    );
  }, []);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    const isConfigured =
      Boolean(SUPABASE_URL) &&
      Boolean(SUPABASE_KEY) &&
      !SUPABASE_URL?.includes("your-project-ref") &&
      !SUPABASE_KEY?.includes("your_public_key");

    if (!isConfigured) {
      // If Supabase env vars are not set in Vercel yet, provide instant demo access
      onQuickDemo();
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(SUPABASE_KEY ? { apikey: SUPABASE_KEY } : {}),
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          create_user: true,
          data: { full_name: name.trim() },
          email_redirect_to: window.location.origin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.msg || errorData?.error_description || errorData?.message || `Error (${response.status}): Could not send email`;
        throw new Error(errMsg);
      }

      setMessage("Check your inbox—your private Velour sign-in link is on its way.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "We couldn’t send that link. Check the email address or try Demo mode.";
      setMessage(msg);
    } finally {
      setBusy(false);
    }
  }

  async function createStore(event: FormEvent) {
    event.preventDefault();
    if (!storeName.trim()) return;
    const handle = storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64);
    if (handle.length < 3) {
      setMessage("Choose a store name with at least three letters or numbers.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (SUPABASE_URL && session) {
        await fetch(`${SUPABASE_URL}/rest/v1/stores`, {
          method: "POST",
          headers: {
            ...authHeaders(session.access_token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: storeName.trim(),
            handle,
          }),
        }).catch(() => null);
      }
      const created = await createStoreApi(storeName.trim(), handle);
      onReady(created);
    } catch {
      onReady();
    } finally {
      setBusy(false);
    }
  }

  const startCleanStore = async () => {
    setBusy(true);
    try {
      const created = await createStoreApi("My New Studio", `studio-${Date.now().toString(36).slice(-4)}`);
      onReady(created);
    } catch {
      onQuickDemo();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="access-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="velour-access-title"
    >
      <section className="access-card">
        <button className="access-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className="brand-mark">v</span>
        {!session ? (
          <>
            <p className="section-kicker">YOUR VELOUR WORKSPACE</p>
            <h2 id="velour-access-title">
              Sign in or launch
              <br />
              <em>a new shop.</em>
            </h2>
            <p className="access-copy">
              Enter your email for a magic link, or jump straight into a brand new clean store.
            </p>
            <form onSubmit={sendMagicLink}>
              <label>
                Your name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Maya Patel"
                  autoComplete="name"
                />
              </label>
              <label>
                Email address
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@example.com"
                  type="email"
                  autoComplete="email"
                />
              </label>
              <button className="button" disabled={busy}>
                {busy ? "Connecting…" : "Email me a sign-in link →"}
              </button>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="button"
                  style={{ background: "#24483a", color: "#fff", width: "100%" }}
                  onClick={startCleanStore}
                  disabled={busy}
                >
                  ✨ Start Fresh Clean Store (0 Products &amp; Tutorial)
                </button>
                <button
                  type="button"
                  className="ghost"
                  style={{ width: "100%" }}
                  onClick={() => onQuickDemo(DEMO_STORES[0])}
                  disabled={busy}
                >
                  ⚡ Explore Juniper Studio Showcase
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="section-kicker">WELCOME TO VELOUR</p>
            <h2 id="velour-access-title">
              What should we
              <br />
              <em>call your store?</em>
            </h2>
            <p className="access-copy">
              This is the start of your own private e-commerce workspace.
            </p>
            <form onSubmit={createStore}>
              <label>
                Store name
                <input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Juniper Studio"
                  required
                />
              </label>
              <button className="button" disabled={busy}>
                {busy ? "Creating your store…" : "Create my store →"}
              </button>
            </form>
          </>
        )}
        {message && (
          <p className="access-message" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}

function authHeaders(accessToken: string) {
  return { apikey: SUPABASE_KEY || "", Authorization: `Bearer ${accessToken}` };
}
