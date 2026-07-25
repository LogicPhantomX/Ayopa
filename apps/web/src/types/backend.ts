/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// These mirror apps/api/src/modules/**/entities/*.entity.ts in the Ayopá
// backend exactly. Do not add fields here that aren't in the real entity —
// this file is the contract the whole frontend trusts. If the backend adds a
// field later (listing photos, seller ratings, delivery address, etc.),
// extend it here first, in one place.

export type UserRole = "provisional" | "buyer" | "seller" | "admin" | "super_admin";

export interface BackendUser {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean; // phone verified via OTP — NOT a KYC/identity check
  isProvisional: boolean;
  createdAt: string;
}

// Listing.category is a free-text column on the backend (no enum) — these
// are just suggested values we filter by; sellers could type anything.
export const SUGGESTED_CATEGORIES = [
  "Cows", "Goats", "Rams", "Sheep", "Chickens", "Horses",
  "Rabbits", "Camels", "Donkeys", "Fish", "Pigeons",
  "Livestock Services", "Transportation Services",
] as const;

export interface Listing {
  id: string;
  sellerId: string;
  seller: BackendUser;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  location: string | null;
  status: string; // 'draft' | 'published' | ... — not enforced server-side yet
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingsPage {
  items: Listing[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export type EscrowStatus =
  | "CREATED"
  | "PAYMENT_HELD"
  | "FIRST_RELEASED"
  | "DELIVERY_CONFIRMED"
  | "COMPLETED"
  | "DISPUTED"
  | "DISPUTE_RESOLVED"
  | "REFUNDED";

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  buyer: BackendUser;
  seller: BackendUser;
  listing: Listing;
  amount: number;
  currency: string;
  status: EscrowStatus;
  commissionAmount: number;
  firstReleaseAmount: number;
  escrowReleased: boolean;
  autoReleaseAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  reason: string;
  status: string;
  createdAt: string;
}
