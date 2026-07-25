/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdminLoginResult,
  AdminTotpResult,
  ApiClient,
  ApiError,
  AuthTokens,
  KycSubmitInput,
  KycSubmitResult,
  ListingFilters,
  ListingInput,
  ListingUpdateInput,
  OtpRequestResult,
  OtpVerifyResult,
  PaystackInitResult,
  PaystackVerifyResult,
  PayoutRequest,
  PayoutStatus,
  ProfileSetupResult,
} from "./types";
import { BackendUser, Dispute, EscrowStatus, Listing, ListingsPage, Transaction } from "../types/backend";

// ---------------------------------------------------------------------------
// Talks to the real backend in apps/api. Base URL defaults to the local dev
// server (Nest URI versioning with no global prefix → routes live at
// /v1/..., NOT /api/v1/... — confirmed from main.ts, there's no
// app.setGlobalPrefix() call).
//
// The backend's global ValidationPipe uses whitelist:true +
// forbidNonWhitelisted:true — sending a field a DTO doesn't declare causes a
// 400, not a silent ignore. Every request body below sends exactly the DTO's
// fields, nothing more.
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/v1";

const ACCESS_KEY = "ayopa_access_token";
const REFRESH_KEY = "ayopa_refresh_token";

function getTokens(): AuthTokens | null {
  const accessToken = localStorage.getItem(ACCESS_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}
function setTokens(tokens: AuthTokens | null) {
  if (tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  } else {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

// Extracts a human-readable message from the backend's AllExceptionsFilter
// shape: { statusCode, timestamp, path, message }, where `message` may be a
// string, a class-validator string[], or (rarely) an object.
function extractMessage(body: any, fallback: string): string {
  const m = body?.message;
  if (typeof m === "string") return m;
  if (Array.isArray(m)) return m.join(" ");
  if (m && typeof m === "object") return JSON.stringify(m);
  return fallback;
}

let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function doRefresh(): Promise<AuthTokens | null> {
  const tokens = getTokens();
  if (!tokens) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) {
      setTokens(null);
      return null;
    }
    const next: AuthTokens = await res.json();
    setTokens(next);
    return next;
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}, opts: { auth?: boolean; retried?: boolean } = {}): Promise<T> {
  const tokens = getTokens();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(opts.auth !== false && tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && opts.auth !== false && !opts.retried) {
    // Access token likely expired — try one silent refresh, then retry once.
    if (!refreshInFlight) refreshInFlight = doRefresh().finally(() => (refreshInFlight = null));
    const refreshed = await refreshInFlight;
    if (refreshed) {
      return request<T>(path, options, { ...opts, retried: true });
    }
  }

  if (!res.ok) {
    let body: any = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(extractMessage(body, `Request failed (${res.status})`), res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function createLiveApiClient(): ApiClient {
  return {
    auth: {
      // POST /auth/otp/request — auth.controller.ts
      requestOtp: (phone) =>
        request<OtpRequestResult>("/auth/otp/request", { method: "POST", body: JSON.stringify({ phone }) }, { auth: false }),

      // POST /auth/otp/verify — auth.controller.ts
      verifyOtp: async (phone, code) => {
        const result = await request<OtpVerifyResult>(
          "/auth/otp/verify",
          { method: "POST", body: JSON.stringify({ phone, code }) },
          { auth: false }
        );
        setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
        return result;
      },

      // POST /auth/profile/setup — requires bearer token (provisional or full)
      setupProfile: async (fullName, role) => {
        const result = await request<ProfileSetupResult>("/auth/profile/setup", {
          method: "POST",
          body: JSON.stringify({ fullName, role }),
        });
        setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
        return result;
      },

      // POST /auth/refresh
      refresh: async (refreshToken) => {
        const result = await request<AuthTokens>(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refreshToken }) },
          { auth: false }
        );
        setTokens(result);
        return result;
      },

      // GET /users/me — response is wrapped as { user: {...} }
      me: async () => {
        if (!getTokens()) return null;
        try {
          const result = await request<{ user: BackendUser }>("/users/me");
          return result.user;
        } catch {
          return null;
        }
      },

      logout: () => setTokens(null),

      // POST /admin/auth/login — staff email+password, step 1 of 2. No bearer yet.
      adminLogin: (email, password) =>
        request<AdminLoginResult>(
          "/admin/auth/login",
          { method: "POST", body: JSON.stringify({ email, password }) },
          { auth: false }
        ),

      // POST /admin/auth/totp/verify — staff TOTP, step 2. Issues real tokens on success.
      adminVerifyTotp: async (email, code) => {
        const result = await request<AdminTotpResult>(
          "/admin/auth/totp/verify",
          { method: "POST", body: JSON.stringify({ email, code }) },
          { auth: false }
        );
        if (result.verified && result.accessToken && result.refreshToken) {
          setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
        }
        return result;
      },
    },

    listings: {
      // GET /listings?search=&category=&page=&limit=
      list: (filters) =>
        request<ListingsPage>(
          `/listings${toQueryString({ search: filters.search, category: filters.category, page: filters.page, limit: filters.limit })}`,
          {},
          { auth: false }
        ),

      // GET /listings/:id
      getById: async (id) => {
        try {
          return await request<Listing>(`/listings/${id}`, {}, { auth: false });
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) return null;
          throw err;
        }
      },

      // POST /listings — seller only, full profile + approved KYC (enforced server-side)
      create: (input: ListingInput) =>
        request<Listing>("/listings", { method: "POST", body: JSON.stringify(input) }),

      // PATCH /listings/:id — owning seller only
      update: (id, input: ListingUpdateInput) =>
        request<Listing>(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

      // DELETE /listings/:id — soft delete, owning seller only
      remove: async (id) => {
        await request<void>(`/listings/${id}`, { method: "DELETE" });
      },

      // GET /listings/deleted — admin/moderator only
      deleted: (page = 1, limit = 20) =>
        request<ListingsPage>(`/listings/deleted${toQueryString({ page, limit })}`),
    },

    transactions: {
      // POST /transactions — CreateTransactionDto: { listingId, amount } exactly
      create: (listingId, amount) =>
        request<Transaction>("/transactions", { method: "POST", body: JSON.stringify({ listingId, amount }) }),

      // GET /transactions — both bought and sold, for the current user
      list: () => request<Transaction[]>("/transactions"),
    },

    escrow: {
      // POST /escrow/:transactionId/transition — { status }
      transition: (transactionId, status) =>
        request<Transaction>(`/escrow/${transactionId}/transition`, {
          method: "POST",
          body: JSON.stringify({ status }),
        }),
    },

    paystack: {
      // POST /paystack/initialize — controller forwards exactly:
      // { email, amount, subaccount?, transactionId?, callbackUrl? }
      initialize: (input) =>
        request<PaystackInitResult>("/paystack/initialize", {
          method: "POST",
          body: JSON.stringify({
            email: input.email,
            amount: input.amount,
            transactionId: input.transactionId,
            callbackUrl: input.callbackUrl,
          }),
        }),

      // GET /paystack/verify/:reference
      verify: (reference) => request<PaystackVerifyResult>(`/paystack/verify/${reference}`),
    },

    disputes: {
      // POST /disputes — CreateDisputeDto: { transactionId, reason }
      create: (transactionId, reason) =>
        request<Dispute>("/disputes", { method: "POST", body: JSON.stringify({ transactionId, reason }) }),

      // GET /disputes — disputes the signed-in user (buyer or seller) is party to
      list: () => request<Dispute[]>("/disputes"),

      // POST /disputes/:id/seller-response — seller only, 12hr window (server-enforced)
      sellerRespond: (id, response) =>
        request<Dispute>(`/disputes/${id}/seller-response`, {
          method: "POST",
          body: JSON.stringify({ response }),
        }),
    },

    kyc: {
      // POST /kyc/upload — KycUploadDto: { documentType, nin?, bvn? }
      submit: (input: KycSubmitInput) =>
        request<KycSubmitResult>("/kyc/upload", { method: "POST", body: JSON.stringify(input) }),
    },

    admin: {
      // GET /admin/users — admin only
      listUsers: () => request<BackendUser[]>("/admin/users"),

      // PATCH /admin/users/:id — AdminUpdateUserDto: { role?, isActive?, isVerified? }
      updateUser: (id, input) =>
        request<BackendUser>(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    },

    payouts: {
      // GET /payouts?status= — finance_officer, admin, super_admin
      list: (status?: PayoutStatus) =>
        request<PayoutRequest[]>(`/payouts${toQueryString({ status })}`),

      // POST /payouts/:id/approve — admin, super_admin. Two distinct approvals execute the transfer.
      approve: (id, comment) =>
        request<PayoutRequest>(`/payouts/${id}/approve`, {
          method: "POST",
          body: JSON.stringify({ comment }),
        }),

      // POST /payouts/:id/reject — admin, super_admin
      reject: (id, reason) =>
        request<PayoutRequest>(`/payouts/${id}/reject`, {
          method: "POST",
          body: JSON.stringify({ reason }),
        }),
    },
  };
}

// EscrowStatus re-export kept out of this file on purpose — see types/backend.ts.
export type { EscrowStatus };
