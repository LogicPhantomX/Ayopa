/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { getApiClient, ApiError } from "../../api/client";
import { OtpVerifyResult } from "../../api/types";

interface OtpAuthGateProps {
  onVerified: (result: OtpVerifyResult) => void;
}

export default function OtpAuthGate({ onVerified }: OtpAuthGateProps) {
  const api = getApiClient();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.auth.requestOtp(phone.trim());
      setDevHint(
        result.devMode
          ? "Dev mode is on — the 6-digit code was logged to the API server's console."
          : `Code sent to ${result.phone}.`
      );
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send a code. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.auth.verifyOtp(phone.trim(), code.trim());
      onVerified(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't verify that code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-5" style={{ background: "var(--color-brand-50)" }}>
        <ShieldCheck className="w-6 h-6" style={{ color: "var(--color-brand-600)" }} />
      </div>
      <h2 className="font-display font-bold text-xl" style={{ color: "var(--color-ink)" }}>
        One quick step before checkout
      </h2>
      <p className="text-sm mt-2" style={{ color: "var(--color-ink-muted)" }}>
        We just need to confirm it's you so your escrow payment is tied to the right account.
      </p>

      {step === "phone" ? (
        <form onSubmit={requestOtp} className="mt-6 space-y-3 text-left">
          <label className="block">
            <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>Phone number</span>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-ink-faint)" }} />
              <input
                type="tel"
                required
                autoFocus
                placeholder="+2348012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] text-sm outline-none border focus:border-[var(--color-brand-500)]"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
              />
            </div>
          </label>
          {error && <p className="text-[13px]" style={{ color: "var(--color-caution-500)" }}>{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full font-semibold text-sm disabled:opacity-60"
            style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
          >
            {isSubmitting ? "Sending code…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-6 space-y-3 text-left">
          {devHint && <p className="text-[13px]" style={{ color: "var(--color-ink-muted)" }}>{devHint}</p>}
          <label className="block">
            <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>6-digit code</span>
            <input
              type="text"
              inputMode="numeric"
              required
              autoFocus
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full mt-1.5 px-4 py-3 rounded-[var(--radius-md)] text-sm tracking-[0.3em] font-semibold outline-none border focus:border-[var(--color-brand-500)]"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
            />
          </label>
          {error && <p className="text-[13px]" style={{ color: "var(--color-caution-500)" }}>{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full font-semibold text-sm disabled:opacity-60"
            style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
          >
            {isSubmitting ? "Verifying…" : "Verify & continue"}
          </button>
          <button type="button" onClick={() => setStep("phone")} className="w-full text-[13px] font-medium py-1" style={{ color: "var(--color-ink-muted)" }}>
            Use a different number
          </button>
        </form>
      )}
    </div>
  );
}
