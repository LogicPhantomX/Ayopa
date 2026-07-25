/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Loader2, LogOut, Users, Banknote, Archive, KeyRound } from "lucide-react";
import { getApiClient, ApiError } from "../../api/client";
import { useSession } from "../../hooks/useSession";
import { BackendUser, Listing } from "../../types/backend";
import { PayoutRequest, PayoutStatus } from "../../api/types";
import { formatNaira } from "../../lib/format";

export default function AdminPortal() {
  const api = getApiClient();
  const { user, isLoading, refresh, logout } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Staff accounts (admin / super_admin) authenticate through a completely
  // separate, higher-privilege endpoint (POST /admin/auth/login + TOTP) —
  // not the buyer/seller OTP flow. If the current session isn't staff,
  // show that login screen instead of the OTP gate.
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <AdminLoginScreen onSignedIn={() => refresh()} />;
  }

  return <AdminDashboard api={api} onLogout={logout} adminName={user.fullName ?? user.email ?? "Admin"} />;
}

function AdminLoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const api = getApiClient();
  const [step, setStep] = useState<"password" | "totp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [enrollUri, setEnrollUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.auth.adminLogin(email.trim(), password);
      if (result.enrolling && result.otpauthUrl) setEnrollUri(result.otpauthUrl);
      setStep("totp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid admin credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.auth.adminVerifyTotp(email.trim(), code.trim());
      if (!result.verified) {
        setError("That code didn't verify. Try again.");
        return;
      }
      onSignedIn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't verify that code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-5 bg-zinc-900 border border-zinc-800">
        <KeyRound className="w-6 h-6 text-[#D4A017]" />
      </div>
      <h2 className="font-serif font-bold text-xl text-white">Staff sign-in</h2>
      <p className="text-sm mt-2 text-zinc-500">
        Compliance and finance staff only. Two steps: your admin password, then a TOTP code.
      </p>

      {step === "password" ? (
        <form onSubmit={submitPassword} className="mt-6 space-y-3 text-left">
          <input required type="email" autoFocus placeholder="admin@ayopa.ng" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017]" />
          <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017]" />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-full font-semibold text-sm disabled:opacity-60" style={{ background: "#D4A017", color: "#080808" }}>
            {isSubmitting ? "Checking…" : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitTotp} className="mt-6 space-y-3 text-left">
          {enrollUri && (
            <p className="text-[12px] text-zinc-500 break-all">
              First sign-in: add this account to an authenticator app using this setup URI, then enter the 6-digit code it shows.
              <span className="block mt-1 text-zinc-400 font-mono">{enrollUri}</span>
            </p>
          )}
          <input required inputMode="numeric" maxLength={6} autoFocus placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm tracking-[0.3em] font-semibold text-white outline-none focus:border-[#D4A017]" />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-full font-semibold text-sm disabled:opacity-60" style={{ background: "#D4A017", color: "#080808" }}>
            {isSubmitting ? "Verifying…" : "Verify & sign in"}
          </button>
          <button type="button" onClick={() => setStep("password")} className="w-full text-[13px] py-1 text-zinc-500">
            Back
          </button>
        </form>
      )}
    </div>
  );
}

function AdminDashboard({ api, onLogout, adminName }: { api: ReturnType<typeof getApiClient>; onLogout: () => void; adminName: string }) {
  const [tab, setTab] = useState<"users" | "payouts" | "deleted">("users");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl text-white">Compliance Admin</h1>
          <p className="text-zinc-500 text-sm">Signed in as {adminName}.</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-zinc-900/60 hover:bg-rose-950/30 border border-zinc-800/80 rounded-lg text-zinc-400 hover:text-rose-400">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-850 p-1 rounded-xl mb-6 w-fit">
        {[
          { key: "users", label: "Users", icon: Users },
          { key: "payouts", label: "Payouts", icon: Banknote },
          { key: "deleted", label: "Deleted listings", icon: Archive },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === key ? "bg-[#D4A017] text-black" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersPanel api={api} />}
      {tab === "payouts" && <PayoutsPanel api={api} />}
      {tab === "deleted" && <DeletedListingsPanel api={api} />}
    </div>
  );
}

function UsersPanel({ api }: { api: ReturnType<typeof getApiClient> }) {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUsers(await api.admin.listUsers());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load users. This needs an 'admin' role account.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const toggleActive = async (u: BackendUser) => {
    setBusyId(u.id);
    try {
      await api.admin.updateUser(u.id, { isActive: !u.isActive });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't update that user.");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>;
  if (error) return <p className="text-rose-400 text-sm">{error}</p>;

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-white text-sm font-semibold">{u.fullName ?? u.email ?? u.phone ?? u.id}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{u.email ?? u.phone} · role: {u.role} · {u.isActive ? "active" : "deactivated"}</p>
          </div>
          <button
            disabled={busyId === u.id}
            onClick={() => toggleActive(u)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-60"
          >
            {u.isActive ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      ))}
    </div>
  );
}

function PayoutsPanel({ api }: { api: ReturnType<typeof getApiClient> }) {
  const [status, setStatus] = useState<PayoutStatus | "">("pending");
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setPayouts(await api.payouts.list(status || undefined));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load payouts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusyId(id);
    try {
      if (action === "approve") await api.payouts.approve(id);
      else await api.payouts.reject(id);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "That action failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <select value={status} onChange={(e) => setStatus(e.target.value as PayoutStatus | "")}
        className="mb-4 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white outline-none">
        <option value="">All statuses</option>
        {(["pending", "approved", "executing", "completed", "rejected", "failed"] as PayoutStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
      ) : error ? (
        <p className="text-rose-400 text-sm">{error}</p>
      ) : payouts.length === 0 ? (
        <p className="text-zinc-500 text-sm">No payout requests here.</p>
      ) : (
        <div className="space-y-2">
          {payouts.map((p) => (
            <div key={p.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-white text-sm font-semibold">{formatNaira(p.amount / 100)}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{p.reason} · {p.recipientCode} · status: {p.status}</p>
              </div>
              {p.status === "pending" && (
                <div className="flex gap-2">
                  <button disabled={busyId === p.id} onClick={() => act(p.id, "approve")} className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60" style={{ background: "#D4A017", color: "#080808" }}>
                    Approve
                  </button>
                  <button disabled={busyId === p.id} onClick={() => act(p.id, "reject")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-rose-400">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeletedListingsPanel({ api }: { api: ReturnType<typeof getApiClient> }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listings.deleted().then((page) => setListings(page.items)).catch((err) => {
      setError(err instanceof ApiError ? err.message : "Couldn't load deleted listings.");
    }).finally(() => setIsLoading(false));
  }, [api]);

  if (isLoading) return <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>;
  if (error) return <p className="text-rose-400 text-sm">{error}</p>;
  if (listings.length === 0) return <p className="text-zinc-500 text-sm">No soft-deleted listings.</p>;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {listings.map((l) => (
        <div key={l.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-white text-sm font-semibold">{l.title}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{l.category} · {formatNaira(l.price)}</p>
        </div>
      ))}
    </div>
  );
}
