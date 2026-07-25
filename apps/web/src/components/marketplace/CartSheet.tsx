/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Trash2, Heart, ShoppingBag } from "lucide-react";
import { CartLine } from "../../lib/cartStore";
import { formatNaira } from "../../lib/format";
import { gradientForListing } from "../../lib/categoryVisuals";
import QuantityStepper from "./QuantityStepper";

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeLines: CartLine[];
  savedLines: CartLine[];
  subtotal: number;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
  onSaveForLater: (lineId: string) => void;
  onMoveToCart: (lineId: string) => void;
  onCheckout: () => void;
}

function LineItem({
  line,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  onMoveToCart,
}: {
  line: CartLine;
  onUpdateQuantity: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  onSaveForLater?: (id: string) => void;
  onMoveToCart?: (id: string) => void;
}) {
  const { listing } = line;
  return (
    <div className="flex gap-3 py-4">
      <div className={`w-16 h-16 rounded-[var(--radius-sm)] bg-gradient-to-br ${gradientForListing(listing.id)} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--color-ink)" }}>{listing.title}</p>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--color-ink-faint)" }}>{formatNaira(listing.price)} each</p>

        <div className="flex items-center justify-between mt-2.5 gap-2">
          {line.savedForLater ? (
            <button
              type="button"
              onClick={() => onMoveToCart?.(line.id)}
              className="text-[12px] font-medium underline underline-offset-2"
              style={{ color: "var(--color-brand-600)" }}
            >
              Move to cart
            </button>
          ) : (
            <QuantityStepper size="sm" quantity={line.quantity} min={1} max={99} onChange={(q) => onUpdateQuantity(line.id, q)} />
          )}
          <div className="flex items-center gap-1">
            {!line.savedForLater && onSaveForLater && (
              <button
                type="button"
                onClick={() => onSaveForLater(line.id)}
                aria-label="Save for later"
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-sunken)]"
              >
                <Heart className="w-4 h-4" style={{ color: "var(--color-ink-faint)" }} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(line.id)}
              aria-label="Remove from cart"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-sunken)]"
            >
              <Trash2 className="w-4 h-4" style={{ color: "var(--color-ink-faint)" }} />
            </button>
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold shrink-0 tabular-nums" style={{ color: "var(--color-ink)" }}>
        {line.savedForLater ? "" : formatNaira(line.quantity * listing.price)}
      </p>
    </div>
  );
}

export default function CartSheet({
  isOpen,
  onClose,
  activeLines,
  savedLines,
  subtotal,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  onMoveToCart,
  onCheckout,
}: CartSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Close cart" onClick={onClose} className="absolute inset-0" style={{ background: "rgba(28,26,22,0.35)" }} />
      <div
        role="dialog"
        aria-label="Your cart"
        className="relative w-full sm:max-w-md h-full flex flex-col animate-[slideIn_0.25s_ease-out]"
        style={{ background: "var(--color-paper)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-line)" }}>
          <h2 className="font-display font-bold text-lg" style={{ color: "var(--color-ink)" }}>Your cart</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-sunken)]">
            <X className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {activeLines.length === 0 && savedLines.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-ink-faint)" }} />
              <p className="font-medium" style={{ color: "var(--color-ink)" }}>Your cart is empty</p>
              <p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>Browse listings to add something.</p>
            </div>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: "var(--color-line)" }}>
                {activeLines.map((line) => (
                  <LineItem key={line.id} line={line} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} onSaveForLater={onSaveForLater} />
                ))}
              </div>

              {savedLines.length > 0 && (
                <div className="mt-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-ink-faint)" }}>
                    Saved for later ({savedLines.length})
                  </p>
                  <div className="divide-y" style={{ borderColor: "var(--color-line)" }}>
                    {savedLines.map((line) => (
                      <LineItem key={line.id} line={line} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} onMoveToCart={onMoveToCart} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {activeLines.length > 0 && (
          <div className="px-5 py-4 border-t" style={{ borderColor: "var(--color-line)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm" style={{ color: "var(--color-ink-muted)" }}>Subtotal</span>
              <span className="font-display font-bold text-lg" style={{ color: "var(--color-ink)" }}>{formatNaira(subtotal)}</span>
            </div>
            <button
              type="button"
              onClick={onCheckout}
              className="w-full py-3.5 rounded-full font-semibold text-sm transition-transform active:scale-[0.98]"
              style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
            >
              Checkout
            </button>
            {activeLines.length > 1 && (
              <p className="text-center text-[11px] mt-2" style={{ color: "var(--color-ink-faint)" }}>
                {activeLines.length} sellers to pay — you'll confirm each Paystack payment in turn
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
