/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { SUGGESTED_CATEGORIES } from "../../types/backend";

interface CategoryRailProps {
  active: string | "All";
  onSelect: (category: string | "All") => void;
}

const OPTIONS: { key: string | "All"; label: string }[] = [
  { key: "All", label: "All" },
  ...SUGGESTED_CATEGORIES.map((c) => ({ key: c, label: c })),
];

export default function CategoryRail({ active, onSelect }: CategoryRailProps) {
  return (
    <div
      className="sticky top-[65px] z-20 py-3"
      style={{ background: "color-mix(in srgb, var(--color-paper) 92%, transparent)", backdropFilter: "blur(6px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar">
        {OPTIONS.map((cat) => {
          const isActive = cat.key === active;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
              style={
                isActive
                  ? { background: "var(--color-ink)", borderColor: "var(--color-ink)", color: "var(--color-paper)" }
                  : { background: "var(--color-surface)", borderColor: "var(--color-line)", color: "var(--color-ink-muted)" }
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
