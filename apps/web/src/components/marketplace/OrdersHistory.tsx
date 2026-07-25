/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { ArrowLeft, PackageCheck, AlertTriangle, Loader2 } from "lucide-react";
import { getApiClient, ApiError } from "../../api/client";
import { EscrowStatus, Transaction } from "../../types/backend";
import { formatNaira } from "../../lib/format";

interface OrdersHistoryProps {
  currentUserId: string;
  onBack: () => void;
}

const STATUS_COPY: Record<EscrowStatus, { label: string; tone: "neutral" | "held" | "good" | "warn" }> = {
  CREATED: { label: "Awaiting payment", tone: "neutral" },
  PAYMENT_HELD: { label: "Payment held in escrow", tone: "held" },
  FIRST_RELEASED: { label: "In transit — first release sent", tone: "held" },
  DELIVERY_CONFIRMED: { label: "Delivery confirmed", tone: "good" },
  COMPLETED: { label: "Completed", tone: "good" },
  DISPUTED: { label: "Disputed", tone: "warn" },
  DISPUTE_RESOLVED: { label: "Dispute resolved", tone: "held" },
  REFUNDED: { label: "Refunded", tone: "warn" },
};

const TONE_STYLES: Record<string, React.CSSProperties> = {
  neutral: { background: "var(--color-surface-sunken)", color: "var(--color-ink-muted)" },
  held: { background: "var(--color-brand-50)", color: "var(--color-brand-700)" },
  good: { background: "var(--color-trust-100)", color: "var(--color-trust-600)" },
  warn: { background: "var(--color-caution-100)", color: "var(--color-caution-600)" },
};

export default function OrdersHistory({ currentUserId, onBack }: OrdersHistoryProps) {
  const api = getApiClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [disputeTarget, setDisputeTarget] = useState<Transaction | null>(null);

  const load = () => {
    setIsLoading(true);
    api.transactions
      .list()
      .then(setTransactions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your orders."))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const confirmDelivery = async (tx: Transaction) => {
    setBusyId(tx.id);
    try {
      await api.escrow.transition(tx.id, "DELIVERY_CONFIRMED");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't confirm delivery.");
    } finally {
      setBusyId(null);
    }
  };

  const submitDispute = async (reason: string) => {
    if (!disputeTarget) return;
    setBusyId(disputeTarget.id);
    try {
      await api.disputes.create(disputeTarget.id, reason);
      setDisputeTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't raise a dispute.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium py-2 pr-3 -ml-1 rounded-full hover:bg-[var(--color-surface-sunken)]"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="font-display font-bold text-xl mt-3" style={{ color: "var(--color-ink)" }}>Your orders</h1>

      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: "var(--color-brand-500)" }} />
        </div>
      ) : error ? (
        <p className="text-sm mt-4" style={{ color: "var(--color-caution-500)" }}>{error}</p>
      ) : transactions.length === 0 ? (
        <p className="text-sm mt-4" style={{ color: "var(--color-ink-muted)" }}>No orders yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {transactions.map((tx) => {
            const isBuyer = tx.buyerId === currentUserId;
            const statusCopy = STATUS_COPY[tx.status];
            const canConfirmDelivery = isBuyer && tx.status === "FIRST_RELEASED";
            const canDispute = isBuyer && ["PAYMENT_HELD", "FIRST_RELEASED", "DELIVERY_CONFIRMED"].includes(tx.status);

            return (
              <div key={tx.id} className="p-4 rounded-[var(--radius-md)] border" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-ink)" }}>{tx.listing?.title ?? "Listing"}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--color-ink-faint)" }}>
                      {isBuyer ? "You bought this" : "You sold this"} · {new Date(tx.createdAt).toLocaleDateString("en-NG")}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={TONE_STYLES[statusCopy.tone]}>
                    {statusCopy.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-3">
                  <span className="font-display font-bold text-base" style={{ color: "var(--color-ink)" }}>{formatNaira(tx.amount)}</span>
                  {(canConfirmDelivery || canDispute) && (
                    <div className="flex gap-2">
                      {canConfirmDelivery && (
                        <button
                          type="button"
                          disabled={busyId === tx.id}
                          onClick={() => confirmDelivery(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold disabled:opacity-60"
                          style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Confirm delivery
                        </button>
                      )}
                      {canDispute && (
                        <button
                          type="button"
                          disabled={busyId === tx.id}
                          onClick={() => setDisputeTarget(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border disabled:opacity-60"
                          style={{ borderColor: "var(--color-line-strong)", color: "var(--color-ink-muted)" }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" /> Raise dispute
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {disputeTarget && (
        <DisputeModal
          transaction={disputeTarget}
          isSubmitting={busyId === disputeTarget.id}
          onCancel={() => setDisputeTarget(null)}
          onSubmit={submitDispute}
        />
      )}
    </div>
  );
}

function DisputeModal({
  transaction,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  transaction: Transaction;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button aria-label="Close" onClick={onCancel} className="absolute inset-0" style={{ background: "rgba(28,26,22,0.4)" }} />
      <div className="relative w-full sm:max-w-md rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] p-5" style={{ background: "var(--color-paper)" }}>
        <h3 className="font-display font-bold text-lg" style={{ color: "var(--color-ink)" }}>Raise a dispute</h3>
        <p className="text-[13px] mt-1" style={{ color: "var(--color-ink-muted)" }}>
          This freezes escrow on "{transaction.listing?.title}" immediately. An officer will review it — you get one appeal if you disagree with the resolution.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="What went wrong?"
          className="w-full mt-3 px-3.5 py-2.5 rounded-[var(--radius-sm)] text-sm outline-none border focus:border-[var(--color-brand-500)]"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
        />
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-full text-sm font-medium border" style={{ borderColor: "var(--color-line-strong)", color: "var(--color-ink-muted)" }}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason.trim() || isSubmitting}
            onClick={() => onSubmit(reason.trim())}
            className="flex-1 py-3 rounded-full text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--color-caution-500)", color: "#FFFDF8" }}
          >
            {isSubmitting ? "Submitting…" : "Submit dispute"}
          </button>
        </div>
      </div>
    </div>
  );
}
