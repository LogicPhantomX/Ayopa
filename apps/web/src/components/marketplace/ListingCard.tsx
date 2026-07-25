/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { MapPin, ShieldCheck } from "lucide-react";
import { Listing } from "../../types/backend";
import { formatNaira } from "../../lib/format";
import { gradientForListing } from "../../lib/categoryVisuals";

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
}

export default function ListingCard({ listing, onSelect }: ListingCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(listing)}
      className="group text-left w-full rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-surface)] border transition-shadow duration-200 hover:shadow-[var(--shadow-lifted)] focus-visible:shadow-[var(--shadow-lifted)]"
      style={{ borderColor: "var(--color-line)", boxShadow: "var(--shadow-soft)" }}
    >
      <div className={`relative aspect-[4/3] bg-gradient-to-br ${gradientForListing(listing.id)}`}>
        {listing.isFeatured && (
          <span
            className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "var(--color-surface)", color: "var(--color-brand-600)" }}
          >
            Featured
          </span>
        )}
        <span
          className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: "rgba(28,26,22,0.5)", color: "#FFFDF8" }}
        >
          {listing.category}
        </span>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold leading-snug line-clamp-2" style={{ color: "var(--color-ink)" }}>
          {listing.title}
        </h3>

        {listing.location && (
          <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--color-ink-muted)" }}>
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{listing.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--color-ink-muted)" }}>
          {listing.seller?.isVerified && (
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-trust-500)" }} />
          )}
          <span className="truncate">{listing.seller?.fullName ?? "Ayopá seller"}</span>
        </div>

        <div className="pt-1">
          <span className="font-display font-bold text-lg" style={{ color: "var(--color-ink)" }}>
            {formatNaira(listing.price)}
          </span>
        </div>
      </div>
    </button>
  );
}
