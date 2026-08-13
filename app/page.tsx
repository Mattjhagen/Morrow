"use client";

import { FormEvent, useEffect, useState } from "react";

const nav = ["Overview", "Orders", "Products", "Customers", "Marketing", "Sales channels"];
const management = ["Analytics", "Domains", "Integrations", "Settings"];

export default function Home() {
  const [screen, setScreen] = useState<"home" | "dashboard">("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [accessOpen, setAccessOpen] = useState(false);
  const toast = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 2500); };

  if (screen === "dashboard") return <Dashboard onBack={() => setScreen("home")} toast={toast} notice={notice} />;

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("home")} aria-label="Morrow home"><span className="brand-mark">m</span>morrow</button>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
        <nav className={menuOpen ? "nav open" : "nav"}>
          <a href="#why">Why Morrow</a><a href="#how">How it works</a><a href="#pricing">Pricing</a>
          <button className="nav-login" onClick={() => setAccessOpen(true)}>Log in</button>
          <button className="button small" onClick={() => setAccessOpen(true)}>Start free</button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Built for the day you decide to sell</div>
          <h1>Your store. <em>Ready before</em> lunch.</h1>
          <p>Meet the calmest way to sell online. Describe what you make, choose a feeling, and Morrow creates the shop around you.</p>
          <div className="hero-actions"><button className="button" onClick={() => setAccessOpen(true)}>Make my store <b>→</b></button><a href="#how" className="text-link">See how it works <b>↓</b></a></div>
          <div className="proof"><div className="faces"><i>J</i><i>A</i><i>M</i></div><span>Loved by first-time founders<br /><strong>from idea to first order</strong></span></div>
        </div>
        <div className="hero-art" aria-label="A preview of a Morrow storefront">
          <div className="glow glow-one" /><div className="glow glow-two" />
          <div className="store-card">
            <div className="store-top"><span className="mini-brand">moss &amp; marrow</span><span>☰</span></div>
            <div className="store-image"><div className="ceramic one" /><div className="ceramic two" /><div className="leaf" /></div>
            <div className="store-bottom"><div><small>NEW SEASON</small><h3>Objects for a slower home.</h3><button>Shop the collection →</button></div><span className="scroll-note">SCROLL TO EXPLORE</span></div>
          </div>
          <div className="sparkle s1">✦</div><div className="sparkle s2">✦</div>
          <div className="launch-note"><span className="check">✓</span><div><b>Your shop is live</b><small>mossandmarrow.com</small></div></div>
        </div>
      </section>

      <section className="signal-bar"><span>Made for makers, not menus.</span><span>One clear next step, always.</span><span>Everything your shop needs. Nothing it doesn’t.</span></section>

      <section id="why" className="intro"><p className="section-kicker">A different kind of commerce tool</p><h2>Less setup.<br /><em>More selling.</em></h2><p className="lead">Morrow sweeps away the busywork between a good idea and a beautiful storefront. No tutorials. No 47-tab dashboard. Just a gentle path forward.</p></section>

      <section id="how" className="steps">
        <article><span className="step-no">01</span><div className="step-icon prompt">✦</div><h3>Say what you’re making</h3><p>A few words is enough. Our studio assistant turns your idea into a name, look, copy, and first storefront.</p><a href="#pricing">Try the store builder →</a></article>
        <article><span className="step-no">02</span><div className="step-icon product-icon"><span /></div><h3>Add your things</h3><p>Drop in a photo, price, and a thought. Morrow handles inventory, collections, and the polished details.</p><a href="#pricing">See products in action →</a></article>
        <article><span className="step-no">03</span><div className="step-icon launch-icon">↗</div><h3>Open the doors</h3><p>Connect a domain when you’re ready—or use your free Morrow link. Payments are built in from the start.</p><a href="#pricing">Explore checkout →</a></article>
      </section>

      <section className="dashboard-promo"><div className="promo-copy"><p className="section-kicker">Quietly powerful</p><h2>Everything important,<br /><em>right where you’d look.</em></h2><p>Orders, inventory, discounts, customers, and your next best move—organized in human language, never a maze.</p><button className="button light" onClick={() => setAccessOpen(true)}>Explore the workspace <b>→</b></button></div><MiniDashboard /></section>

      <section className="features"><p className="section-kicker">All the essentials, softly arranged</p><div className="feature-grid"><div><span>✦</span><h3>Storefronts with taste</h3><p>Change colors, type, and layout with a few thoughtful choices—not a design degree.</p></div><div><span>◎</span><h3>Payments that feel native</h3><p>Fast, familiar checkout powered by Stripe. Your money lands where it should.</p></div><div><span>↗</span><h3>Room to grow</h3><p>Connect email, shipping, and the tools you love when the time is right.</p></div></div></section>

      <section id="pricing" className="pricing"><div><p className="section-kicker">One simple plan</p><h2>Start small.<br /><em>Stay in flow.</em></h2></div><div className="price-card"><p>THE STUDIO</p><h3>$29 <small>/ month</small></h3><span>Everything you need to open, run, and grow a beautiful little shop.</span><ul><li>AI store builder</li><li>Unlimited products &amp; orders</li><li>Stripe-native checkout</li><li>Custom domain connection</li><li>Human support, always</li></ul><button className="button" onClick={() => setAccessOpen(true)}>Start my free 14 days <b>→</b></button><small className="fine">No credit card needed. No gotchas.</small></div></section>

      <footer><button className="brand" onClick={() => setScreen("home")}><span className="brand-mark">m</span>morrow</button><p>Make a living from what you love making.</p><span>© 2026 Morrow Commerce</span></footer>
      {accessOpen && <MorrowAccess onClose={() => setAccessOpen(false)} onReady={() => { setAccessOpen(false); setScreen("dashboard"); }} />}
    </main>
  );
}

function MiniDashboard(){ return <div className="mini-dash"><aside><b>morrow</b><span className="active">Overview</span><span>Orders</span><span>Products</span><span>Customers</span><span>Marketing</span><hr/><span>Analytics</span><span>Domains</span></aside><div className="mini-main"><div className="mini-header"><span>Good morning, Maya</span><button>View store ↗</button></div><h3>Your shop at a glance</h3><div className="stat-row"><div><small>SALES THIS WEEK</small><b>$1,284.00</b><em>↗ 18%</em></div><div><small>ORDERS</small><b>32</b><em>↗ 12%</em></div></div><div className="chart"><small>Sales over time</small><div className="bars"><i/><i/><i/><i/><i/><i/><i/></div></div><div className="next"><span>✦</span><div><b>Your next gentle nudge</b><p>Share your new fall collection with your customers.</p></div><button>Draft email →</button></div></div></div> }

function Dashboard({onBack, toast, notice}:{onBack:()=>void;toast:(x:string)=>void;notice:string}){ const [active,setActive]=useState("Overview"); const [tour,setTour]=useState(true); return <main className="admin-shell"><aside className="sidebar"><button className="brand" onClick={onBack}><span className="brand-mark">m</span>morrow</button><div className="store-switch"><span className="store-dot">M</span><div><b>Moss &amp; Marrow</b><small>mossandmarrow.com</small></div><span>⌄</span></div><div className="side-nav">{nav.map(x=><button className={active===x?"selected":""} key={x} onClick={()=>{setActive(x);toast(`${x} is ready when you are.`)}}>{x}</button>)}<hr/>{management.map(x=><button className={active===x?"selected":""} key={x} onClick={()=>{setActive(x);toast(`${x} is ready when you are.`)}}>{x}</button>)}</div><div className="side-bottom"><button onClick={()=>toast("Your Morrow guide is here to help.")}>? &nbsp; Help &amp; guides</button><button className="profile" onClick={()=>toast("Account menu opened.")}><span>MP</span><b>Maya Patel</b><i>⌄</i></button></div></aside><section className="admin-main"><header className="admin-top"><span>Monday, August 13</span><div><button onClick={()=>toast("Notifications cleared.")}>◌</button><button className="view-store" onClick={onBack}>View store ↗</button></div></header><div className="content"><div className="welcome"><div><p className="section-kicker">YOUR DAILY OVERVIEW</p><h1>Good morning, Maya <span>☀</span></h1><p>Here’s the lovely stuff happening with your shop.</p></div><button className="button dark" onClick={()=>toast("Let’s add a new product.")}>+ Add product</button></div>{tour&&<div className="tour"><button onClick={()=>setTour(false)} aria-label="Close">×</button><div className="tour-icon">✦</div><div><b>Your shop is looking good.</b><p>One small thing: add your first product to make your storefront feel like yours.</p></div><button onClick={()=>toast("Opening your product editor…")}>Add a product →</button></div>}<div className="metrics"><Metric label="SALES THIS WEEK" value="$1,284.00" trend="18%"/><Metric label="ORDERS" value="32" trend="12%"/><Metric label="VISITORS" value="1,452" trend="8%"/><Metric label="CONVERSION" value="2.2%" trend="0.4%"/></div><div className="admin-grid"><section className="panel sales"><div className="panel-heading"><div><h3>Sales over time</h3><p>August 7 – August 13</p></div><button onClick={()=>toast("Sales report opened.")}>View report →</button></div><div className="big-chart"><div className="ylabels"><span>$400</span><span>$300</span><span>$200</span><span>$100</span><span>$0</span></div><div className="chart-area"><div className="line"/><div className="chart-days"><span>Mon 7</span><span>Tue 8</span><span>Wed 9</span><span>Thu 10</span><span>Fri 11</span><span>Sat 12</span><span>Today</span></div></div></div></section><section className="panel orders"><div className="panel-heading"><div><h3>Recent orders</h3><p>Your newest sales, all in one place.</p></div><button onClick={()=>toast("All orders opened.")}>View all →</button></div>{[["#1042","Lena Rivers","$68.00"],["#1041","Sofia Chen","$42.00"],["#1040","Naomi Wood","$96.00"]].map(o=><div className="order" key={o[0]}><span className="order-avatar">{o[1][0]}</span><div><b>{o[0]} · {o[1]}</b><small>Just now</small></div><strong>{o[2]}</strong></div>)}</section></div><div className="admin-grid lower"><section className="panel nudge"><span>✦</span><div><h3>Your next gentle nudge</h3><p>Your “Slow Sundays” collection is getting attention. A short email could turn those views into first orders.</p><button onClick={()=>toast("Your email draft is ready.")}>Draft an email →</button></div></section><section className="panel products"><div className="panel-heading"><div><h3>Low in stock</h3><p>Keep an eye on these favorites.</p></div><button onClick={()=>toast("Inventory opened.")}>Manage →</button></div><div className="stock"><span className="product-thumb"/><div><b>Cloud Mug, Oat</b><small>4 left</small></div><button onClick={()=>toast("Inventory updated.")}>Restock</button></div></section></div></div></section>{notice&&<div className="toast">{notice}</div>}</main>}
function Metric({label,value,trend}:{label:string;value:string;trend:string}){return <div className="metric"><small>{label}</small><b>{value}</b><span>↗ {trend}</span><em>vs. last week</em></div>}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = "morrow.supabase.session";

type MorrowSession = { access_token: string; refresh_token?: string; user: { id: string; email?: string } };

function MorrowAccess({onClose,onReady}:{onClose:()=>void;onReady:()=>void}) {
  const [email,setEmail] = useState("");
  const [name,setName] = useState("");
  const [storeName,setStoreName] = useState("");
  const [session,setSession] = useState<MorrowSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) as MorrowSession : null;
    } catch { return null; }
  });
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return;
    const accessToken = new URLSearchParams(window.location.hash.slice(1)).get("access_token");
    if (!accessToken) return;
    const refreshToken = new URLSearchParams(window.location.hash.slice(1)).get("refresh_token") || undefined;
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    async function verifyMagicLink() {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders(accessToken) });
      if (!response.ok) throw new Error("Could not verify session");
      const user = await response.json() as MorrowSession["user"];
      const next = {access_token:accessToken, refresh_token:refreshToken, user};
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      setSession(next);
      setMessage("You’re signed in. Give your store a name to begin.");
    }
    void verifyMagicLink().catch(() => setMessage("That sign-in link has expired. Request a fresh one and try again."));
  }, []);

  async function sendMagicLink(event:FormEvent) {
    event.preventDefault();
    if (!SUPABASE_URL || !SUPABASE_KEY) { setMessage("Morrow sign-in is being configured. Please try again shortly."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method:"POST",
        headers:{"Content-Type":"application/json", apikey:SUPABASE_KEY},
        body:JSON.stringify({email, create_user:true, data:{full_name:name}, email_redirect_to:window.location.origin})
      });
      if (!response.ok) throw new Error("Could not send sign-in email");
      setMessage("Check your inbox—your private Morrow sign-in link is on its way.");
    } catch { setMessage("We couldn’t send that link. Check the email address and try again."); }
    finally { setBusy(false); }
  }

  async function createStore(event:FormEvent) {
    event.preventDefault();
    if (!session || !storeName.trim()) return;
    const handle = storeName.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,64);
    if (handle.length < 3) { setMessage("Choose a store name with at least three letters or numbers."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/stores`, {
        method:"POST", headers:{...authHeaders(session.access_token), "Content-Type":"application/json", Prefer:"return=representation"},
        body:JSON.stringify({owner_id:session.user.id, name:storeName.trim(), handle})
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null) as {message?:string}|null;
        throw new Error(error?.message || "Could not create store");
      }
      onReady();
    } catch (error) { setMessage(error instanceof Error && error.message.includes("duplicate") ? "That store link is taken—try a slightly different name." : "We couldn’t create your store. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="access-backdrop" role="dialog" aria-modal="true" aria-labelledby="morrow-access-title"><section className="access-card"><button className="access-close" onClick={onClose} aria-label="Close">×</button><span className="brand-mark">m</span>{!session ? <><p className="section-kicker">YOUR MORROW ACCOUNT</p><h2 id="morrow-access-title">Start with your<br/><em>email.</em></h2><p className="access-copy">No password to remember. We’ll send a secure sign-in link.</p><form onSubmit={sendMagicLink}><label>Your name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Maya Patel" autoComplete="name" /></label><label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" required /></label><button className="button" disabled={busy}>{busy ? "Sending your link…" : "Email me a sign-in link →"}</button></form></> : <><p className="section-kicker">WELCOME TO MORROW</p><h2 id="morrow-access-title">What should we<br/><em>call your store?</em></h2><p className="access-copy">This is the start of your own private workspace.</p><form onSubmit={createStore}><label>Store name<input value={storeName} onChange={e=>setStoreName(e.target.value)} placeholder="Moss & Marrow" required /></label><button className="button" disabled={busy}>{busy ? "Creating your store…" : "Create my store →"}</button></form></>}{message && <p className="access-message" role="status">{message}</p>}</section></div>;
}

function authHeaders(accessToken:string) { return {apikey:SUPABASE_KEY || "", Authorization:`Bearer ${accessToken}`}; }
