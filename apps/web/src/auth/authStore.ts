/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, UserRole } from "../types";

// NOTE: This is a client-only mock auth layer for the prototype (no backend yet).
// Passwords are stored in localStorage for demo purposes only — this must be
// replaced with a real backend (hashed passwords, sessions/JWT) before production.

interface StoredAccount extends AuthUser {
  password: string;
}

const ACCOUNTS_KEY = "ayopa_accounts";
const SESSION_KEY = "ayopa_session_user_id";

const SEED_ACCOUNTS: StoredAccount[] = [
  {
    id: "usr-buyer-demo",
    fullName: "Amaka Obi",
    email: "buyer@demo.ayopa",
    password: "demo1234",
    role: "buyer",
    companyName: "Obi Foods Trading Co.",
    country: "Nigeria",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-seller-demo",
    fullName: "Kwame Mensah",
    email: "seller@demo.ayopa",
    password: "demo1234",
    role: "seller",
    companyName: "West-African Grain Alliance",
    country: "Ghana",
    createdAt: new Date().toISOString(),
  },
  {
    id: "usr-admin-demo",
    fullName: "Ayopá Compliance Team",
    email: "admin@demo.ayopa",
    password: "demo1234",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
];

function loadAccounts(): StoredAccount[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
    return SEED_ACCOUNTS;
  }
  try {
    return JSON.parse(raw) as StoredAccount[];
  } catch {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(SEED_ACCOUNTS));
    return SEED_ACCOUNTS;
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function toPublicUser(account: StoredAccount): AuthUser {
  const { password: _password, ...publicUser } = account;
  return publicUser;
}

export function getSessionUser(): AuthUser | null {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const account = loadAccounts().find((a) => a.id === id);
  return account ? toPublicUser(account) : null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function login({ email, password }: LoginInput): AuthUser {
  const accounts = loadAccounts();
  const account = accounts.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!account || account.password !== password) {
    throw new Error("Invalid email or password.");
  }
  localStorage.setItem(SESSION_KEY, account.id);
  return toPublicUser(account);
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  companyName?: string;
  country?: string;
}

export function register(input: RegisterInput): AuthUser {
  const accounts = loadAccounts();
  const email = input.email.trim().toLowerCase();

  if (!input.fullName.trim()) throw new Error("Full name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    throw new Error("An account with this email already exists.");
  }

  const newAccount: StoredAccount = {
    id: `usr-${Date.now()}`,
    fullName: input.fullName.trim(),
    email,
    password: input.password,
    role: input.role,
    companyName: input.companyName?.trim() || undefined,
    country: input.country?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  saveAccounts([...accounts, newAccount]);
  localStorage.setItem(SESSION_KEY, newAccount.id);
  return toPublicUser(newAccount);
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export const DEMO_CREDENTIALS: Record<UserRole, LoginInput> = {
  buyer: { email: "buyer@demo.ayopa", password: "demo1234" },
  seller: { email: "seller@demo.ayopa", password: "demo1234" },
  admin: { email: "admin@demo.ayopa", password: "demo1234" },
};
