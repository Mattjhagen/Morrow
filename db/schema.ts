/**
 * Morrow's production data model lives in Supabase Postgres.
 *
 * The canonical migration is `supabase/migrations/20260813000000_morrow_foundation.sql`.
 * Keeping these types here documents the tenant boundary used by every later commerce
 * table: every store-owned record must have a `store_id` and be protected by membership.
 */
export type StoreRole = "owner" | "admin" | "staff";

export type MorrowProfile = {
  id: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
};

export type MorrowStore = {
  id: string;
  ownerId: string;
  name: string;
  handle: string;
  createdAt: string;
};

export type StoreMembership = {
  storeId: string;
  userId: string;
  role: StoreRole;
  createdAt: string;
};
