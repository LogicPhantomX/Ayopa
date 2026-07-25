/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, Package, ShieldCheck, Receipt, MessageSquareWarning, LogOut } from "lucide-react";
import { getApiClient, ApiError } from "../../api/client";
import { useSession } from "../../hooks/useSession";
import { Listing, Dispute, Transaction, EscrowStatus, SUGGESTED_CATEGORIES } from "../../types/backend";
import { formatNaira } from "../../lib/format";
import OtpAuthGate from "../marketplace/OtpAuthGate";
import ProfileSetupGate from "../marketplace/ProfileSetupGate";

const ESCROW_STATUSES: EscrowStatus[] = [
  "CREATED", "PAYMENT_HELD", "FIRST_RELEASED", "DELIVERY_CONFIRMED",
  "COMPLETED", "DISPUTED", "DISPUTE_RESOLVED", "REFUNDED",
];

interface ListingFormState {
  title: string;
  description: string;
  category: string;
  price: string;
  location: string;
}
const emptyForm: ListingFormState = { title: "", description: "", category: SUGGESTED_CATEGORIES[0], price: "", location: "" };

export default function SellerPortal() {
  const api = getApiClient();
  const { user, isLoading, refresh, logout } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!user) return <OtpAuthGate onVerified={() => refresh()} />;
  if (user.isProvisional) return <ProfileSetupGate onComplete={() => refresh()} />;

  if (user.role !== "seller") {
    return (
      <div className="max-w-sm mx-auto px-6 py-20 text-center">
        <p className="text-zinc-200 font-semibold">This account is signed in as a {user.role}.</p>
        <p className="text-zinc-500 text-sm mt-2">
          Selling on Ayopá needs a seller account. Sign out and verify a phone number with "Sell livestock" selected to set one up.
        </p>
        <button
          onClick={logout}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    );
  }

  return <SellerDashboard sellerId={user.id} api={api} onLogout={logout} />;
}

function SellerDashboard({ sellerId, api, onLogout }: { sellerId: string; api: ReturnType<typeof getApiClient>; onLogout: () => void }) {
  const [tab, setTab] = useState<"listings" | "sales" | "kyc" | "disputes">("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listingsPage, txs, dsp] = await Promise.all([
        api.listings.list({ limit: 100 }),
        api.transactions.list().catch(() => [] as Transaction[]),
        api.disputes.list().catch(() => [] as Dispute[]),
      ]);
      setListings(listingsPage.items.filter((l) => l.sellerId === sellerId));
      setSales(txs.filter((t) => t.sellerId === sellerId));
      setDisputes(dsp);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your seller data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl text-white">Seller Office</h1>
          <p className="text-zinc-500 text-sm">Manage your listings, sales, and verification.</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-zinc-900/60 hover:bg-rose-950/30 border border-zinc-800/80 rounded-lg text-zinc-400 hover:text-rose-400">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-850 p-1 rounded-xl mb-6 w-fit">
        {[
          { key: "listings", label: "Listings", icon: Package },
          { key: "sales", label: "Sales", icon: Receipt },
          { key: "kyc", label: "Verification", icon: ShieldCheck },
          { key: "disputes", label: "Disputes", icon: MessageSquareWarning },
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

      {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
      ) : (
        <>
          {tab === "listings" && <ListingsTab api={api} listings={listings} onChanged={loadAll} />}
          {tab === "sales" && <SalesTab api={api} sales={sales} onChanged={loadAll} />}
          {tab === "kyc" && <KycTab api={api} />}
          {tab === "disputes" && <DisputesTab api={api} disputes={disputes} onChanged={loadAll} />}
        </>
      )}
    </div>
  );
}

function ListingsTab({ api, listings, onChanged }: { api: ReturnType<typeof getApiClient>; listings: Listing[]; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [form, setForm] = useState<ListingFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };
  const openEdit = (l: Listing) => {
    setEditing(l);
    setForm({ title: l.title, description: l.description, category: l.category, price: String(l.price), location: l.location ?? "" });
    setError(null);
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { title: form.title, description: form.description, category: form.category, price: Number(form.price), location: form.location || undefined };
      if (editing) await api.listings.update(editing.id, payload);
      else await api.listings.create(payload);
      setShowForm(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this listing?")) return;
    try {
      await api.listings.remove(id);
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Couldn't remove that listing.");
    }
  };

  return (
    <div>
      <button
        onClick={openCreate}
        className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
        style={{ background: "#D4A017", color: "#080808" }}
      >
        <Plus className="w-4 h-4" /> New listing
      </button>

      {showForm && (
        <form onSubmit={submit} className="mb-6 bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017]" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017] min-h-[80px]" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none">
              {SUGGESTED_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input required type="number" min={0} placeholder="Price (₦)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017]" />
          </div>
          <input placeholder="Location (optional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017]" />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-60" style={{ background: "#D4A017", color: "#080808" }}>
              {isSubmitting ? "Saving…" : editing ? "Save changes" : "Publish listing"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-full text-sm font-semibold text-zinc-400 hover:text-white">
              Cancel
            </button>
          </div>
        </form>
      )}

      {listings.length === 0 ? (
        <p className="text-zinc-500 text-sm">You haven't listed anything yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white text-sm">{l.title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{l.category} · {l.status}</p>
                  <p className="text-[#D4A017] font-semibold text-sm mt-1.5">{formatNaira(l.price)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(l.id)} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SalesTab({ api, sales, onChanged }: { api: ReturnType<typeof getApiClient>; sales: Transaction[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transition = async (id: string, status: EscrowStatus) => {
    setBusyId(id);
    setError(null);
    try {
      await api.escrow.transition(id, status);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That transition wasn't allowed.");
    } finally {
      setBusyId(null);
    }
  };

  if (sales.length === 0) return <p className="text-zinc-500 text-sm">No sales yet.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-rose-400 text-xs">{error}</p>}
      {sales.map((t) => (
        <div key={t.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-white text-sm">{t.listing?.title ?? t.listingId}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{formatNaira(t.amount)} · status: {t.status}</p>
          </div>
          <select
            disabled={busyId === t.id}
            defaultValue=""
            onChange={(e) => e.target.value && transition(t.id, e.target.value as EscrowStatus)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white outline-none"
          >
            <option value="" disabled>Move to…</option>
            {ESCROW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function KycTab({ api }: { api: ReturnType<typeof getApiClient> }) {
  const [documentType, setDocumentType] = useState("NIN");
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.kyc.submit({ documentType, nin: nin || undefined, bvn: bvn || undefined });
      setResult(res.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit your KYC documents.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md">
      <p className="text-zinc-400 text-sm mb-4">
        Listings require approved KYC. Submit your documents below — a verification agent reviews them; there's
        currently no self-service status page, so check back with your account manager.
      </p>
      {result ? (
        <p className="text-[#D4A017] text-sm font-semibold">Submitted — status: {result}.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none">
            <option value="NIN">National ID (NIN)</option>
            <option value="BVN">Bank Verification Number (BVN)</option>
            <option value="CAC">Business registration (CAC)</option>
          </select>
          <input placeholder="NIN (optional)" value={nin} onChange={(e) => setNin(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017]" />
          <input placeholder="BVN (optional)" value={bvn} onChange={(e) => setBvn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white outline-none focus:border-[#D4A017]" />
          {error && <p className="text-rose-400 text-xs">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-60" style={{ background: "#D4A017", color: "#080808" }}>
            {isSubmitting ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      )}
    </div>
  );
}

function DisputesTab({ api, disputes, onChanged }: { api: ReturnType<typeof getApiClient>; disputes: Dispute[]; onChanged: () => void }) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const respond = async (id: string) => {
    const response = (responses[id] ?? "").trim();
    if (!response) return;
    setBusyId(id);
    setError(null);
    try {
      await api.disputes.sellerRespond(id, response);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send your response.");
    } finally {
      setBusyId(null);
    }
  };

  if (disputes.length === 0) return <p className="text-zinc-500 text-sm">No disputes on your sales.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-rose-400 text-xs">{error}</p>}
      {disputes.map((d) => (
        <div key={d.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
          <p className="text-white text-sm font-semibold">{d.reason}</p>
          <p className="text-zinc-500 text-xs mt-0.5">status: {d.status}</p>
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Your response…"
              value={responses[d.id] ?? ""}
              onChange={(e) => setResponses({ ...responses, [d.id]: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-[#D4A017]"
            />
            <button
              disabled={busyId === d.id}
              onClick={() => respond(d.id)}
              className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
              style={{ background: "#D4A017", color: "#080808" }}
            >
              Send
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
