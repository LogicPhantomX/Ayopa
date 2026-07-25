/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  quantity: number;
  min?: number;
  max?: number;
  unit?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  onChange: (next: number) => void;
}

export default function QuantityStepper({
  quantity,
  min = 1,
  max = 999,
  unit,
  size = "md",
  disabled,
  onChange,
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, quantity - 1));
  const inc = () => onChange(Math.min(max, quantity + 1));

  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className="inline-flex items-center rounded-full border"
      style={{ borderColor: "var(--color-line-strong)", background: "var(--color-surface)" }}
    >
      <button
        type="button"
        aria-label={`Decrease quantity${unit ? ` (${unit})` : ""}`}
        disabled={disabled || quantity <= min}
        onClick={dec}
        className={`${btnSize} flex items-center justify-center rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] active:scale-95`}
      >
        <Minus className="w-3.5 h-3.5" style={{ color: "var(--color-ink)" }} strokeWidth={2.5} />
      </button>

      <span
        className={`${textSize} font-semibold tabular-nums select-none min-w-[2ch] text-center`}
        style={{ color: "var(--color-ink)" }}
        aria-live="polite"
      >
        {quantity}
      </span>

      <button
        type="button"
        aria-label={`Increase quantity${unit ? ` (${unit})` : ""}`}
        disabled={disabled || quantity >= max}
        onClick={inc}
        className={`${btnSize} flex items-center justify-center rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] active:scale-95`}
      >
        <Plus className="w-3.5 h-3.5" style={{ color: "var(--color-ink)" }} strokeWidth={2.5} />
      </button>
    </div>
  );
}
