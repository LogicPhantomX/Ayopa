/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { CartLine } from "../../lib/cartStore";
import { cartStore } from "../../lib/cartStore";
import { BackendUser } from "../../types/backend";
import { OtpVerifyResult } from "../../api/types";
import { getApiClient, ApiError } from "../../api/client";
import { formatNaira } from "../../lib/format";
import { startQueue } from "../../lib/paymentQueue";
import OtpAuthGate from "./OtpAuthGate";
import ProfileSetupGate from "./ProfileSetupGate";

interface CheckoutProps {
  user: BackendUser | null;
  activeLines: CartLine[];
  subtotal: number;
  onAuthenticated: (result: OtpVerifyResult) => void;
  onProfileComplete: (user: BackendUser) => void;
  onBack: () => void;
}

export default function Checkout({ user, activeLines, subtotal, onAuthenticated, onProfileComplete, onBack }: CheckoutProps) {
  const api = getApiClient();
  const [email, setEmail] = useState(user?.email ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <OtpAuthGate onVerified={onAuthenticated} />;
  if (user.isProvisional) return <ProfileSetupGate onComplete={onProfileComplete} />;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeLines.length === 0) return;
    setError(null);
    setIsSubmitting(true);
    try {
      // Backend has no cart/line-items — create one real Transaction per
      // listing, amount = quantity × price (see lib/cartStore.ts).
      const created: { transactionId: string; listingTitle: string; amount: number }[] = [];
      for (const line of activeLines) {
        setProgress(`Creating order ${created.length + 1} of ${activeLines.length}…`);
        const amount = line.quantity * line.listing.price;
        const tx = await api.transactions.create(line.listing.id, amount);
        created.push({ transactionId: tx.id, listingTitle: line.listing.title, amount });
      }

      // Orders exist server-side now — clear the cart lines we just used.
      cartStore.removeLines(activeLines.map((l) => l.id));

      const queue = startQueue(email.trim(), created);

      setProgress("Opening secure Paystack checkout…");
      const first = queue.pending[0];
      const callbackUrl = `${window.location.origin}${window.location.pathname}`;
      const init = await api.paystack.initialize({
        email: queue.email,
        amount: first.amount,
        transactionId: first.transactionId,
        callbackUrl,
      });
      window.location.href = init.data.authorization_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start checkout. Try again.");
      setProgress(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium py-2 pr-3 -ml-1 rounded-full hover:bg-[var(--color-surface-sunken)]"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to cart
      </button>

      <div className="mt-4 grid sm:grid-cols-[1fr_320px] gap-8">
        <div>
          <h2 className="font-display font-bold text-xl flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
            <ShieldCheck className="w-5 h-5" style={{ color: "var(--color-brand-500)" }} /> Pay into escrow
          </h2>
          <p className="text-[13px] mt-1" style={{ color: "var(--color-ink-muted)" }}>
            Each seller is paid through a separate escrow-protected Paystack transaction. Your money is only
            released once you confirm delivery.
          </p>

          <form onSubmit={handlePay} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>Email for payment receipt</span>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-ink-faint)" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] text-sm outline-none border focus:border-[var(--color-brand-500)]"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
                />
              </div>
              <span className="text-[11px] mt-1 block" style={{ color: "var(--color-ink-faint)" }}>
                Paystack requires an email per transaction — Ayopá accounts don't collect one during phone signup.
              </span>
            </label>

            {error && <p className="text-[13px]" style={{ color: "var(--color-caution-500)" }}>{error}</p>}
            {progress && <p className="text-[13px]" style={{ color: "var(--color-ink-muted)" }}>{progress}</p>}

            <button
              type="submit"
              disabled={isSubmitting || activeLines.length === 0}
              className="w-full sm:w-auto px-6 py-3 rounded-full font-semibold text-sm disabled:opacity-60"
              style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
            >
              {isSubmitting ? "Please wait…" : `Pay ${formatNaira(subtotal)} with Paystack`}
            </button>
          </form>
        </div>

        <aside className="rounded-[var(--radius-lg)] border p-5 h-fit" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ink)" }}>Order summary</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {activeLines.map((l) => (
              <div key={l.id} className="flex justify-between text-[13px]">
                <span className="truncate pr-2" style={{ color: "var(--color-ink-muted)" }}>{l.quantity}× {l.listing.title}</span>
                <span className="shrink-0 tabular-nums" style={{ color: "var(--color-ink)" }}>{formatNaira(l.quantity * l.listing.price)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-3 mt-3 border-t" style={{ borderColor: "var(--color-line)" }}>
            <span className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>Total</span>
            <span className="font-display font-bold text-base" style={{ color: "var(--color-ink)" }}>{formatNaira(subtotal)}</span>
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--color-ink-faint)" }}>
            Platform commission (5%) is deducted from the seller's payout, not added on top of this total.
          </p>
        </aside>
      </div>
    </div>
  );
}
