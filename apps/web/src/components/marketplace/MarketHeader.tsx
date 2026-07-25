/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search, ShoppingBag, Receipt } from "lucide-react";
import { BackendUser } from "../../types/backend";

interface MarketHeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
  itemCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  user: BackendUser | null;
}

export default function MarketHeader({ query, onQueryChange, itemCount, onOpenCart, onOpenOrders, user }: MarketHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--color-paper) 88%, transparent)", borderBottom: "1px solid var(--color-line)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 sm:gap-6">
        <span className="font-display font-extrabold text-xl tracking-tight shrink-0" style={{ color: "var(--color-ink)" }}>
          Ayopá
        </span>

        <div className="flex-1 relative max-w-xl">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--color-ink-faint)" }}
          />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            type="search"
            placeholder="Search cows, goats, rams, chickens…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none border transition-colors focus:border-[var(--color-brand-500)]"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user && !user.isProvisional && (
            <span className="hidden sm:inline text-sm" style={{ color: "var(--color-ink-muted)" }}>
              Hi, {(user.fullName ?? "there").split(" ")[0]}
            </span>
          )}
          {user && !user.isProvisional && (
            <button
              type="button"
              onClick={onOpenOrders}
              aria-label="Your orders"
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-sunken)]"
            >
              <Receipt className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className="relative w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-sunken)]"
          >
            <ShoppingBag className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
            {itemCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
              >
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
