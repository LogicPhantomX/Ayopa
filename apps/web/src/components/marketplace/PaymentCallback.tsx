/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { getApiClient, ApiError } from "../../api/client";
import { formatNaira } from "../../lib/format";
import { clearQueue, getQueue, markCurrentFailed, markCurrentPaid, PaymentQueue } from "../../lib/paymentQueue";

interface PaymentCallbackProps {
  reference: string;
  onDone: () => void;
}

type Phase = "verifying" | "success" | "failed" | "complete";

export default function PaymentCallback({ reference, onDone }: PaymentCallbackProps) {
  const api = getApiClient();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [queue, setQueue] = useState<PaymentQueue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    // Strip ?reference/&trxref from the URL immediately so a page refresh
    // doesn't re-trigger verification of an already-handled payment.
    window.history.replaceState({}, "", window.location.pathname);

    api.paystack
      .verify(reference)
      .then((result) => {
        if (result.data.status === "success") {
          const next = markCurrentPaid();
          setQueue(next);
          setPhase(next && next.pending.length > 0 ? "success" : "complete");
          if (next && next.pending.length === 0) clearQueue();
        } else {
          const next = markCurrentFailed();
          setQueue(next);
          setPhase("failed");
        }
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Couldn't verify that payment.");
        setPhase("failed");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  const continueQueue = async () => {
    const current = getQueue();
    if (!current || current.pending.length === 0) return;
    setIsContinuing(true);
    try {
      const next = current.pending[0];
      const callbackUrl = `${window.location.origin}${window.location.pathname}`;
      const init = await api.paystack.initialize({ email: current.email, amount: next.amount, transactionId: next.transactionId, callbackUrl });
      window.location.href = init.data.authorization_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the next payment.");
      setIsContinuing(false);
    }
  };

  if (phase === "verifying") {
    return (
      <div className="max-w-sm mx-auto px-6 py-24 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{ color: "var(--color-brand-500)" }} />
        <p className="mt-4 text-sm" style={{ color: "var(--color-ink-muted)" }}>Confirming your payment with Paystack…</p>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5" style={{ background: "var(--color-caution-100)" }}>
          <AlertTriangle className="w-7 h-7" style={{ color: "var(--color-caution-500)" }} />
        </div>
        <h1 className="font-display font-extrabold text-2xl" style={{ color: "var(--color-ink)" }}>Payment not confirmed</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-ink-muted)" }}>
          {error ?? "Paystack didn't report this payment as successful. No funds were moved to escrow for this item."}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="w-full mt-6 py-3.5 rounded-full font-semibold text-sm"
          style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
        >
          Back to Ayopá
        </button>
      </div>
    );
  }

  const justPaid = queue?.paid[queue.paid.length - 1];

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center animate-[slideUp_0.3s_ease-out]">
      <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-5" style={{ background: "var(--color-trust-100)" }}>
        <CheckCircle2 className="w-7 h-7" style={{ color: "var(--color-trust-500)" }} />
      </div>
      <h1 className="font-display font-extrabold text-2xl" style={{ color: "var(--color-ink)" }}>Payment secured in escrow</h1>
      {justPaid && (
        <p className="text-sm mt-2" style={{ color: "var(--color-ink-muted)" }}>
          {formatNaira(justPaid.amount)} for {justPaid.listingTitle} is held safely and will only be released to the
          seller once you confirm delivery.
        </p>
      )}

      {phase === "success" && queue && queue.pending.length > 0 ? (
        <>
          <p className="text-[13px] mt-4" style={{ color: "var(--color-ink-faint)" }}>
            {queue.pending.length} more payment{queue.pending.length === 1 ? "" : "s"} to finish your order.
          </p>
          {error && <p className="text-[13px] mt-2" style={{ color: "var(--color-caution-500)" }}>{error}</p>}
          <button
            type="button"
            onClick={continueQueue}
            disabled={isContinuing}
            className="w-full mt-4 py-3.5 rounded-full font-semibold text-sm disabled:opacity-60"
            style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
          >
            {isContinuing ? "Opening Paystack…" : `Pay for ${queue.pending[0].listingTitle}`}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onDone}
          className="w-full mt-6 py-3.5 rounded-full font-semibold text-sm"
          style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
        >
          Continue browsing
        </button>
      )}
    </div>
  );
}
