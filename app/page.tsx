"use client";

import { FormEvent, useEffect, useState } from "react";
import StoreDashboard from "./dashboard/StoreDashboard";

export default function Home() {
  const [screen, setScreen] = useState<"home" | "dashboard">("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);

  // Magic links return to the landing page. Reopen the account panel so the
  // returned session can be verified and the merchant can name their store.
  useEffect(() => {
    if (window.location.hash.includes("access_token=")) setAccessOpen(true);
  }, []);

  if (screen === "dashboard")
    return (
      <StoreDashboard
        onBack={() => setScreen("home")}
        onSignedOut={() => setScreen("home")}
      />
    );

  return (
    <main>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setScreen("home")}
          aria-label="Morrow home"
        >
          <span className="brand-mark">m</span>morrow
        </button>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
        <nav className={menuOpen ? "nav open" : "nav"}>
          <a href="#why">Why Morrow</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <button className="nav-login" onClick={() => setAccessOpen(true)}>
            Log in
          </button>
          <button className="button small" onClick={() => setAccessOpen(true)}>
            Start free
          </button>
        </nav>
      </header>

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
            a feeling, and Morrow creates the shop around you.
          </p>
          <div className="hero-actions">
            <button className="button" onClick={() => setAccessOpen(true)}>
              Make my store <b>→</b>
            </button>
            <a href="#how" className="text-link">
              See how it works <b>↓</b>
            </a>
          </div>
          <div className="proof">
            <div className="faces">
              <i>J</i>
              <i>A</i>
              <i>M</i>
            </div>
            <span>
              Loved by first-time founders
              <br />
              <strong>from idea to first order</strong>
            </span>
          </div>
        </div>
        <div className="hero-art" aria-label="A preview of a Morrow storefront">
          <div className="glow glow-one" />
          <div className="glow glow-two" />
          <div className="store-card">
            <div className="store-top">
              <span className="mini-brand">juniper studio</span>
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
                <button>Shop the collection →</button>
              </div>
              <span className="scroll-note">SCROLL TO EXPLORE</span>
            </div>
          </div>
          <div className="sparkle s1">✦</div>
          <div className="sparkle s2">✦</div>
          <div className="launch-note">
            <span className="check">✓</span>
            <div>
              <b>Your shop is live</b>
              <small>juniper.morrow.live</small>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-bar">
        <span>Made for makers, not menus.</span>
        <span>One clear next step, always.</span>
        <span>Everything your shop needs. Nothing it doesn’t.</span>
      </section>

      <section id="why" className="intro">
        <p className="section-kicker">A different kind of commerce tool</p>
        <h2>
          Less setup.
          <br />
          <em>More selling.</em>
        </h2>
        <p className="lead">
          Morrow sweeps away the busywork between a good idea and a beautiful
          storefront. No tutorials. No 47-tab dashboard. Just a gentle path
          forward.
        </p>
      </section>

      <section id="how" className="steps">
        <article>
          <span className="step-no">01</span>
          <div className="step-icon prompt">✦</div>
          <h3>Say what you’re making</h3>
          <p>
            A few words is enough. Our studio assistant turns your idea into a
            name, look, copy, and first storefront.
          </p>
          <a href="#pricing">Try the store builder →</a>
        </article>
        <article>
          <span className="step-no">02</span>
          <div className="step-icon product-icon">
            <span />
          </div>
          <h3>Add your things</h3>
          <p>
            Drop in a photo, price, and a thought. Morrow handles inventory,
            collections, and the polished details.
          </p>
          <a href="#pricing">See products in action →</a>
        </article>
        <article>
          <span className="step-no">03</span>
          <div className="step-icon launch-icon">↗</div>
          <h3>Open the doors</h3>
          <p>
            Connect a domain when you’re ready—or use your free Morrow link.
            Payments are built in from the start.
          </p>
          <a href="#pricing">Explore checkout →</a>
        </article>
      </section>

      <section className="dashboard-promo">
        <div className="promo-copy">
          <p className="section-kicker">Quietly powerful</p>
          <h2>
            Everything important,
            <br />
            <em>right where you’d look.</em>
          </h2>
          <p>
            Orders, inventory, discounts, customers, and your next best
            move—organized in human language, never a maze.
          </p>
          <button className="button light" onClick={() => setAccessOpen(true)}>
            Explore the workspace <b>→</b>
          </button>
        </div>
        <MiniDashboard />
      </section>

      <section className="features">
        <p className="section-kicker">All the essentials, softly arranged</p>
        <div className="feature-grid">
          <div>
            <span>✦</span>
            <h3>Storefronts with taste</h3>
            <p>
              Change colors, type, and layout with a few thoughtful choices—not
              a design degree.
            </p>
          </div>
          <div>
            <span>◎</span>
            <h3>Payments that feel native</h3>
            <p>
              Fast, familiar checkout powered by Stripe. Your money lands where
              it should.
            </p>
          </div>
          <div>
            <span>↗</span>
            <h3>Room to grow</h3>
            <p>
              Connect email, shipping, and the tools you love when the time is
              right.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="pricing">
        <div>
          <p className="section-kicker">One simple plan</p>
          <h2>
            Start small.
            <br />
            <em>Stay in flow.</em>
          </h2>
        </div>
        <div className="price-card">
          <p>THE STUDIO</p>
          <h3>
            $29 <small>/ month</small>
          </h3>
          <span>
            Everything you need to open, run, and grow a beautiful little shop.
          </span>
          <ul>
            <li>AI store builder</li>
            <li>Unlimited products &amp; orders</li>
            <li>Stripe-native checkout</li>
            <li>Custom domain connection</li>
            <li>Human support, always</li>
          </ul>
          <button className="button" onClick={() => setAccessOpen(true)}>
            Start my free 14 days <b>→</b>
          </button>
          <small className="fine">No credit card needed. No gotchas.</small>
        </div>
      </section>

      <footer>
        <button className="brand" onClick={() => setScreen("home")}>
          <span className="brand-mark">m</span>morrow
        </button>
        <p>Make a living from what you love making.</p>
        <span>© 2026 Morrow Commerce</span>
      </footer>
      {accessOpen && (
        <MorrowAccess
          onClose={() => setAccessOpen(false)}
          onReady={() => {
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
        <b>morrow</b>
        <span className="active">Overview</span>
        <span>Orders</span>
        <span>Products</span>
        <span>Customers</span>
        <span>Marketing</span>
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
            <small>SALES THIS WEEK</small>
            <b>$1,284.00</b>
            <em>↗ 18%</em>
          </div>
          <div>
            <small>ORDERS</small>
            <b>32</b>
            <em>↗ 12%</em>
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
            <p>Share your new fall collection with your customers.</p>
          </div>
          <button>Draft email →</button>
        </div>
      </div>
    </div>
  );
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = "morrow.supabase.session";

type MorrowSession = {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email?: string };
};

function MorrowAccess({
  onClose,
  onReady,
}: {
  onClose: () => void;
  onReady: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [session, setSession] = useState<MorrowSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as MorrowSession) : null;
    } catch {
      return null;
    }
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    const accessToken = new URLSearchParams(window.location.hash.slice(1)).get(
      "access_token",
    );
    if (!accessToken) return;
    const verifiedAccessToken = accessToken;
    const refreshToken =
      new URLSearchParams(window.location.hash.slice(1)).get("refresh_token") ||
      undefined;
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.search,
    );
    async function verifyMagicLink() {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: authHeaders(verifiedAccessToken),
      });
      if (!response.ok) throw new Error("Could not verify session");
      const user = (await response.json()) as MorrowSession["user"];
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
      setMessage(
        "That sign-in link has expired. Request a fresh one and try again.",
      ),
    );
  }, []);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setMessage(
        "Morrow sign-in is being configured. Please try again shortly.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({
          email,
          create_user: true,
          data: { full_name: name },
          email_redirect_to: window.location.origin,
        }),
      });
      if (!response.ok) throw new Error("Could not send sign-in email");
      setMessage(
        "Check your inbox—your private Morrow sign-in link is on its way.",
      );
    } catch {
      setMessage(
        "We couldn’t send that link. Check the email address and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function createStore(event: FormEvent) {
    event.preventDefault();
    if (!session || !storeName.trim()) return;
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
      const response = await fetch(`${SUPABASE_URL}/rest/v1/stores`, {
        method: "POST",
        headers: {
          ...authHeaders(session.access_token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: storeName.trim(),
          handle,
        }),
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(error?.message || "Could not create store");
      }
      onReady();
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.includes("duplicate")
          ? "That store link is taken—try a slightly different name."
          : "We couldn’t create your store. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="access-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="morrow-access-title"
    >
      <section className="access-card">
        <button className="access-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className="brand-mark">m</span>
        {!session ? (
          <>
            <p className="section-kicker">YOUR MORROW ACCOUNT</p>
            <h2 id="morrow-access-title">
              Start with your
              <br />
              <em>email.</em>
            </h2>
            <p className="access-copy">
              No password to remember. We’ll send a secure sign-in link.
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
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <button className="button" disabled={busy}>
                {busy ? "Sending your link…" : "Email me a sign-in link →"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="section-kicker">WELCOME TO MORROW</p>
            <h2 id="morrow-access-title">
              What should we
              <br />
              <em>call your store?</em>
            </h2>
            <p className="access-copy">
              This is the start of your own private workspace.
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
