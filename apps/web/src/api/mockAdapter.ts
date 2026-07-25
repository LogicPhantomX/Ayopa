/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdminLoginResult,
  AdminTotpResult,
  ApiClient,
  ApiError,
  KycSubmitInput,
  KycSubmitResult,
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

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const KEYS = {
  session: "ayopa_mock_session",
  otp: "ayopa_mock_otp_pending",
  transactions: "ayopa_mock_transactions",
  disputes: "ayopa_mock_disputes",
  listings: "ayopa_mock_listings",
  kyc: "ayopa_mock_kyc",
  users: "ayopa_mock_users",
  payouts: "ayopa_mock_payouts",
  adminSession: "ayopa_mock_admin_session",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function mockSeller(id: string, name: string): BackendUser {
  return {
    id,
    email: null,
    fullName: name,
    phone: "+2348012345678",
    role: "seller",
    isActive: true,
    isVerified: true,
    isProvisional: false,
    createdAt: "2026-06-01T09:00:00Z",
  };
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: "lst-1",
    sellerId: "sell-1",
    seller: mockSeller("sell-1", "Adewale Livestock Farm"),
    title: "White Fulani Bull, Well-Fed",
    description: "Healthy, grain-finished White Fulani bull. Vaccinated and dewormed, ready for sale.",
    category: "Cows",
    price: 850000,
    currency: "NGN",
    location: "Ogbomoso, Oyo State",
    status: "published",
    isFeatured: true,
    createdAt: "2026-07-14T09:00:00Z",
    updatedAt: "2026-07-14T09:00:00Z",
  },
  {
    id: "lst-2",
    sellerId: "sell-2",
    seller: mockSeller("sell-2", "Peace Adeoba Livestock Pen"),
    title: "Red Sokoto Goats, Buck & Doe",
    description: "Disease-free stock from a registered pen. Good for meat or restocking.",
    category: "Goats",
    price: 65000,
    currency: "NGN",
    location: "Ogbomoso, Oyo State",
    status: "published",
    isFeatured: true,
    createdAt: "2026-07-16T09:00:00Z",
    updatedAt: "2026-07-16T09:00:00Z",
  },
  {
    id: "lst-3",
    sellerId: "sell-3",
    seller: mockSeller("sell-3", "Kano Central Ram Market Co-op"),
    title: "Yankasa Rams — Sallah Ready",
    description: "Big, healthy Yankasa rams, hand-fed for two months. Horns intact, active and alert.",
    category: "Rams",
    price: 145000,
    currency: "NGN",
    location: "Kano, Kano State",
    status: "published",
    isFeatured: true,
    createdAt: "2026-07-15T09:00:00Z",
    updatedAt: "2026-07-15T09:00:00Z",
  },
  {
    id: "lst-4",
    sellerId: "sell-4",
    seller: mockSeller("sell-4", "Sunrise Poultry Ibadan"),
    title: "Broiler Chickens — Live, 6 Weeks",
    description: "Live broiler chickens, vaccinated batch, ready for table.",
    category: "Chickens",
    price: 8500,
    currency: "NGN",
    location: "Ibadan, Oyo State",
    status: "published",
    isFeatured: false,
    createdAt: "2026-07-17T09:00:00Z",
    updatedAt: "2026-07-17T09:00:00Z",
  },
];

function loadListings(): Listing[] {
  return read<Listing[]>(KEYS.listings, MOCK_LISTINGS);
}
function saveListings(items: Listing[]) {
  write(KEYS.listings, items);
}

export function createMockApiClient(): ApiClient {
  return {
    auth: {
      async requestOtp(phone): Promise<OtpRequestResult> {
        await wait();
        write(KEYS.otp, { phone, code: "123456" });
        return { success: true, devMode: true, phone, expiresIn: 300 };
      },

      async verifyOtp(phone, code): Promise<OtpVerifyResult> {
        await wait();
        const pending = read<{ phone: string; code: string } | null>(KEYS.otp, null);
        if (!pending || pending.phone !== phone || pending.code !== code) {
          throw new ApiError("Invalid OTP.", 401);
        }
        const existing = read<BackendUser | null>(KEYS.session, null);
        if (existing && existing.phone === phone) {
          return { user: existing, accessToken: "mock-token", refreshToken: "mock-refresh", isNewUser: false };
        }
        const user: BackendUser = {
          id: `usr-${phone.replace(/\D/g, "")}`,
          email: null,
          fullName: null,
          phone,
          role: "provisional",
          isActive: true,
          isVerified: true,
          isProvisional: true,
          createdAt: new Date().toISOString(),
        };
        write(KEYS.session, user);
        return {
          user,
          accessToken: "mock-token",
          refreshToken: "mock-refresh",
          isNewUser: true,
          nextStep: "POST /auth/profile/setup — provide fullName and role (buyer|seller)",
        };
      },

      async setupProfile(fullName, role): Promise<ProfileSetupResult> {
        await wait();
        const user = read<BackendUser | null>(KEYS.session, null);
        if (!user) throw new ApiError("Not authenticated.", 401);
        const updated: BackendUser = { ...user, fullName, role, isProvisional: false };
        write(KEYS.session, updated);
        return {
          user: updated,
          accessToken: "mock-token",
          refreshToken: "mock-refresh",
          message: role === "seller" ? "Profile complete. Upload KYC documents before listing." : "Profile complete. You can now browse and purchase livestock.",
        };
      },

      async refresh() {
        await wait(150);
        return { accessToken: "mock-token", refreshToken: "mock-refresh" };
      },

      async me(): Promise<BackendUser | null> {
        await wait(120);
        return read<BackendUser | null>(KEYS.session, null);
      },

      logout() {
        localStorage.removeItem(KEYS.session);
      },

      async adminLogin(email): Promise<AdminLoginResult> {
        await wait(300);
        return { success: true, requiresTotp: true, enrolling: false, email };
      },

      async adminVerifyTotp(email, code): Promise<AdminTotpResult> {
        await wait(300);
        if (code !== "123456") return { success: true, verified: false };
        const user: BackendUser = {
          id: "usr-admin-mock",
          email,
          fullName: "Ayopá Compliance Team",
          phone: null,
          role: "admin",
          isActive: true,
          isVerified: true,
          isProvisional: false,
          createdAt: new Date().toISOString(),
        };
        write(KEYS.session, user);
        return { success: true, verified: true, accessToken: "mock-admin-token", refreshToken: "mock-admin-refresh", user };
      },
    },

    listings: {
      async list(filters): Promise<ListingsPage> {
        await wait();
        let items = loadListings().filter((l) => l.status !== "deleted");
        if (filters.search) {
          const q = filters.search.toLowerCase();
          items = items.filter((l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
        }
        if (filters.category) items = items.filter((l) => l.category === filters.category);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const start = (page - 1) * limit;
        const paged = items.slice(start, start + limit);
        return { items: paged, meta: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) } };
      },

      async getById(id): Promise<Listing | null> {
        await wait(200);
        return loadListings().find((l) => l.id === id) ?? null;
      },

      async create(input: ListingInput): Promise<Listing> {
        await wait(300);
        const user = read<BackendUser | null>(KEYS.session, null);
        if (!user) throw new ApiError("Not authenticated.", 401);
        const listing: Listing = {
          id: `lst-${Date.now()}`,
          sellerId: user.id,
          seller: user,
          title: input.title,
          description: input.description,
          category: input.category,
          price: input.price,
          currency: input.currency ?? "NGN",
          location: input.location ?? null,
          status: "published",
          isFeatured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const all = loadListings();
        all.unshift(listing);
        saveListings(all);
        return listing;
      },

      async update(id, input: ListingUpdateInput): Promise<Listing> {
        await wait(250);
        const all = loadListings();
        const idx = all.findIndex((l) => l.id === id);
        if (idx === -1) throw new ApiError("Listing not found", 404);
        all[idx] = { ...all[idx], ...input, updatedAt: new Date().toISOString() };
        saveListings(all);
        return all[idx];
      },

      async remove(id): Promise<void> {
        await wait(200);
        const all = loadListings();
        const idx = all.findIndex((l) => l.id === id);
        if (idx === -1) throw new ApiError("Listing not found", 404);
        all[idx] = { ...all[idx], status: "deleted", updatedAt: new Date().toISOString() };
        saveListings(all);
      },

      async deleted(page = 1, limit = 20): Promise<ListingsPage> {
        await wait();
        const items = loadListings().filter((l) => l.status === "deleted");
        const start = (page - 1) * limit;
        const paged = items.slice(start, start + limit);
        return { items: paged, meta: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) } };
      },
    },

    transactions: {
      async create(listingId, amount): Promise<Transaction> {
        await wait(300);
        const listing = MOCK_LISTINGS.find((l) => l.id === listingId);
        if (!listing) throw new ApiError("Listing not found", 404);
        const user = read<BackendUser | null>(KEYS.session, null);
        if (!user) throw new ApiError("Not authenticated.", 401);
        const tx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          buyerId: user.id,
          sellerId: listing.sellerId,
          listingId: listing.id,
          buyer: user,
          seller: listing.seller,
          listing,
          amount,
          currency: "NGN",
          status: "CREATED",
          commissionAmount: Math.round(amount * 0.05),
          firstReleaseAmount: 0,
          escrowReleased: false,
          autoReleaseAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const all = read<Transaction[]>(KEYS.transactions, []);
        all.unshift(tx);
        write(KEYS.transactions, all);
        return tx;
      },

      async list(): Promise<Transaction[]> {
        await wait(250);
        return read<Transaction[]>(KEYS.transactions, []);
      },
    },

    escrow: {
      async transition(transactionId, status: EscrowStatus): Promise<Transaction> {
        await wait();
        const all = read<Transaction[]>(KEYS.transactions, []);
        const tx = all.find((t) => t.id === transactionId);
        if (!tx) throw new ApiError("Transaction not found", 404);
        tx.status = status;
        tx.escrowReleased = status === "COMPLETED" || status === "REFUNDED";
        write(KEYS.transactions, all);
        return tx;
      },
    },

    paystack: {
      async initialize(input): Promise<PaystackInitResult> {
        await wait(300);
        const reference = `mock_ref_${Date.now()}`;
        write(`ayopa_mock_paystack_${reference}`, { transactionId: input.transactionId, amount: input.amount });
        return {
          status: true,
          message: "Authorization URL created",
          data: {
            authorization_url: `${window.location.origin}${window.location.pathname}?mock_paystack=1&reference=${reference}`,
            access_code: "mock_access_code",
            reference,
          },
        };
      },

      async verify(reference): Promise<PaystackVerifyResult> {
        await wait(400);
        const stored = read<{ transactionId: string; amount: number } | null>(`ayopa_mock_paystack_${reference}`, null);
        if (stored) {
          const all = read<Transaction[]>(KEYS.transactions, []);
          const tx = all.find((t) => t.id === stored.transactionId);
          if (tx) {
            tx.status = "PAYMENT_HELD";
            write(KEYS.transactions, all);
          }
        }
        return {
          status: true,
          message: "Verification successful",
          data: { status: "success", reference, amount: stored?.amount ?? 0, metadata: { transactionId: stored?.transactionId } },
        };
      },
    },

    disputes: {
      async create(transactionId, reason): Promise<Dispute> {
        await wait();
        const dispute: Dispute = { id: `dsp-${Date.now()}`, transactionId, reason, status: "OPEN", createdAt: new Date().toISOString() };
        const all = read<Dispute[]>(KEYS.disputes, []);
        all.push(dispute);
        write(KEYS.disputes, all);
        const txs = read<Transaction[]>(KEYS.transactions, []);
        const tx = txs.find((t) => t.id === transactionId);
        if (tx) {
          tx.status = "DISPUTED";
          write(KEYS.transactions, txs);
        }
        return dispute;
      },

      async list(): Promise<Dispute[]> {
        await wait(200);
        return read<Dispute[]>(KEYS.disputes, []);
      },

      async sellerRespond(id, response): Promise<Dispute> {
        await wait(250);
        const all = read<Dispute[]>(KEYS.disputes, []);
        const dispute = all.find((d) => d.id === id);
        if (!dispute) throw new ApiError("Dispute not found", 404);
        (dispute as any).sellerResponse = response;
        write(KEYS.disputes, all);
        return dispute;
      },
    },

    kyc: {
      async submit(input: KycSubmitInput): Promise<KycSubmitResult> {
        await wait(300);
        const user = read<BackendUser | null>(KEYS.session, null);
        if (!user) throw new ApiError("Not authenticated.", 401);
        const record = { id: `kyc-${user.id}`, status: "pending", documentType: input.documentType };
        write(`${KEYS.kyc}_${user.id}`, record);
        return { id: record.id, status: record.status };
      },
    },

    admin: {
      async listUsers(): Promise<BackendUser[]> {
        await wait(250);
        const session = read<BackendUser | null>(KEYS.session, null);
        return read<BackendUser[]>(KEYS.users, session ? [session] : []);
      },

      async updateUser(id, input): Promise<BackendUser> {
        await wait(250);
        const session = read<BackendUser | null>(KEYS.session, null);
        const all = read<BackendUser[]>(KEYS.users, session ? [session] : []);
        const idx = all.findIndex((u) => u.id === id);
        if (idx === -1) throw new ApiError("User not found", 404);
        all[idx] = { ...all[idx], ...input } as BackendUser;
        write(KEYS.users, all);
        return all[idx];
      },
    },

    payouts: {
      async list(status?: PayoutStatus): Promise<PayoutRequest[]> {
        await wait(250);
        const all = read<PayoutRequest[]>(KEYS.payouts, []);
        return status ? all.filter((p) => p.status === status) : all;
      },

      async approve(id, comment): Promise<PayoutRequest> {
        await wait(250);
        const all = read<PayoutRequest[]>(KEYS.payouts, []);
        const p = all.find((x) => x.id === id);
        if (!p) throw new ApiError("Payout not found", 404);
        p.status = "approved";
        write(KEYS.payouts, all);
        return p;
      },

      async reject(id, reason): Promise<PayoutRequest> {
        await wait(250);
        const all = read<PayoutRequest[]>(KEYS.payouts, []);
        const p = all.find((x) => x.id === id);
        if (!p) throw new ApiError("Payout not found", 404);
        p.status = "rejected";
        write(KEYS.payouts, all);
        return p;
      },
    },
  };
}
