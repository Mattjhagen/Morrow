import { Product, Store, StoreTheme, Discount, Order } from "../lib/store-api";

export type CartItem = {
  product: Product;
  quantity: number;
  selectedVariant?: string;
};

export type StorefrontState = {
  store: Store;
  theme: StoreTheme;
  products: Product[];
  categories: string[];
  selectedCategory: string;
  searchQuery: string;
  sortBy: "featured" | "price-asc" | "price-desc" | "rating" | "newest";
  cart: CartItem[];
  appliedDiscount: Discount | null;
  activePdpProduct: Product | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  confirmedOrder: Order | null;
};
