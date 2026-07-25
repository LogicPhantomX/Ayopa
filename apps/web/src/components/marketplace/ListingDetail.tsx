/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowLeft, MapPin, ShieldCheck, ShieldQuestion, Calendar } from "lucide-react";
import { Listing } from "../../types/backend";
import { formatNaira } from "../../lib/format";
import { gradientForListing } from "../../lib/categoryVisuals";
import QuantityStepper from "./QuantityStepper";

interface ListingDetailProps {
  listing: Listing;
  onBack: () => void;
  onAddToCart: (listing: Listing, quantity: number) => void;
  onGoToCart: () => void;
}

export default function ListingDetail({ listing, onBack, onAddToCart, onGoToCart }: ListingDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(listing, quantity);
    setAdded(true);
  };

  const total = quantity * listing.price;
  const joinedDate = listing.seller?.createdAt
    ? new Date(listing.seller.createdAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <div className="px-4 sm:px-6 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium py-2 pr-3 -ml-1 rounded-full hover:bg-[var(--color-surface-sunken)]"
          style={{ color: "var(--color-ink-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to browsing
        </button>
      </div>

      <div className="px-4 sm:px-6 mt-2 grid sm:grid-cols-2 gap-6 sm:gap-10">
        <div className={`aspect-square rounded-[var(--radius-lg)] bg-gradient-to-br ${gradientForListing(listing.id)} flex items-end p-4`}>
          <span className="text-[13px] font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(28,26,22,0.5)", color: "#FFFDF8" }}>
            {listing.category} · photo not provided by seller
          </span>
        </div>

        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-brand-600)" }}>{listing.category}</p>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-1 leading-tight" style={{ color: "var(--color-ink)" }}>
            {listing.title}
          </h1>

          {listing.location && (
            <div className="flex items-center gap-1.5 mt-2 text-sm" style={{ color: "var(--color-ink-muted)" }}>
              <MapPin className="w-4 h-4" /> {listing.location}
            </div>
          )}

          <div
            className="mt-4 flex items-center justify-between p-4 rounded-[var(--radius-md)] border"
            style={{ borderColor: "var(--color-line)" }}
          >
            <div className="flex items-center gap-3">
              {listing.seller?.isVerified ? (
                <ShieldCheck className="w-8 h-8 shrink-0" style={{ color: "var(--color-trust-500)" }} />
              ) : (
                <ShieldQuestion className="w-8 h-8 shrink-0" style={{ color: "var(--color-ink-faint)" }} />
              )}
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                  {listing.seller?.fullName ?? "Ayopá seller"}
                </p>
                <p className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                  {listing.seller?.isVerified ? "Phone verified" : "Phone not yet verified"}
                </p>
              </div>
            </div>
            {joinedDate && (
              <div className="text-right shrink-0 flex items-center gap-1 text-[12px]" style={{ color: "var(--color-ink-faint)" }}>
                <Calendar className="w-3.5 h-3.5" /> Joined {joinedDate}
              </div>
            )}
          </div>

          <p className="mt-5 text-[14px] leading-relaxed whitespace-pre-line" style={{ color: "var(--color-ink-muted)" }}>
            {listing.description}
          </p>

          <div className="mt-6 p-4 rounded-[var(--radius-md)] border" style={{ borderColor: "var(--color-line)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-xl" style={{ color: "var(--color-ink)" }}>
                  {formatNaira(listing.price)}
                </p>
                <p className="text-[12px]" style={{ color: "var(--color-ink-faint)" }}>per unit</p>
              </div>
              <QuantityStepper quantity={quantity} min={1} max={99} onChange={setQuantity} />
            </div>
            <p className="text-[11px] mt-2" style={{ color: "var(--color-ink-faint)" }}>
              Quantity multiplies the price into a single order with this seller — Ayopá doesn't track live stock per listing yet, so confirm availability with the seller before paying.
            </p>
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 sm:px-6 py-3.5"
        style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sheet)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px]" style={{ color: "var(--color-ink-faint)" }}>Total</p>
            <p className="font-display font-bold text-lg truncate" style={{ color: "var(--color-ink)" }}>{formatNaira(total)}</p>
          </div>
          {added ? (
            <button
              type="button"
              onClick={onGoToCart}
              className="px-6 py-3 rounded-full font-semibold text-sm"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              View cart
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="px-6 py-3 rounded-full font-semibold text-sm transition-transform active:scale-[0.98]"
              style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
