/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShoppingBag, Store, Scale } from "lucide-react";

export type Route = "marketplace" | "seller" | "admin";

interface TopNavProps {
  route: Route;
  onChange: (route: Route) => void;
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? "bg-[#D4A017] text-black" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Deliberately plain (not sticky) so it doesn't fight MarketHeader's own
// sticky top-0 bar when the marketplace screen is active.
export default function TopNav({ route, onChange }: TopNavProps) {
  return (
    <div className="bg-black border-b border-zinc-900 py-2 px-4 flex items-center justify-center">
      <nav className="flex items-center bg-zinc-900/50 border border-zinc-850 p-1 rounded-xl gap-1">
        <Tab active={route === "marketplace"} onClick={() => onChange("marketplace")} icon={<ShoppingBag className="w-3.5 h-3.5" />} label="Marketplace" />
        <Tab active={route === "seller"} onClick={() => onChange("seller")} icon={<Store className="w-3.5 h-3.5" />} label="Sell on Ayopá" />
        <Tab active={route === "admin"} onClick={() => onChange("admin")} icon={<Scale className="w-3.5 h-3.5" />} label="Staff Admin" />
      </nav>
    </div>
  );
}
