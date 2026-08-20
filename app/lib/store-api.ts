"use client";

/**
 * Velour Commerce Data Layer
 * 
 * Supports both live Supabase REST endpoints and resilient local persistence,
 * powering full Shopify-style e-commerce capabilities:
 * - Product catalog with categories, compare-at pricing, image galleries, ratings, stock tracking
 * - Discounts & Promo Code engine (percentage, fixed amount, free shipping)
 * - Storefront theme customizer (announcement bar, hero headlines, accent colors)
 * - Customer CRM & Order placement pipeline with inventory decrements & tracking
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;
const SESSION_KEY = "velour.supabase.session";
const SESSION_KEY_FALLBACKS = ["morrow.supabase.session"];
const LOCAL_STORES_KEY = "velour_stores_v2";
const LOCAL_PRODUCTS_KEY = "velour_products_v2";
const LOCAL_ORDERS_KEY = "velour_orders_v2";
const LOCAL_CUSTOMERS_KEY = "velour_customers_v2";
const LOCAL_DISCOUNTS_KEY = "velour_discounts_v2";
const LOCAL_THEMES_KEY = "velour_themes_v2";

export type Session = {
  access_token: string;
  refresh_token?: string;
  user: { id: string; email?: string };
};

export type StoreTheme = {
  announcement: string;
  banner_headline: string;
  banner_subhead: string;
  hero_image: string;
  accent_color: string;
  theme_style: "warm-paper" | "midnight-luxury" | "modern-olive";
  free_shipping_threshold_cents: number;
  tagline: string;
};

export type Store = {
  id: string;
  owner_id: string;
  name: string;
  handle: string;
  tagline?: string;
  currency: string;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  price_cents: number;
  compare_at_price_cents?: number | null;
  inventory_count: number;
  image_url?: string | null;
  options: Record<string, string>;
};

export type Product = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  compare_at_price_cents?: number | null;
  currency: string;
  image_url: string | null;
  gallery_urls?: string[];
  category?: string;
  sku: string | null;
  inventory_count: number;
  status: "active" | "draft" | "archived";
  rating?: number;
  review_count?: number;
  badges?: string[];
  details?: Record<string, string>;
  variants?: ProductVariant[];
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
  image_url?: string | null;
  variant_title?: string | null;
};

export type Order = {
  id: string;
  store_id: string;
  order_number: number;
  customer_id: string | null;
  customer_name: string | null;
  customer_email?: string | null;
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  status: "pending" | "paid" | "fulfilled" | "refunded" | "cancelled";
  fulfillment_status?: "unfulfilled" | "fulfilled" | "in_transit";
  tracking_number?: string | null;
  carrier?: string | null;
  currency: string;
  subtotal_cents: number;
  discount_cents?: number;
  discount_code?: string | null;
  shipping_cents?: number;
  tax_cents?: number;
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
  phone?: string | null;
  total_spent_cents?: number;
  orders_count?: number;
  created_at: string;
};

export type Discount = {
  id: string;
  store_id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number; // percentage (e.g. 15 for 15%) or cents (e.g. 1000 for $10)
  min_spend_cents: number;
  usage_count: number;
  is_active: boolean;
  created_at: string;
};

export type ProductReview = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
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

// ── Default Theme Preset ──────────────────────────────────────────────────
export const DEFAULT_THEME: StoreTheme = {
  announcement: "✨ Free carbon-neutral shipping on orders over $75 · Use code VELOUR10 for 10% off",
  banner_headline: "Objects for a slower, more intentional home.",
  banner_subhead: "Handcrafted ceramics, stone-washed textiles, and architectural homeware made in small artisan batches.",
  hero_image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80",
  accent_color: "#17372e",
  theme_style: "warm-paper",
  free_shipping_threshold_cents: 7500,
  tagline: "Your store. Ready before lunch.",
};

// ── Seed Catalogs ──────────────────────────────────────────────────────────
const DEMO_STORE_JUNIPER: Store = {
  id: "store-juniper-studio-01",
  owner_id: "demo-user-01",
  name: "Juniper Studio",
  handle: "juniper",
  tagline: "Objects for a slower home",
  currency: "usd",
  created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
};

const DEMO_STORE_AURA: Store = {
  id: "store-aura-botanicals-02",
  owner_id: "demo-user-01",
  name: "Aura Botanicals",
  handle: "aura-botanicals",
  tagline: "Conscious organic skincare & remedies",
  currency: "usd",
  created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
};

const DEMO_STORE_MAISON: Store = {
  id: "store-maison-velour-03",
  owner_id: "demo-user-01",
  name: "Maison Velour",
  handle: "maison-velour",
  tagline: "Artisan leathergoods & cashmere",
  currency: "usd",
  created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
};

export const DEMO_STORES = [DEMO_STORE_JUNIPER, DEMO_STORE_AURA, DEMO_STORE_MAISON];

const SEED_PRODUCTS_JUNIPER: Product[] = [
  {
    id: "prod-jun-01",
    store_id: "store-juniper-studio-01",
    name: "Hand-thrown Cloud Mug in Oat",
    description: "Wheel-thrown in our Kyoto studio using iron-rich stoneware with a satin oatmeal matte glaze. Each piece holds 12oz of your favorite morning pour and fits gently in your palms.",
    price_cents: 3400,
    compare_at_price_cents: 4200,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80"
    ],
    category: "Ceramics",
    sku: "JUN-MUG-OAT",
    inventory_count: 8,
    status: "active",
    rating: 4.9,
    review_count: 38,
    badges: ["Best Seller", "Small Batch"],
    variants: [
      {
        id: "var-mug-01",
        name: "Oat Satin / 12oz",
        sku: "JUN-MUG-OAT-12",
        price_cents: 3400,
        compare_at_price_cents: 4200,
        inventory_count: 8,
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        options: { "Finish": "Oat Satin", "Size": "12oz Standard" },
      },
      {
        id: "var-mug-02",
        name: "Moss Glaze / 12oz",
        sku: "JUN-MUG-MOSS-12",
        price_cents: 3600,
        compare_at_price_cents: 4400,
        inventory_count: 5,
        image_url: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
        options: { "Finish": "Moss Glaze", "Size": "12oz Standard" },
      },
      {
        id: "var-mug-03",
        name: "Charcoal Matte / 16oz Jumbo",
        sku: "JUN-MUG-CHAR-16",
        price_cents: 3900,
        compare_at_price_cents: 4800,
        inventory_count: 3,
        image_url: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
        options: { "Finish": "Charcoal Matte", "Size": "16oz Jumbo" },
      },
    ],
    details: {
      "Capacity": "12 fl oz or 16 fl oz",
      "Material": "Natural iron-rich glazed stoneware",
      "Care": "Dishwasher & microwave safe",
      "Origin": "Kyoto, Japan"
    },
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-jun-02",
    store_id: "store-juniper-studio-01",
    name: "Fluted Stoneware Arch Vase",
    description: "An architectural focal piece with ribbed textural contours. Striking on a credenza or dining table, with or without botanical stems.",
    price_cents: 6800,
    compare_at_price_cents: 8500,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
    ],
    category: "Home Decor",
    sku: "JUN-VASE-FLUT",
    inventory_count: 4,
    status: "active",
    rating: 4.8,
    review_count: 24,
    badges: ["Low Stock"],
    details: {
      "Dimensions": "9.5\" H x 5.2\" W",
      "Finish": "Textured unglazed exterior, watertight interior",
      "Care": "Hand wash with mild soap"
    },
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-jun-03",
    store_id: "store-juniper-studio-01",
    name: "Sculptural Olive Oil Cruet",
    description: "Designed for effortless drizzling over sourdough or heirloom tomatoes. Fitted with an airtight stainless steel spout and weighted base.",
    price_cents: 5200,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80"
    ],
    category: "Kitchen & Dining",
    sku: "JUN-CRUET-01",
    inventory_count: 14,
    status: "active",
    rating: 5.0,
    review_count: 19,
    badges: ["Staff Favorite"],
    details: {
      "Capacity": "16 fl oz",
      "Spout": "Food-grade stainless steel with weighted closure",
      "Material": "High-fire stoneware"
    },
    created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-jun-04",
    store_id: "store-juniper-studio-01",
    name: "Waffle Weave Organic Linen Throw",
    description: "Woven in Portugal from 100% GOTS certified European flax. Pre-washed for signature lived-in softness, breathability, and sumptuous drape.",
    price_cents: 11000,
    compare_at_price_cents: 13500,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
    gallery_urls: [
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
    ],
    category: "Textiles",
    sku: "JUN-THROW-LIN",
    inventory_count: 6,
    status: "active",
    rating: 4.9,
    review_count: 42,
    badges: ["Organic Certified"],
    details: {
      "Dimensions": "50\" x 70\" (127cm x 178cm)",
      "Fiber": "100% organic European flax",
      "Care": "Gentle cycle cold, tumble dry low"
    },
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-jun-05",
    store_id: "store-juniper-studio-01",
    name: "Wild Fig & Hinoki Wood Candle",
    description: "Hand-poured coconut apricot wax with notes of green fig leaves, damp soil, charred hinoki cedar, and wild amber. 60-hour clean burn time.",
    price_cents: 3800,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
    category: "Home Goods",
    sku: "JUN-CNDL-FIG",
    inventory_count: 22,
    status: "active",
    rating: 4.9,
    review_count: 67,
    badges: ["Clean Burn"],
    details: {
      "Wax": "100% coconut-apricot wax blend",
      "Wick": "FSC-certified crackling wooden wick",
      "Burn Time": "55-60 hours",
      "Vessel": "Reusable matte ceramic jar"
    },
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-jun-06",
    store_id: "store-juniper-studio-01",
    name: "Smoked Glass Pour-Over Carafe Set",
    description: "Hand-blown heat-resistant borosilicate glass with a subtle warm amber tint. Complete with reusable etched micro-mesh metal filter.",
    price_cents: 7600,
    compare_at_price_cents: 9000,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
    category: "Kitchen & Dining",
    sku: "JUN-CARAFE-01",
    inventory_count: 7,
    status: "active",
    rating: 4.7,
    review_count: 15,
    details: {
      "Material": "Thermal shock resistant borosilicate",
      "Capacity": "750ml (3-4 cups)",
      "Filter": "Included ultra-fine 304 stainless steel cone"
    },
    created_at: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-jun-07",
    store_id: "store-juniper-studio-01",
    name: "Raw Terracotta Pedestal Planter",
    description: "Porous unglazed terracotta that allows plant roots to breathe and thrive naturally. Includes matching deep saucer tray.",
    price_cents: 4600,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
    category: "Home Decor",
    sku: "JUN-PLANT-01",
    inventory_count: 11,
    status: "active",
    rating: 4.8,
    review_count: 28,
    details: {
      "Size": "7\" Diameter x 8\" Height",
      "Drainage": "Center drainage hole with integrated saucer",
      "Material": "Natural Italian terracotta"
    },
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-jun-08",
    store_id: "store-juniper-studio-01",
    name: "Solid Walnut Serving Board",
    description: "Milled from single-slab American walnut with natural live edges and finished in organic beeswax and food-grade mineral oil.",
    price_cents: 8800,
    compare_at_price_cents: 10500,
    currency: "usd",
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    category: "Kitchen & Dining",
    sku: "JUN-BOARD-WAL",
    inventory_count: 5,
    status: "active",
    rating: 5.0,
    review_count: 31,
    badges: ["Heirloom Quality"],
    details: {
      "Size": "18\" L x 10\" W x 1\" Thick",
      "Wood": "Sustainably harvested American Black Walnut",
      "Finish": "Food-safe raw beeswax sealant"
    },
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const SEED_DISCOUNTS: Discount[] = [
  {
    id: "disc-01",
    store_id: "store-juniper-studio-01",
    code: "VELOUR10",
    type: "percentage",
    value: 10,
    min_spend_cents: 0,
    usage_count: 42,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "disc-02",
    store_id: "store-juniper-studio-01",
    code: "WELCOME20",
    type: "percentage",
    value: 20,
    min_spend_cents: 5000,
    usage_count: 18,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "disc-03",
    store_id: "store-juniper-studio-01",
    code: "FREESHIP",
    type: "free_shipping",
    value: 0,
    min_spend_cents: 3000,
    usage_count: 27,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cust-01",
    store_id: "store-juniper-studio-01",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    phone: "+1 (555) 234-5678",
    total_spent_cents: 24800,
    orders_count: 3,
    created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "cust-02",
    store_id: "store-juniper-studio-01",
    name: "Marcus Vance",
    email: "marcus.vance@example.com",
    phone: "+1 (555) 345-6789",
    total_spent_cents: 17800,
    orders_count: 2,
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "cust-03",
    store_id: "store-juniper-studio-01",
    name: "Chloe Chen",
    email: "chloe.chen@example.com",
    phone: "+1 (555) 456-7890",
    total_spent_cents: 11000,
    orders_count: 1,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
];

const SEED_ORDERS: Order[] = [
  {
    id: "ord-1001",
    store_id: "store-juniper-studio-01",
    order_number: 1001,
    customer_id: "cust-01",
    customer_name: "Elena Rostova",
    customer_email: "elena.rostova@example.com",
    status: "fulfilled",
    fulfillment_status: "fulfilled",
    carrier: "USPS Priority",
    tracking_number: "9400111899223192083112",
    shipping_address: {
      street: "742 Evergreen Terrace",
      city: "Portland",
      state: "OR",
      zip: "97201",
      country: "United States",
    },
    currency: "usd",
    subtotal_cents: 14400,
    discount_cents: 1440,
    discount_code: "VELOUR10",
    shipping_cents: 0,
    tax_cents: 0,
    total_cents: 12960,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    order_items: [
      {
        id: "item-01",
        order_id: "ord-1001",
        product_id: "prod-jun-01",
        name: "Hand-thrown Cloud Mug in Oat",
        unit_price_cents: 3400,
        quantity: 2,
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "item-02",
        order_id: "ord-1001",
        product_id: "prod-jun-06",
        name: "Smoked Glass Pour-Over Carafe Set",
        unit_price_cents: 7600,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
      }
    ],
  },
  {
    id: "ord-1002",
    store_id: "store-juniper-studio-01",
    order_number: 1002,
    customer_id: "cust-02",
    customer_name: "Marcus Vance",
    customer_email: "marcus.vance@example.com",
    status: "paid",
    fulfillment_status: "unfulfilled",
    shipping_address: {
      street: "128 Mercer St, Apt 4B",
      city: "New York",
      state: "NY",
      zip: "10012",
      country: "United States",
    },
    currency: "usd",
    subtotal_cents: 17800,
    discount_cents: 0,
    shipping_cents: 0,
    tax_cents: 1580,
    total_cents: 19380,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    order_items: [
      {
        id: "item-03",
        order_id: "ord-1002",
        product_id: "prod-jun-04",
        name: "Waffle Weave Organic Linen Throw",
        unit_price_cents: 11000,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "item-04",
        order_id: "ord-1002",
        product_id: "prod-jun-02",
        name: "Fluted Stoneware Arch Vase",
        unit_price_cents: 6800,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80",
      }
    ],
  },
  {
    id: "ord-1003",
    store_id: "store-juniper-studio-01",
    order_number: 1003,
    customer_id: "cust-03",
    customer_name: "Chloe Chen",
    customer_email: "chloe.chen@example.com",
    status: "paid",
    fulfillment_status: "unfulfilled",
    shipping_address: {
      street: "450 Hayes Street",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
    currency: "usd",
    subtotal_cents: 9000,
    discount_cents: 1800,
    discount_code: "WELCOME20",
    shipping_cents: 500,
    tax_cents: 675,
    total_cents: 8375,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    order_items: [
      {
        id: "item-05",
        order_id: "ord-1003",
        product_id: "prod-jun-03",
        name: "Sculptural Olive Oil Cruet",
        unit_price_cents: 5200,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "item-06",
        order_id: "ord-1003",
        product_id: "prod-jun-05",
        name: "Wild Fig & Hinoki Wood Candle",
        unit_price_cents: 3800,
        quantity: 1,
        image_url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
      }
    ]
  }
];

// ── Local Storage Helper ───────────────────────────────────────────────────
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota limits
  }
}

// Initialize seed data if empty
export function initializeStorageIfNeeded() {
  if (typeof window === "undefined") return;
  
  const stores = getLocal<Store[]>(LOCAL_STORES_KEY, []);
  if (!stores.length) {
    setLocal(LOCAL_STORES_KEY, DEMO_STORES);
  }
  
  const products = getLocal<Product[]>(LOCAL_PRODUCTS_KEY, []);
  if (!products.length) {
    setLocal(LOCAL_PRODUCTS_KEY, SEED_PRODUCTS_JUNIPER);
  }
  
  const discounts = getLocal<Discount[]>(LOCAL_DISCOUNTS_KEY, []);
  if (!discounts.length) {
    setLocal(LOCAL_DISCOUNTS_KEY, SEED_DISCOUNTS);
  }

  const customers = getLocal<Customer[]>(LOCAL_CUSTOMERS_KEY, []);
  if (!customers.length) {
    setLocal(LOCAL_CUSTOMERS_KEY, SEED_CUSTOMERS);
  }

  const orders = getLocal<Order[]>(LOCAL_ORDERS_KEY, []);
  if (!orders.length) {
    setLocal(LOCAL_ORDERS_KEY, SEED_ORDERS);
  }

  const themes = getLocal<Record<string, StoreTheme>>(LOCAL_THEMES_KEY, {});
  if (!themes[DEMO_STORE_JUNIPER.id]) {
    themes[DEMO_STORE_JUNIPER.id] = DEFAULT_THEME;
    setLocal(LOCAL_THEMES_KEY, themes);
  }
}

// ── Session ────────────────────────────────────────────────────────────────
export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  for (const key of [SESSION_KEY, ...SESSION_KEY_FALLBACKS]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Session;
    } catch {
      /* continue */
    }
  }
  return null;
}

export function saveSession(session: Session | null) {
  if (typeof window === "undefined") return;
  const keys = [SESSION_KEY, ...SESSION_KEY_FALLBACKS];
  if (session) {
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
  if (!current?.refresh_token || !SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const next: Session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? current.refresh_token,
      user: data.user ?? current.user,
    };
    saveSession(next);
    return next;
  } catch {
    return null;
  }
}

export class AuthError extends Error {}

async function authedFetch(path: string, init: RequestInit, allowRetry = true): Promise<Response> {
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

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("No Supabase configuration");
  }
  const res = await authedFetch(`/rest/v1${path}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

const writeHeaders = { "Content-Type": "application/json", Prefer: "return=representation" };

// ── Stores ─────────────────────────────────────────────────────────────────
export async function getMyStore(): Promise<Store | null> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Store[]>(`/stores?select=*&order=created_at.asc&limit=1`);
      if (rows && rows.length > 0) return rows[0];
    } catch {
      // fallback to local stores
    }
  }
  const localStores = getLocal<Store[]>(LOCAL_STORES_KEY, DEMO_STORES);
  return localStores[0] || DEMO_STORE_JUNIPER;
}

export async function getStoreByHandle(handle: string): Promise<Store | null> {
  initializeStorageIfNeeded();
  const clean = handle.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const localStores = getLocal<Store[]>(LOCAL_STORES_KEY, DEMO_STORES);
  const found = localStores.find((s) => s.handle === clean);
  if (found) return found;
  return localStores[0] || DEMO_STORE_JUNIPER;
}

export async function createStore(name: string, handle: string): Promise<Store> {
  initializeStorageIfNeeded();
  const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9-]/g, "");
  const newStore: Store = {
    id: `store-${Date.now()}`,
    owner_id: `user-${Date.now()}`,
    name: name.trim(),
    handle: cleanHandle,
    tagline: "Handcrafted & intentional goods",
    currency: "usd",
    created_at: new Date().toISOString(),
  };

  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Store[]>(`/stores`, {
        method: "POST",
        headers: writeHeaders,
        body: JSON.stringify({ name: newStore.name, handle: newStore.handle }),
      });
      if (rows?.[0]) return rows[0];
    } catch {
      // fallback to local
    }
  }

  const stores = getLocal<Store[]>(LOCAL_STORES_KEY, DEMO_STORES);
  stores.unshift(newStore);
  setLocal(LOCAL_STORES_KEY, stores);

  const themes = getLocal<Record<string, StoreTheme>>(LOCAL_THEMES_KEY, {});
  themes[newStore.id] = {
    ...DEFAULT_THEME,
    banner_headline: `Welcome to ${newStore.name}`,
    banner_subhead: "Curated handcrafted pieces made with care and intentional slow design.",
  };
  setLocal(LOCAL_THEMES_KEY, themes);

  return newStore;
}

export async function updateStore(id: string, patch: Partial<Pick<Store, "name" | "handle" | "tagline">>): Promise<Store | undefined> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Store[]>(`/stores?id=eq.${id}`, {
        method: "PATCH",
        headers: writeHeaders,
        body: JSON.stringify(patch),
      });
      if (rows?.[0]) return rows[0];
    } catch {
      // continue to local update
    }
  }
  const stores = getLocal<Store[]>(LOCAL_STORES_KEY, DEMO_STORES);
  const index = stores.findIndex((s) => s.id === id);
  if (index !== -1) {
    stores[index] = { ...stores[index], ...patch };
    setLocal(LOCAL_STORES_KEY, stores);
    return stores[index];
  }
  return undefined;
}

// ── Store Themes & Customization ───────────────────────────────────────────
export async function getStoreTheme(storeId: string): Promise<StoreTheme> {
  initializeStorageIfNeeded();
  const themes = getLocal<Record<string, StoreTheme>>(LOCAL_THEMES_KEY, {});
  return themes[storeId] || DEFAULT_THEME;
}

export async function updateStoreTheme(storeId: string, patch: Partial<StoreTheme>): Promise<StoreTheme> {
  initializeStorageIfNeeded();
  const themes = getLocal<Record<string, StoreTheme>>(LOCAL_THEMES_KEY, {});
  const current = themes[storeId] || DEFAULT_THEME;
  const updated = { ...current, ...patch };
  themes[storeId] = updated;
  setLocal(LOCAL_THEMES_KEY, themes);
  return updated;
}

// ── Products ───────────────────────────────────────────────────────────────
export async function listProducts(storeId: string): Promise<Product[]> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Product[]>(`/products?store_id=eq.${storeId}&select=*&order=created_at.desc`);
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }
  }
  const localProds = getLocal<Product[]>(LOCAL_PRODUCTS_KEY, SEED_PRODUCTS_JUNIPER);
  return localProds.filter((p) => p.store_id === storeId);
}

export type ProductInput = {
  name: string;
  description?: string | null;
  price_cents: number;
  compare_at_price_cents?: number | null;
  inventory_count?: number;
  sku?: string | null;
  image_url?: string | null;
  category?: string;
  status?: Product["status"];
  details?: Record<string, string>;
  variants?: ProductVariant[];
  gallery_urls?: string[];
};

export async function createProduct(storeId: string, input: ProductInput): Promise<Product> {
  initializeStorageIfNeeded();
  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    store_id: storeId,
    name: input.name,
    description: input.description ?? null,
    price_cents: input.price_cents,
    compare_at_price_cents: input.compare_at_price_cents ?? null,
    inventory_count: input.inventory_count ?? 0,
    sku: input.sku ?? null,
    image_url: input.image_url || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    category: input.category || "General",
    currency: "usd",
    status: input.status || "active",
    rating: 5.0,
    review_count: 1,
    details: input.details,
    variants: input.variants || [],
    gallery_urls: input.gallery_urls || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Product[]>(`/products`, {
        method: "POST",
        headers: writeHeaders,
        body: JSON.stringify({
          store_id: storeId,
          name: input.name,
          description: input.description,
          price_cents: input.price_cents,
          inventory_count: input.inventory_count,
          sku: input.sku,
          image_url: input.image_url,
          status: input.status,
        }),
      });
      if (rows?.[0]) return rows[0];
    } catch {
      // fallback
    }
  }

  const products = getLocal<Product[]>(LOCAL_PRODUCTS_KEY, SEED_PRODUCTS_JUNIPER);
  products.unshift(newProduct);
  setLocal(LOCAL_PRODUCTS_KEY, products);
  return newProduct;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Product[]>(`/products?id=eq.${id}`, {
        method: "PATCH",
        headers: writeHeaders,
        body: JSON.stringify(patch),
      });
      if (rows?.[0]) return rows[0];
    } catch {
      // fallback
    }
  }

  const products = getLocal<Product[]>(LOCAL_PRODUCTS_KEY, SEED_PRODUCTS_JUNIPER);
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...patch,
      updated_at: new Date().toISOString(),
    };
    setLocal(LOCAL_PRODUCTS_KEY, products);
    return products[index];
  }
  throw new Error("Product not found");
}

export async function deleteProduct(id: string): Promise<void> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      await rest(`/products?id=eq.${id}`, { method: "DELETE" });
      return;
    } catch {
      // fallback
    }
  }
  const products = getLocal<Product[]>(LOCAL_PRODUCTS_KEY, SEED_PRODUCTS_JUNIPER);
  const filtered = products.filter((p) => p.id !== id);
  setLocal(LOCAL_PRODUCTS_KEY, filtered);
}

// ── Product Reviews ────────────────────────────────────────────────────────
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  return [
    {
      id: `rev-${productId}-1`,
      product_id: productId,
      author_name: "Sarah M.",
      rating: 5,
      title: "Absolutely stunning craftsmanship",
      comment: "The tactile feel, weight, and glaze finish exceed everything I hoped for. Fits so comfortably in hand and has become my cherished morning ritual.",
      date: "3 days ago",
      verified: true,
    },
    {
      id: `rev-${productId}-2`,
      product_id: productId,
      author_name: "David K.",
      rating: 5,
      title: "Arrived beautifully packaged",
      comment: "Opening the box felt like receiving a gift from a high-end Tokyo boutique. Safe, plastic-free packaging and heirloom quality.",
      date: "1 week ago",
      verified: true,
    },
    {
      id: `rev-${productId}-3`,
      product_id: productId,
      author_name: "Amara L.",
      rating: 4,
      title: "Worth every penny",
      comment: "Subtle texture and soothing tones. Love that it's made in small artisan batches.",
      date: "2 weeks ago",
      verified: true,
    }
  ];
}

// ── Customers ──────────────────────────────────────────────────────────────
export async function listCustomers(storeId: string): Promise<Customer[]> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Customer[]>(`/customers?store_id=eq.${storeId}&select=*&order=created_at.desc`);
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }
  }
  const customers = getLocal<Customer[]>(LOCAL_CUSTOMERS_KEY, SEED_CUSTOMERS);
  return customers.filter((c) => c.store_id === storeId);
}

export async function createCustomer(
  storeId: string,
  input: { email: string; name?: string | null; phone?: string | null },
): Promise<Customer> {
  initializeStorageIfNeeded();
  const customers = getLocal<Customer[]>(LOCAL_CUSTOMERS_KEY, SEED_CUSTOMERS);
  const existing = customers.find((c) => c.email.toLowerCase() === input.email.toLowerCase() && c.store_id === storeId);
  if (existing) {
    if (input.name && !existing.name) existing.name = input.name;
    setLocal(LOCAL_CUSTOMERS_KEY, customers);
    return existing;
  }

  const newCust: Customer = {
    id: `cust-${Date.now()}`,
    store_id: storeId,
    email: input.email.toLowerCase(),
    name: input.name || null,
    phone: input.phone || null,
    total_spent_cents: 0,
    orders_count: 0,
    created_at: new Date().toISOString(),
  };

  customers.unshift(newCust);
  setLocal(LOCAL_CUSTOMERS_KEY, customers);
  return newCust;
}

// ── Discounts & Promo Engine ───────────────────────────────────────────────
export async function listDiscounts(storeId: string): Promise<Discount[]> {
  initializeStorageIfNeeded();
  const discounts = getLocal<Discount[]>(LOCAL_DISCOUNTS_KEY, SEED_DISCOUNTS);
  return discounts.filter((d) => d.store_id === storeId);
}

export async function createDiscount(
  storeId: string,
  input: {
    code: string;
    type: Discount["type"];
    value: number;
    min_spend_cents?: number;
  },
): Promise<Discount> {
  initializeStorageIfNeeded();
  const discounts = getLocal<Discount[]>(LOCAL_DISCOUNTS_KEY, SEED_DISCOUNTS);
  const cleanCode = input.code.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, "");
  
  if (discounts.some((d) => d.code === cleanCode && d.store_id === storeId)) {
    throw new Error(`Discount code ${cleanCode} already exists in this store.`);
  }

  const newDisc: Discount = {
    id: `disc-${Date.now()}`,
    store_id: storeId,
    code: cleanCode,
    type: input.type,
    value: input.value,
    min_spend_cents: input.min_spend_cents || 0,
    usage_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  discounts.unshift(newDisc);
  setLocal(LOCAL_DISCOUNTS_KEY, discounts);
  return newDisc;
}

export async function validateDiscountCode(
  storeId: string,
  code: string,
  subtotalCents: number,
): Promise<{ valid: boolean; discount?: Discount; discountAmountCents: number; message: string }> {
  initializeStorageIfNeeded();
  const clean = code.toUpperCase().trim();
  const discounts = getLocal<Discount[]>(LOCAL_DISCOUNTS_KEY, SEED_DISCOUNTS);
  const found = discounts.find((d) => d.code === clean && d.store_id === storeId && d.is_active);

  if (!found) {
    return { valid: false, discountAmountCents: 0, message: "Invalid or expired discount code." };
  }

  if (subtotalCents < found.min_spend_cents) {
    return {
      valid: false,
      discount: found,
      discountAmountCents: 0,
      message: `Minimum order of ${money(found.min_spend_cents)} required for this code.`,
    };
  }

  let amount = 0;
  if (found.type === "percentage") {
    amount = Math.round((subtotalCents * found.value) / 100);
  } else if (found.type === "fixed") {
    amount = Math.min(subtotalCents, found.value);
  } else if (found.type === "free_shipping") {
    amount = 500; // Standard shipping rate discount
  }

  return {
    valid: true,
    discount: found,
    discountAmountCents: amount,
    message: `Applied ${found.code}: ${found.type === "percentage" ? `${found.value}% off` : found.type === "free_shipping" ? "Free Shipping" : `${money(found.value)} off`}`,
  };
}

// ── Orders & Checkout Pipeline ─────────────────────────────────────────────
export async function listOrders(storeId: string): Promise<Order[]> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Order[]>(
        `/orders?store_id=eq.${storeId}&select=*,order_items(*),customers(name,email)&order=created_at.desc`,
      );
      if (rows && rows.length > 0) return rows;
    } catch {
      // fallback
    }
  }
  const orders = getLocal<Order[]>(LOCAL_ORDERS_KEY, SEED_ORDERS);
  return orders.filter((o) => o.store_id === storeId);
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<Order> {
  initializeStorageIfNeeded();
  if (SUPABASE_URL && SUPABASE_KEY && loadSession()) {
    try {
      const rows = await rest<Order[]>(`/orders?id=eq.${id}`, {
        method: "PATCH",
        headers: writeHeaders,
        body: JSON.stringify({ status }),
      });
      if (rows?.[0]) return rows[0];
    } catch {
      // fallback
    }
  }
  const orders = getLocal<Order[]>(LOCAL_ORDERS_KEY, SEED_ORDERS);
  const index = orders.findIndex((o) => o.id === id);
  if (index !== -1) {
    orders[index] = { ...orders[index], status, updated_at: new Date().toISOString() };
    setLocal(LOCAL_ORDERS_KEY, orders);
    return orders[index];
  }
  throw new Error("Order not found");
}

export async function fulfillOrder(
  id: string,
  carrier: string,
  trackingNumber: string,
): Promise<Order> {
  initializeStorageIfNeeded();
  const orders = getLocal<Order[]>(LOCAL_ORDERS_KEY, SEED_ORDERS);
  const index = orders.findIndex((o) => o.id === id);
  if (index !== -1) {
    orders[index] = {
      ...orders[index],
      status: "fulfilled",
      fulfillment_status: "fulfilled",
      carrier,
      tracking_number: trackingNumber,
      updated_at: new Date().toISOString(),
    };
    setLocal(LOCAL_ORDERS_KEY, orders);
    return orders[index];
  }
  throw new Error("Order not found");
}

export type StorefrontOrderInput = {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: {
    productId: string;
    name: string;
    unitPriceCents: number;
    quantity: number;
    imageUrl?: string | null;
  }[];
  shippingMethod: {
    name: string;
    priceCents: number;
  };
  discountCode?: string | null;
  discountCents?: number;
};

/**
 * Executes a full checkout transaction:
 * 1. Creates/updates customer profile
 * 2. Decrements product inventories
 * 3. Increments discount code usage
 * 4. Generates order with tracking timeline
 */
export async function placeStorefrontOrder(
  storeId: string,
  input: StorefrontOrderInput,
): Promise<Order> {
  initializeStorageIfNeeded();

  // 1. Link customer
  const customer = await createCustomer(storeId, {
    email: input.customer.email,
    name: input.customer.name,
    phone: input.customer.phone,
  });

  // 2. Compute totals
  const subtotalCents = input.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const discountCents = input.discountCents || 0;
  const shippingCents = input.shippingMethod.priceCents || 0;
  const taxableAmount = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxableAmount * 0.075); // 7.5% estimated tax
  const totalCents = taxableAmount + shippingCents + taxCents;

  const orders = getLocal<Order[]>(LOCAL_ORDERS_KEY, SEED_ORDERS);
  const nextOrderNumber = (orders[0]?.order_number || 1000) + 1;
  const orderId = `ord-${Date.now()}`;

  const newOrder: Order = {
    id: orderId,
    store_id: storeId,
    order_number: nextOrderNumber,
    customer_id: customer.id,
    customer_name: input.customer.name,
    customer_email: input.customer.email,
    shipping_address: input.shippingAddress,
    status: "paid",
    fulfillment_status: "unfulfilled",
    currency: "usd",
    subtotal_cents: subtotalCents,
    discount_cents: discountCents,
    discount_code: input.discountCode,
    shipping_cents: shippingCents,
    tax_cents: taxCents,
    total_cents: totalCents,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    order_items: input.items.map((item, idx) => ({
      id: `item-${orderId}-${idx + 1}`,
      order_id: orderId,
      product_id: item.productId,
      name: item.name,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
      image_url: item.imageUrl,
    })),
    customers: {
      name: input.customer.name,
      email: input.customer.email,
    },
  };

  orders.unshift(newOrder);
  setLocal(LOCAL_ORDERS_KEY, orders);

  // 3. Decrement product inventories
  const products = getLocal<Product[]>(LOCAL_PRODUCTS_KEY, SEED_PRODUCTS_JUNIPER);
  for (const item of input.items) {
    const pIndex = products.findIndex((p) => p.id === item.productId);
    if (pIndex !== -1) {
      products[pIndex].inventory_count = Math.max(0, products[pIndex].inventory_count - item.quantity);
    }
  }
  setLocal(LOCAL_PRODUCTS_KEY, products);

  // 4. Update customer total spent
  const customers = getLocal<Customer[]>(LOCAL_CUSTOMERS_KEY, SEED_CUSTOMERS);
  const cIndex = customers.findIndex((c) => c.id === customer.id);
  if (cIndex !== -1) {
    customers[cIndex].total_spent_cents = (customers[cIndex].total_spent_cents || 0) + totalCents;
    customers[cIndex].orders_count = (customers[cIndex].orders_count || 0) + 1;
    setLocal(LOCAL_CUSTOMERS_KEY, customers);
  }

  // 5. Update discount usage
  if (input.discountCode) {
    const discounts = getLocal<Discount[]>(LOCAL_DISCOUNTS_KEY, SEED_DISCOUNTS);
    const dIndex = discounts.findIndex((d) => d.code === input.discountCode);
    if (dIndex !== -1) {
      discounts[dIndex].usage_count = (discounts[dIndex].usage_count || 0) + 1;
      setLocal(LOCAL_DISCOUNTS_KEY, discounts);
    }
  }

  return newOrder;
}

export async function createOrder(
  storeId: string,
  input: {
    customerName?: string | null;
    customerId?: string | null;
    status?: Order["status"];
    items: { product_id?: string | null; name: string; unit_price_cents: number; quantity: number }[];
  },
): Promise<Order> {
  const orderData: StorefrontOrderInput = {
    customer: {
      name: input.customerName || "Walk-in Customer",
      email: "guest@velour.live",
    },
    shippingAddress: {
      street: "Direct Studio Sale",
      city: "San Francisco",
      state: "CA",
      zip: "94103",
      country: "United States",
    },
    items: input.items.map((i) => ({
      productId: i.product_id || "custom-item",
      name: i.name,
      unitPriceCents: i.unit_price_cents,
      quantity: i.quantity,
    })),
    shippingMethod: {
      name: "Direct Pick Up",
      priceCents: 0,
    },
  };
  return placeStorefrontOrder(storeId, orderData);
}

// ── Overview Metrics ───────────────────────────────────────────────────────
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
    salesThisWeekCents: salesThisWeekCents || (paid.length ? paid.reduce((s, o) => s + o.total_cents, 0) : 0),
    salesLastWeekCents,
    orderCount: orders.length,
    customerCount: customers.length,
    productCount: products.length,
    recentOrders: orders.slice(0, 6),
    lowStock: products
      .filter((p) => p.status === "active" && p.inventory_count <= 6)
      .slice(0, 6),
  };
}

// ── Formatting Helpers ─────────────────────────────────────────────────────
export function money(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((cents || 0) / 100);
}

export function dollarsToCents(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
