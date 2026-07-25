/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendUser, Dispute, EscrowStatus, Listing, ListingsPage, Transaction } from "../types/backend";

// ---------------------------------------------------------------------------
// This interface is a direct mirror of the real Ayopá backend
// (apps/api/src/modules/**). Every method maps to one real, verified route —
// see the comment above each one in liveAdapter.ts for the exact
// controller/DTO it was read from. Nothing here is speculative.
//
// Two important backend realities that shape this contract:
//   1. A Transaction is against ONE listing with a single `amount` — there is
//      no cart, line items, or quantity/stock field anywhere server-side.
//      "Quantity" in the UI is a pure client-side multiplier baked into
//      `amount` (quantity × listing.price) before the transaction is created.
//   2. There is no delivery-address, listing-photo, or seller-rating table.
//      The UI must not invent data for these — see components for how each
//      gap is handled (omitted, or clearly marked as not yet available).
// ---------------------------------------------------------------------------

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OtpRequestResult {
  success: boolean;
  devMode: boolean;
  phone: string;
  expiresIn: number;
}

export interface OtpVerifyResult extends AuthTokens {
  user: BackendUser;
  isNewUser: boolean;
  nextStep?: string;
}

export interface ProfileSetupResult extends AuthTokens {
  user: BackendUser;
  message: string;
}

export interface ListingFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaystackInitResult {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResult {
  status: boolean;
  message: string;
  data: {
    status: string; // 'success' | 'failed' | 'abandoned' | ...
    reference: string;
    amount: number;
    metadata?: { transactionId?: string };
  };
}

// ── Seller: listing create/update — CreateListingDto / UpdateListingDto ──────
export interface ListingInput {
  title: string;
  description: string;
  category: string;
  price: number;
  location?: string;
  currency?: string;
}
export interface ListingUpdateInput extends Partial<ListingInput> {
  status?: string;
}

// ── Seller: KYC — KycUploadDto (POST /kyc/upload) ────────────────────────────
export interface KycSubmitInput {
  documentType: string;
  nin?: string;
  bvn?: string;
}
export interface KycSubmitResult {
  id: string;
  status: string;
}

// ── Admin/staff auth — POST /admin/auth/login, /admin/auth/totp/verify ──────
// A separate, higher-privilege login for staff accounts (admin / super_admin),
// distinct from the buyer/seller OTP flow. Two steps: password, then TOTP.
export interface AdminLoginResult {
  success: boolean;
  requiresTotp: boolean;
  enrolling: boolean;
  email: string;
  totpSecret?: string;
  otpauthUrl?: string;
}
export interface AdminTotpResult {
  success: boolean;
  verified: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: BackendUser;
}

// ── Admin: payouts — PayoutsController ───────────────────────────────────────
export type PayoutStatus = "pending" | "approved" | "executing" | "completed" | "rejected" | "failed";
export interface PayoutRequest {
  id: string;
  recipientCode: string;
  amount: number;
  reason: string;
  status: PayoutStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiClient {
  auth: {
    requestOtp(phone: string): Promise<OtpRequestResult>;
    verifyOtp(phone: string, code: string): Promise<OtpVerifyResult>;
    setupProfile(fullName: string, role: "buyer" | "seller"): Promise<ProfileSetupResult>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    me(): Promise<BackendUser | null>;
    logout(): void;
    // Staff-only login path — see AdminLoginResult/AdminTotpResult above.
    adminLogin(email: string, password: string): Promise<AdminLoginResult>;
    adminVerifyTotp(email: string, code: string): Promise<AdminTotpResult>;
  };
  listings: {
    list(filters: ListingFilters): Promise<ListingsPage>;
    getById(id: string): Promise<Listing | null>;
    // Seller-only — requires a full (non-provisional) profile; sellers also
    // need approved KYC, enforced server-side.
    create(input: ListingInput): Promise<Listing>;
    update(id: string, input: ListingUpdateInput): Promise<Listing>;
    remove(id: string): Promise<void>;
    // Admin-only — soft-deleted listings.
    deleted(page?: number, limit?: number): Promise<ListingsPage>;
  };
  transactions: {
    create(listingId: string, amount: number): Promise<Transaction>;
    // Returns everything the signed-in user is party to, buyer or seller side.
    list(): Promise<Transaction[]>;
  };
  escrow: {
    transition(transactionId: string, status: EscrowStatus): Promise<Transaction>;
  };
  paystack: {
    initialize(input: { email: string; amount: number; transactionId: string; callbackUrl: string }): Promise<PaystackInitResult>;
    verify(reference: string): Promise<PaystackVerifyResult>;
  };
  disputes: {
    create(transactionId: string, reason: string): Promise<Dispute>;
    // Disputes the signed-in user (buyer or seller) is party to.
    list(): Promise<Dispute[]>;
    sellerRespond(id: string, response: string): Promise<Dispute>;
  };
  kyc: {
    submit(input: KycSubmitInput): Promise<KycSubmitResult>;
  };
  admin: {
    listUsers(): Promise<BackendUser[]>;
    updateUser(id: string, input: { role?: string; isActive?: boolean; isVerified?: boolean }): Promise<BackendUser>;
  };
  payouts: {
    list(status?: PayoutStatus): Promise<PayoutRequest[]>;
    approve(id: string, comment?: string): Promise<PayoutRequest>;
    reject(id: string, reason?: string): Promise<PayoutRequest>;
  };
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}
