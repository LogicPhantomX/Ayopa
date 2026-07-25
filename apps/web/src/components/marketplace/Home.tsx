/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PackageCheck, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getApiClient } from "../../api/client";
import { Listing } from "../../types/backend";
import CategoryRail from "./CategoryRail";
import ListingCard from "./ListingCard";

interface HomeProps {
  query: string;
  onSelectListing: (listing: Listing) => void;
}

// Every point here maps to something the backend actually enforces —
// see NEXT_TASK.md's "final checklist" in the backend repo.
const TRUST_POINTS = [
  { icon: ShieldCheck, label: "Phone-verified accounts", detail: "Every account is confirmed by OTP before it can transact." },
  { icon: Wallet, label: "Escrow-protected payments", detail: "Paystack payments are held until you confirm delivery." },
  { icon: PackageCheck, label: "You control the release", detail: "Funds only move to the seller after you confirm receipt." },
];

export default function Home({ query, onSelectListing }: HomeProps) {
  const api = useMemo(() => getApiClient(), []);

  const [category, setCategory] = useState<string | "All">("All");
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    api.listings
      .list({ search: query || undefined, category: category === "All" ? undefined : category, page: 1, limit: 24 })
      .then((result) => {
        if (cancelled) return;
        setListings(result.items);
        setTotal(result.meta.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? "Couldn't load listings. Is the backend running?");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, query, category]);

  const heading = useMemo(() => {
    if (query) return `Results for "${query}"`;
    if (category !== "All") return category;
    return "Recommended for you";
  }, [query, category]);

  return (
    <div>
      {!query && category === "All" && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-16 sm:pb-12">
          <h1
            className="font-display font-extrabold tracking-tight text-[32px] sm:text-[44px] leading-[1.08] max-w-2xl"
            style={{ color: "var(--color-ink)" }}
          >
            Buy livestock from verified sellers, with your money held safe until delivery.
          </h1>
          <p className="mt-4 text-[15px] sm:text-base max-w-lg" style={{ color: "var(--color-ink-muted)" }}>
            Cows, goats, rams, chickens and more — browse freely, no account needed until you're ready to pay.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            {TRUST_POINTS.map(({ icon: Icon, label, detail }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] border"
                style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }}
              >
                <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "var(--color-brand-500)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>{label}</p>
                  <p className="text-[13px] mt-0.5" style={{ color: "var(--color-ink-muted)" }}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CategoryRail active={category} onSelect={setCategory} />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--color-ink)" }}>
            {heading}
          </h2>
          {!isLoading && !error && <span className="text-sm" style={{ color: "var(--color-ink-faint)" }}>{total} listing{total === 1 ? "" : "s"}</span>}
        </div>

        {error ? (
          <div className="text-center py-20">
            <p className="font-display font-semibold text-lg" style={{ color: "var(--color-ink)" }}>Couldn't reach the backend</p>
            <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: "var(--color-ink-muted)" }}>{error}</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius-lg)] overflow-hidden border animate-pulse" style={{ borderColor: "var(--color-line)" }}>
                <div className="aspect-[4/3]" style={{ background: "var(--color-surface-sunken)" }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded" style={{ background: "var(--color-surface-sunken)" }} />
                  <div className="h-3 w-2/3 rounded" style={{ background: "var(--color-surface-sunken)" }} />
                  <div className="h-5 w-1/2 rounded" style={{ background: "var(--color-surface-sunken)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display font-semibold text-lg" style={{ color: "var(--color-ink)" }}>Nothing matches yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>Try a different search term or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onSelect={onSelectListing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
