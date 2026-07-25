/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Livestock domain types. These describe the shape Ayopá's real backend
// (built separately by the API team) is expected to return — kept in one
// place so the mock adapter and the future live client implement the exact
// same contract. See src/api/client.ts.

export type AnimalCategory =
  | "Cows"
  | "Goats"
  | "Rams"
  | "Sheep"
  | "Chickens"
  | "Horses"
  | "Rabbits"
  | "Camels"
  | "Donkeys"
  | "Fish"
  | "Pigeons"
  | "Livestock Services"
  | "Transportation Services";

export type UnitOfSale = "head" | "crate" | "kg" | "service";

export interface AIWeightEstimate {
  /** Always surfaced to buyers as an estimate — never a guarantee. */
  minKg: number;
  maxKg: number;
  confidence: number; // 0–1
  generatedAt: string;
}

export interface SellerTrustBadge {
  sellerId: string;
  sellerName: string;
  location: string; // e.g. "Ogbomoso, Oyo State"
  verified: boolean; // KYC passed
  rating: number; // 0–5
  ratingCount: number;
  yearsActive: number;
  responseTimeMinutes?: number;
}

export interface Listing {
  id: string;
  title: string;
  category: AnimalCategory;
  breed?: string;
  ageMonths?: number;
  photos: string[]; // URLs; mock adapter uses local gradient placeholders
  videoUrl?: string;
  description: string;
  pricePerUnit: number; // Naira
  unit: UnitOfSale;
  minQuantity: number;
  availableQuantity: number;
  location: string;
  weightEstimate?: AIWeightEstimate;
  seller: SellerTrustBadge;
  isFeatured?: boolean;
  createdAt: string;
}

export interface ListingFilters {
  query?: string;
  category?: AnimalCategory | "All";
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "recommended" | "price-asc" | "price-desc" | "newest";
  page?: number;
  pageSize?: number;
}

export interface ListingSearchResult {
  items: Listing[];
  total: number;
  page: number;
  pageSize: number;
}
