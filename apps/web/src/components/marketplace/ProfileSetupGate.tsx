/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User as UserIcon } from "lucide-react";
import { getApiClient, ApiError } from "../../api/client";
import { BackendUser } from "../../types/backend";

interface ProfileSetupGateProps {
  onComplete: (user: BackendUser) => void;
}

export default function ProfileSetupGate({ onComplete }: ProfileSetupGateProps) {
  const api = getApiClient();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.auth.setupProfile(fullName.trim(), role);
      onComplete(result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-5" style={{ background: "var(--color-brand-50)" }}>
        <UserIcon className="w-6 h-6" style={{ color: "var(--color-brand-600)" }} />
      </div>
      <h2 className="font-display font-bold text-xl" style={{ color: "var(--color-ink)" }}>
        Tell us who you are
      </h2>
      <p className="text-sm mt-2" style={{ color: "var(--color-ink-muted)" }}>
        First time here — this finishes your account so you can buy or sell on Ayopá.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        <label className="block">
          <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>Full name</span>
          <input
            type="text"
            required
            minLength={2}
            autoFocus
            placeholder="Emeka Okafor"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-[var(--radius-md)] text-sm outline-none border focus:border-[var(--color-brand-500)]"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-ink)" }}
          />
        </label>

        <div>
          <span className="text-[13px] font-medium block mb-1.5" style={{ color: "var(--color-ink)" }}>I want to</span>
          <div className="grid grid-cols-2 gap-2">
            {(["buyer", "seller"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="py-3 rounded-[var(--radius-md)] text-sm font-medium border transition-colors"
                style={
                  role === r
                    ? { borderColor: "var(--color-brand-500)", background: "var(--color-brand-50)", color: "var(--color-brand-700)" }
                    : { borderColor: "var(--color-line)", color: "var(--color-ink-muted)" }
                }
              >
                {r === "buyer" ? "Buy livestock" : "Sell livestock"}
              </button>
            ))}
          </div>
          {role === "seller" && (
            <p className="text-[12px] mt-2" style={{ color: "var(--color-ink-faint)" }}>
              Selling requires KYC verification after this step.
            </p>
          )}
        </div>

        {error && <p className="text-[13px]" style={{ color: "var(--color-caution-500)" }}>{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-full font-semibold text-sm disabled:opacity-60"
          style={{ background: "var(--color-brand-500)", color: "var(--color-ink-on-accent)" }}
        >
          {isSubmitting ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
